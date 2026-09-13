import os
import uuid
import logging
from typing import Tuple, Optional
from PIL import Image, ImageEnhance, ImageFilter
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_DIMENSION = 1200  # Max dimension for processed images
CANVAS_BG_COLOR = (250, 250, 250)  # Professional off-white background for products


class ImageService:
    """
    Product photo enhancement service for Karigar AI.
    
    Capabilities:
    - Validates uploaded images (format, size, integrity)
    - Saves original image unchanged
    - AI background removal using rembg (U-Net model) - GENUINE AI
    - Lighting/contrast enhancement using PIL - traditional image processing
    - Professional e-commerce canvas formatting
    """

    def __init__(self):
        self.upload_base = os.path.abspath(
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), settings.UPLOAD_DIR)
        )
        self.products_dir = os.path.join(self.upload_base, "products")
        os.makedirs(self.products_dir, exist_ok=True)

        # Try to import rembg - it's optional for graceful degradation
        self._rembg_available = False
        self._rembg_remove = None
        try:
            from rembg import remove
            self._rembg_available = True
            self._rembg_remove = remove
            logger.info("rembg AI background removal available")
        except Exception as e:
            logger.warning(f"rembg not available: {e}. Background removal will be disabled.")

    def validate_and_save_product_image(self, file: UploadFile) -> Tuple[str, str, str, str]:
        """
        Validates and saves the original product image.
        Returns (rel_original, original_abs_path, enhanced_abs_path, rel_enhanced).
        Does NOT perform enhancement - that happens in the background.
        """
        # 1. Check file size
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
            )

        # 2. Check extension & MIME type
        filename = file.filename or "upload.jpg"
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP."
            )

        # 3. Read and validate image with Pillow
        try:
            image = Image.open(file.file)
            image.verify()
            file.file.seek(0)
            image = Image.open(file.file)
            image.load()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Corrupted or invalid image file."
            )

        # 4. Generate unique filenames
        unique_id = str(uuid.uuid4())
        original_filename = f"{unique_id}_original{ext}"
        enhanced_filename = f"{unique_id}_enhanced.jpg"

        original_abs_path = os.path.join(self.products_dir, original_filename)
        enhanced_abs_path = os.path.join(self.products_dir, enhanced_filename)

        # 5. Save original image UNCHANGED
        image.save(original_abs_path)
        logger.info(f"Original image saved: {original_filename}")

        # 6. Return relative and absolute paths (enhancement happens in background)
        rel_original = f"{settings.UPLOAD_DIR}/products/{original_filename}".replace("\\", "/")
        rel_enhanced = f"{settings.UPLOAD_DIR}/products/{enhanced_filename}".replace("\\", "/")

        return rel_original, original_abs_path, enhanced_abs_path, rel_enhanced

    def perform_enhancement(self, original_abs_path: str, enhanced_abs_path: str):
        """
        Loads the original image, runs the AI enhancement pipeline, and saves the result.
        This method is designed to be called from a background task.
        Preserves the existing fallback behavior if enhancement fails.
        """
        logger.info(f"Starting image enhancement: {original_abs_path}")

        image = Image.open(original_abs_path)
        image.load()

        try:
            enhanced_img = self._enhance_image(image)
            enhanced_img.save(enhanced_abs_path, format="JPEG", quality=90)
            logger.info(f"Image enhancement successful, saved to {enhanced_abs_path}")
        except Exception as e:
            logger.error(f"Image enhancement failed: {e}. Saving fallback version.")
            try:
                fallback_img = image.convert("RGB")
                if fallback_img.width > MAX_DIMENSION or fallback_img.height > MAX_DIMENSION:
                    fallback_img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
                fallback_img.save(enhanced_abs_path, format="JPEG", quality=85)
                logger.info(f"Fallback enhancement saved to {enhanced_abs_path}")
            except Exception as e2:
                logger.error(f"Fallback enhancement also failed: {e2}")
                raise

    def _enhance_image(self, image: Image.Image) -> Image.Image:
        """
        Apply AI enhancement pipeline to product image.
        
        Pipeline stages:
        1. AI Background Removal (rembg/U-Net) - GENUINE AI
        2. Lighting & Color Enhancement (PIL) - traditional processing
        3. Professional Canvas Placement
        """
        if image.mode != "RGBA":
            image = image.convert("RGBA")

        # Stage 1: AI Background Removal
        if self._rembg_available and self._rembg_remove:
            try:
                # rembg uses U-Net deep learning model - genuine AI enhancement
                image = self._rembg_remove(image)
                logger.debug("AI background removal completed via rembg/U-Net")
            except Exception as e:
                logger.warning(f"AI background removal failed: {e}. Keeping original background.")
                image = image.convert("RGB")
        else:
            logger.info("AI background removal unavailable. Skipping background removal.")
            image = image.convert("RGB")

        # Stage 2: Lighting and Color Enhancement
        if image.mode == "RGBA":
            r, g, b, a = image.split()
            rgb_image = Image.merge("RGB", (r, g, b))
            rgb_image = self._enhance_lighting(rgb_image)
            r, g, b = rgb_image.split()
            image = Image.merge("RGBA", (r, g, b, a))
        else:
            image = self._enhance_lighting(image)

        # Stage 3: Professional Canvas Placement
        image = self._place_on_canvas(image)

        return image

    def _enhance_lighting(self, image: Image.Image) -> Image.Image:
        """
        Apply lighting and color enhancements using traditional image processing.
        
        NOT AI - these are standard PIL image enhancement techniques:
        - Brightness adjustment
        - Contrast enhancement
        - Color balance improvement
        - Slight sharpening
        """
        if image.mode != "RGB":
            image = image.convert("RGB")

        image = ImageEnhance.Brightness(image).enhance(1.1)
        image = ImageEnhance.Contrast(image).enhance(1.15)
        image = ImageEnhance.Color(image).enhance(1.05)
        image = image.filter(ImageFilter.UnsharpMask(radius=0.5, percent=50, threshold=3))

        return image

    def _place_on_canvas(self, image: Image.Image) -> Image.Image:
        """
        Place product image on professional e-commerce canvas.
        
        For images with transparency (after background removal):
        - Places on clean off-white background
        - Adds subtle shadow for depth perception
        """
        max_dim = MAX_DIMENSION

        if image.mode == "RGBA":
            bbox = image.getbbox()
            if bbox:
                padding = 20
                cropped = image.crop((
                    max(0, bbox[0] - padding),
                    max(0, bbox[1] - padding),
                    min(image.width, bbox[2] + padding),
                    min(image.height, bbox[3] + padding)
                ))

                if cropped.width > max_dim or cropped.height > max_dim:
                    cropped.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

                canvas_width = max(min(cropped.width + 40, max_dim), 200)
                canvas_height = max(min(cropped.height + 40, max_dim), 200)

                canvas = Image.new("RGBA", (canvas_width, canvas_height), CANVAS_BG_COLOR + (255,))

                x_offset = (canvas_width - cropped.width) // 2
                y_offset = (canvas_height - cropped.height) // 2

                # Create subtle shadow
                shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
                shadow_draw = Image.new("RGBA", cropped.size, (0, 0, 0, 40))
                shadow.paste(shadow_draw, (x_offset + 4, y_offset + 4), shadow_draw)
                shadow = shadow.filter(ImageFilter.GaussianBlur(radius=8))

                canvas = Image.alpha_composite(canvas, shadow)
                canvas.alpha_composite(cropped, (x_offset, y_offset))

                return canvas.convert("RGB")
            else:
                return image.convert("RGB")
        else:
            if image.width > max_dim or image.height > max_dim:
                image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            return image

    def get_enhancement_status(self) -> dict:
        """Returns the current enhancement capabilities status."""
        return {
            "ai_background_removal": {
                "available": self._rembg_available,
                "model": "U-Net (via rembg)" if self._rembg_available else None,
                "description": "AI-powered background removal using deep learning" if self._rembg_available else "Not available - rembg not installed"
            },
            "lighting_enhancement": {
                "available": True,
                "method": "PIL ImageEnhance (traditional processing)",
                "description": "Brightness, contrast, and color adjustment (not AI)"
            },
            "canvas_formatting": {
                "available": True,
                "description": "Professional e-commerce canvas with subtle shadow"
            }
        }


image_service = ImageService()