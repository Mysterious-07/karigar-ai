from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.db.models.store import Store, StoreProduct
from app.db.models.product import Product, ProductTag
from app.db.models.artisan import Artisan
from app.db.models.enquiry import Enquiry
from app.schemas.store import PublicStoreResponse, PublicProductItem
from app.schemas.enquiry import EnquiryCreate
from app.services.store_service import generate_product_slug

router = APIRouter(prefix="/public", tags=["Public Storefront"])

def build_public_product_item(product: Product, is_public: bool, db: Session) -> PublicProductItem:
    """Helper to convert Product model to PublicProductItem schema."""
    if not product.slug:
        product.slug = generate_product_slug(product.title, db, current_product_id=product.id)
        db.commit()
        db.refresh(product)

    tags = [t.tag for t in product.tags] if product.tags else []

    return PublicProductItem(
        id=product.id,
        slug=product.slug,
        title=product.title,
        description=product.description,
        category=product.category,
        craft_type=product.craft_type,
        material=product.material,
        dimensions=product.dimensions,
        production_time=product.production_time,
        price=product.price,
        suggested_min_price=product.suggested_min_price,
        suggested_max_price=product.suggested_max_price,
        suggested_price=product.suggested_price,
        original_image=product.original_image,
        processed_image=product.processed_image,
        artisan_story=product.artisan_story,
        tags=tags,
        is_public=is_public,
    )

@router.get("/stores/{slug}", response_model=PublicStoreResponse)
def get_public_store(slug: str, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.slug == slug).first()
    if not store or not store.is_public:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storefront not found or is private"
        )

    artisan = db.query(Artisan).filter(Artisan.id == store.artisan_id).first()
    if not artisan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artisan not found"
        )

    # Fetch store products
    store_products = db.query(StoreProduct).filter(
        StoreProduct.store_id == store.id,
        StoreProduct.is_public == True
    ).all()

    public_products: list[PublicProductItem] = []
    for sp in store_products:
        product = db.query(Product).filter(Product.id == sp.product_id).first()
        if product and product.status != "archived":
            public_products.append(build_public_product_item(product, sp.is_public, db))

    return PublicStoreResponse(
        id=store.id,
        store_name=store.store_name,
        slug=store.slug,
        description=store.description,
        qr_code_path=store.qr_code_path,
        is_public=store.is_public,
        artisan_name=artisan.name,
        craft_type=artisan.craft_type,
        location=artisan.location,
        state=artisan.state,
        bio=artisan.bio,
        profile_image=artisan.profile_image,
        products=public_products,
    )

@router.get("/stores/{slug}/products", response_model=list[PublicProductItem])
def get_public_store_products(slug: str, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.slug == slug).first()
    if not store or not store.is_public:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storefront not found or is private"
        )

    store_products = db.query(StoreProduct).filter(
        StoreProduct.store_id == store.id,
        StoreProduct.is_public == True
    ).all()

    public_products: list[PublicProductItem] = []
    for sp in store_products:
        product = db.query(Product).filter(Product.id == sp.product_id).first()
        if product and product.status != "archived":
            public_products.append(build_public_product_item(product, sp.is_public, db))

    return public_products

@router.get("/stores/{slug}/products/{product_slug}", response_model=PublicProductItem)
def get_public_product_detail(slug: str, product_slug: str, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.slug == slug).first()
    if not store or not store.is_public:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storefront not found or is private"
        )

    # Find product by slug or UUID string
    product = db.query(Product).filter(Product.slug == product_slug).first()
    if not product:
        # Fallback to UUID lookup if valid UUID string
        try:
            p_uuid = UUID(product_slug)
            product = db.query(Product).filter(Product.id == p_uuid).first()
        except ValueError:
            product = None

    if not product or product.status == "archived":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Check that product is associated with store and is_public == True
    store_product = db.query(StoreProduct).filter(
        StoreProduct.store_id == store.id,
        StoreProduct.product_id == product.id,
        StoreProduct.is_public == True
    ).first()

    if not store_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not available in this store"
        )

    return build_public_product_item(product, store_product.is_public, db)

@router.post("/products/{product_id}/enquiry", status_code=status.HTTP_201_CREATED)
def create_public_enquiry(product_id: UUID, enquiry_in: EnquiryCreate, db: Session = Depends(get_db)):
    # Use product_id from URL path (ignore body if provided)
    enquiry_product_id = product_id
    
    product = db.query(Product).filter(Product.id == enquiry_product_id).first()
    if not product or product.status == "archived":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Find store associated with product
    store_product = db.query(StoreProduct).filter(StoreProduct.product_id == enquiry_product_id).first()
    if store_product:
        store_id = store_product.store_id
    else:
        # Fallback to artisan store
        store = db.query(Store).filter(Store.artisan_id == product.artisan_id).first()
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found for this product"
            )
        store_id = store.id

    if not enquiry_in.message or not enquiry_in.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enquiry message cannot be empty"
        )

    enquiry = Enquiry(
        product_id=enquiry_product_id,
        store_id=store_id,
        visitor_name=enquiry_in.visitor_name.strip() if enquiry_in.visitor_name else None,
        visitor_contact=enquiry_in.visitor_contact.strip() if enquiry_in.visitor_contact else None,
        message=enquiry_in.message.strip(),
        status="new"
    )

    db.add(enquiry)
    db.commit()
    db.refresh(enquiry)

    return {
        "success": True,
        "message": "Your enquiry has been sent."
    }
