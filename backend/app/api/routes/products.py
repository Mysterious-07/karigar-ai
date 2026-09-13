from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
import logging

from app.db.database import get_db, SessionLocal
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.schemas.catalog import CatalogGenerationRequest, CatalogApiResponse
from app.services.image_service import image_service
from app.services.catalog_service import catalog_service
from app.services.ai_client import AIClientError
from app.api.deps import get_current_artisan, get_optional_artisan, verify_product_ownership

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Products"])


def _background_enhance_image(
    product_id: UUID,
    original_image_saved: str,
    original_abs_path: str,
    enhanced_abs_path: str,
    enhanced_rel_path: str,
):
    """
    Background task to enhance a product image.
    Creates its own SQLAlchemy session (does NOT reuse the request session).
    Includes a race condition guard: only updates processed_image if the
    product's current original_image still matches the image this task was created for.
    """
    logger.info(f"[Background] Starting image enhancement for product {product_id}")

    db = SessionLocal()
    try:
        # Step 1: Perform the actual image enhancement
        try:
            image_service.perform_enhancement(original_abs_path, enhanced_abs_path)
            logger.info(f"[Background] Enhancement completed for product {product_id}")
        except Exception as e:
            logger.error(f"[Background] Enhancement failed for product {product_id}: {e}")
            return

        # Step 2: Update the product's processed_image with race condition guard
        try:
            product = db.query(Product).filter(Product.id == product_id).first()
            if product is None:
                logger.warning(f"[Background] Product {product_id} not found, skipping update")
                return

            # Race condition guard: only update if original_image still matches
            if product.original_image != original_image_saved:
                logger.info(
                    f"[Background] Product {product_id} original_image changed "
                    f"(current: {product.original_image}, expected: {original_image_saved}). "
                    f"Skipping processed_image update to avoid overwriting newer image."
                )
                return

            product.processed_image = enhanced_rel_path
            db.commit()
            logger.info(f"[Background] Product {product_id} processed_image updated successfully")
        except Exception as e:
            logger.error(f"[Background] Database update failed for product {product_id}: {e}")
            db.rollback()
    except Exception as e:
        logger.error(f"[Background] Unexpected error in background enhancement for product {product_id}: {e}")
    finally:
        db.close()


@router.get("/products/me", response_model=List[ProductResponse])
def get_my_products(current_artisan: Artisan = Depends(get_current_artisan), db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.artisan_id == current_artisan.id).order_by(Product.created_at.desc()).all()


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Create a product for the authenticated artisan."""
    product_data = product_in.model_dump()
    product_data["artisan_id"] = current_artisan.id

    product = Product(**product_data)
    if not product.slug:
        from app.services.store_service import generate_product_slug
        product.slug = generate_product_slug(product.title, db)

    db.add(product)
    db.commit()
    db.refresh(product)

    # Auto-ensure artisan store exists and link product to store
    try:
        from app.services.store_service import ensure_artisan_store, add_product_to_store
        store = ensure_artisan_store(product.artisan_id, db)
        add_product_to_store(store.id, product.id, db)
    except Exception:
        pass

    return product


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    return product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: UUID,
    product_in: ProductUpdate,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Update a product. Only the product owner can modify it."""
    product = verify_product_ownership(product_id, current_artisan, db)

    update_data = product_in.model_dump(exclude_unset=True)
    update_data.pop("artisan_id", None)

    for field, value in update_data.items():
        setattr(product, field, value)

    # Recalculate quality score
    quality_score, _ = catalog_service.calculate_quality_score(product)
    product.ai_quality_score = quality_score

    db.commit()
    db.refresh(product)
    return product


@router.get("/artisans/{artisan_id}/products", response_model=List[ProductResponse])
def get_artisan_products(
    artisan_id: UUID,
    current_artisan: Artisan | None = Depends(get_optional_artisan),
    db: Session = Depends(get_db)
):
    """Get products for an artisan with ownership awareness."""
    if current_artisan is None:
        from app.db.models.store import StoreProduct
        store_products = db.query(StoreProduct).join(Product).filter(
            Product.artisan_id == artisan_id,
            StoreProduct.is_public == True,
            Product.status != "archived"
        ).all()
        return [sp.product for sp in store_products]

    if current_artisan.id != artisan_id:
        from app.db.models.store import StoreProduct
        store_products = db.query(StoreProduct).join(Product).filter(
            Product.artisan_id == artisan_id,
            StoreProduct.is_public == True,
            Product.status != "archived"
        ).all()
        return [sp.product for sp in store_products]

    return db.query(Product).filter(
        Product.artisan_id == artisan_id
    ).order_by(Product.created_at.desc()).all()


@router.post("/products/{product_id}/image", response_model=ProductResponse)
def upload_product_image(
    product_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db),
):
    """Upload product image. Only the product owner can upload.
    
    The original image is saved immediately and the HTTP response returns
    without waiting for AI enhancement. Enhancement runs in the background.
    """
    product = verify_product_ownership(product_id, current_artisan, db)

    # Validate and save the original image (fast — no enhancement yet)
    rel_original, original_abs_path, enhanced_abs_path, rel_enhanced = image_service.validate_and_save_product_image(file)

    # Update product: set original_image immediately, processed_image is None
    product.original_image = rel_original
    product.processed_image = None

    db.commit()
    db.refresh(product)

    # Schedule background enhancement task
    background_tasks.add_task(
        _background_enhance_image,
        product_id=product_id,
        original_image_saved=rel_original,
        original_abs_path=original_abs_path,
        enhanced_abs_path=enhanced_abs_path,
        enhanced_rel_path=rel_enhanced,
    )
    logger.info(f"[Upload] Image upload complete for product {product_id}, enhancement scheduled in background")

    return product


@router.get("/products/{product_id}/image/status")
def get_image_enhancement_status(
    product_id: UUID,
    current_artisan: Artisan | None = Depends(get_optional_artisan),
    db: Session = Depends(get_db)
):
    """Returns image enhancement status. Owners see full details."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )

    status_info = image_service.get_enhancement_status()
    status_info["product_has_enhanced_image"] = bool(product.processed_image)
    is_owner = current_artisan and product.artisan_id == current_artisan.id
    status_info["product_original_image"] = product.original_image if is_owner else None
    status_info["product_enhanced_image"] = product.processed_image if is_owner else None

    return status_info


@router.post("/products/{product_id}/generate-catalog", response_model=CatalogApiResponse)
def generate_catalog(
    product_id: UUID,
    body: CatalogGenerationRequest,
    current_artisan: Artisan = Depends(get_current_artisan),
    db: Session = Depends(get_db)
):
    """Generate catalog for a product. Only the product owner can trigger this."""
    product = verify_product_ownership(product_id, current_artisan, db)
    if body.language.lower() not in {"en", "hi", "mr"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported input language code. Supported languages: 'en' (English), 'hi' (Hindi), 'mr' (Marathi)."
        )
    if body.output_language.lower() not in {"en", "hi"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported output language code. Supported output languages: 'en' (English), 'hi' (Hindi)."
        )

    if not product.original_image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload a product photo before generating catalog."
        )

    try:
        return catalog_service.generate_and_save_catalog(
            db=db,
            product_id=product_id,
            description=body.description,
            language=body.language,
            output_language=body.output_language
        )
    except AIClientError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI catalog generation failed. Please try again. ({e.category})"
        )