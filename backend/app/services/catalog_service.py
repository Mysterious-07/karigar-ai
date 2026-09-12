import os
import logging
from typing import List, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models.product import Product, ProductTag
from app.db.models.artisan import Artisan
from app.schemas.catalog import CatalogGenerationResponse, CatalogApiResponse
from app.schemas.product import ProductResponse
from app.services.grok_service import grok_service
from app.core.config import settings

logger = logging.getLogger("karigar_ai.catalog")

class CatalogService:
    def calculate_quality_score(self, product: Product) -> Tuple[float, List[str]]:
        """
        Calculates catalog quality score out of 100 and provides actionable suggestions.
        """
        score = 0.0
        suggestions = []

        # 1. Title (15 pts)
        if product.title and product.title.strip():
            score += 15.0
        else:
            suggestions.append("Adding a descriptive title improves buyer search visibility.")

        # 2. Description (20 pts)
        if product.description and len(product.description.strip()) > 10:
            score += 20.0
        else:
            suggestions.append("Providing a detailed product description increases buyer confidence.")

        # 3. Category (10 pts)
        if product.category and product.category.strip():
            score += 10.0
        else:
            suggestions.append("Setting a specific marketplace category helps buyers browse your product.")

        # 4. Craft Type (10 pts)
        if product.craft_type and product.craft_type.strip():
            score += 10.0
        else:
            suggestions.append("Specifying your exact craft technique highlights artisanal authenticity.")

        # 5. Material (10 pts)
        if product.material and product.material.strip() and product.material.lower() not in ("not specified", "not provided"):
            score += 10.0
        else:
            suggestions.append("Mentioning raw materials helps buyers understand product quality.")

        # 6. Production Time (10 pts)
        if product.production_time and product.production_time.strip() and product.production_time.lower() not in ("not specified", "not provided"):
            score += 10.0
        else:
            suggestions.append("Adding production time helps buyers estimate delivery schedules.")

        # 7. Tags (10 pts)
        if product.tags and len(product.tags) > 0:
            score += 10.0
        else:
            suggestions.append("Adding product tags improves discovery in buyer searches.")

        # 8. Artisan Story (15 pts)
        if product.artisan_story and len(product.artisan_story.strip()) > 15:
            score += 15.0
        else:
            suggestions.append("Sharing your artisan background creates a personal connection with buyers.")

        return min(100.0, score), suggestions

    def generate_and_save_catalog(
        self,
        db: Session,
        product_id: UUID,
        description: str,
        language: str = "en",
        output_language: str = "en"
    ) -> CatalogApiResponse:
        """
        Orchestrates AI catalog generation, output validation, database persistence, and quality scoring.
        - Stores the raw voice/text transcript separately (raw_transcript).
        - The final description is ONLY the AI-generated (or artisan-edited) content.
        """
        # 1. Fetch product
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found"
            )

        # 2. Fetch artisan
        artisan = db.query(Artisan).filter(Artisan.id == product.artisan_id).first()
        if not artisan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Artisan with id {product.artisan_id} not found"
            )

        # 3. Validate input: description required unless a vision model is configured (image-only input)
        vision_available = bool(settings.XAI_VISION_MODEL)
        has_text = bool(description and description.strip())
        if not has_text and not vision_available:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Product description cannot be empty. Please speak or type about your product."
            )

        # 4. Check product image path
        abs_img_path = None
        if product.original_image:
            # Map relative path to absolute
            abs_img_path = os.path.abspath(
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), product.original_image)
            )

        # 5. Store the raw transcript separately (never used as final description)
        if has_text:
            product.raw_transcript = description.strip()

        # 7. Call AI service
        catalog_ai: CatalogGenerationResponse = grok_service.generate_catalog(
            raw_description=description or "",
            craft_type=product.craft_type,
            language=language,
            output_language=output_language,
            artisan_name=artisan.name,
            artisan_location=artisan.location,
            artisan_state=artisan.state,
            image_path=abs_img_path if (abs_img_path and os.path.exists(abs_img_path)) else None
        )

        # 8. Update Product fields in PostgreSQL
        product.title = catalog_ai.title
        product.description = catalog_ai.description
        product.category = catalog_ai.category
        product.craft_type = catalog_ai.craft_type
        product.material = catalog_ai.material
        product.dimensions = catalog_ai.dimensions
        product.production_time = catalog_ai.production_time
        product.artisan_story = catalog_ai.artisan_story

        # 9. Update Tags in database
        db.query(ProductTag).filter(ProductTag.product_id == product_id).delete()
        for tag_str in catalog_ai.tags:
            if tag_str and tag_str.strip():
                tag_obj = ProductTag(product_id=product_id, tag=tag_str.strip())
                db.add(tag_obj)

        # 10. Calculate quality score
        quality_score, suggestions = self.calculate_quality_score(product)
        product.ai_quality_score = quality_score

        db.commit()
        db.refresh(product)

        return CatalogApiResponse(
            success=True,
            product=ProductResponse.model_validate(product),
            quality_score=quality_score,
            suggestions=suggestions
        )

catalog_service = CatalogService()
