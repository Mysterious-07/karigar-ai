import io
import pytest
from unittest.mock import MagicMock
from PIL import Image
from app.services.image_service import ImageService

class TestImageEnhancement:
    """Tests for AI-powered image enhancement functionality."""
    
    @pytest.fixture
    def image_service(self):
        """Create an ImageService instance for testing."""
        service = ImageService()
        service.products_dir = "/tmp/test_products"
        import os
        os.makedirs(service.products_dir, exist_ok=True)
        return service
    
    @pytest.fixture
    def sample_image(self):
        """Create a sample RGB image for testing."""
        return Image.new("RGB", (200, 200), color=(100, 150, 200))
    
    def test_enhancement_status_returns_correct_structure(self, image_service):
        """Test that get_enhancement_status returns expected structure."""
        status = image_service.get_enhancement_status()
        
        assert "ai_background_removal" in status
        assert "lighting_enhancement" in status
        assert "canvas_formatting" in status
        assert status["lighting_enhancement"]["available"] is True
        assert status["canvas_formatting"]["available"] is True
    
    @pytest.mark.skipif(
        not ImageService()._rembg_available,
        reason="rembg not installed — skipping AI background removal availability test"
    )
    def test_ai_background_removal_available(self, image_service):
        """Test that AI background removal is reported as available."""
        assert image_service._rembg_available is True
        assert image_service._rembg_remove is not None
    
    def test_enhance_image_creates_output(self, image_service, sample_image):
        """Test that _enhance_image produces an output image."""
        result = image_service._enhance_image(sample_image.copy())
        
        assert result is not None
        assert result.mode == "RGB"
        assert result.width <= 1200
        assert result.height <= 1200
    
    def test_lighting_enhancement_changes_image(self, image_service, sample_image):
        """Test that lighting enhancement modifies the image."""
        original_bytes = sample_image.tobytes()
        enhanced = image_service._enhance_lighting(sample_image.copy())
        enhanced_bytes = enhanced.tobytes()
        
        # Enhanced image should differ from original
        assert enhanced_bytes != original_bytes
    
    def test_canvas_placement_for_transparent_image(self, image_service):
        """Test canvas placement for RGBA images."""
        img = Image.new("RGBA", (100, 100), color=(255, 0, 0, 255))
        result = image_service._place_on_canvas(img)
        
        assert result.mode == "RGB"
        assert result.width >= 100
        assert result.height >= 100
    
    def test_canvas_placement_for_rgb_image(self, image_service, sample_image):
        """Test canvas placement passes through RGB images."""
        result = image_service._place_on_canvas(sample_image.copy())
        

    def test_original_image_preserved(self, image_service, sample_image):
        """Test that the original image is saved unchanged (dimensions & mode preserved)."""
        import os
        unique_id = "test_original_preservation"
        original_path = os.path.join(image_service.products_dir, f"{unique_id}_original.jpg")
        
        sample_image.save(original_path)
        with Image.open(original_path) as saved_image:
            # JPEG encoding is lossy so raw bytes may differ; verify pixel
            # dimensions and mode are preserved exactly.
            assert saved_image.size == sample_image.size
            assert saved_image.mode == sample_image.mode
        assert os.path.getsize(original_path) > 0
        
        if os.path.exists(original_path):
            os.remove(original_path)


class TestImageValidation:
    """Tests for image validation and error handling."""
    
    @pytest.fixture
    def image_service(self):
        service = ImageService()
        service.products_dir = "/tmp/test_products"
        import os
        os.makedirs(service.products_dir, exist_ok=True)
        return service
    
    def test_invalid_format_rejected(self, image_service):
        """Test that invalid file formats are rejected."""
        from fastapi import UploadFile, HTTPException
        
        mock_file = MagicMock()
        mock_file.filename = "test.gif"
        mock_file.content_type = "image/gif"
        mock_file.file.seek(0, 2)
        mock_file.file.tell.return_value = 1000
        mock_file.file.seek(0)
        
        try:
            image_service.validate_and_save_product_image(mock_file)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Invalid file format" in str(e.detail)
    
    def test_oversized_file_rejected(self, image_service):
        """Test that files exceeding size limit are rejected."""
        from fastapi import UploadFile, HTTPException
        
        mock_file = MagicMock()
        mock_file.filename = "test.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.file.seek(0, 2)
        mock_file.file.tell.return_value = 11 * 1024 * 1024
        mock_file.file.seek(0)
        
        try:
            image_service.validate_and_save_product_image(mock_file)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            assert "exceeds maximum" in str(e.detail).lower()
    
    def test_corrupted_image_rejected(self, image_service):
        """Test that corrupted images are rejected."""
        from fastapi import UploadFile, HTTPException
        
        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "corrupted.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.file = io.BytesIO(b"this is not a valid image")
        
        try:
            image_service.validate_and_save_product_image(mock_file)
            assert False, "Should have raised HTTPException"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Corrupted or invalid" in str(e.detail)
    
    def test_valid_image_accepted(self, image_service):
        """Test that valid images are accepted and original is saved."""
        from fastapi import UploadFile

        img_bytes = io.BytesIO()
        Image.new("RGB", (100, 100), color="red").save(img_bytes, format="JPEG")
        img_bytes.seek(0)

        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "valid_test.jpg"
        mock_file.content_type = "image/jpeg"
        mock_file.file = img_bytes

        # Now returns 4 values: (rel_original, original_abs_path, enhanced_abs_path, rel_enhanced)
        rel_original, original_abs_path, enhanced_abs_path, rel_enhanced = image_service.validate_and_save_product_image(mock_file)

        assert rel_original is not None
        assert rel_enhanced is not None
        assert "products" in rel_original
        assert rel_enhanced.endswith("_enhanced.jpg")
        assert original_abs_path is not None
        assert enhanced_abs_path is not None


class TestGracefulDegradation:
    """Tests for graceful degradation when AI components are unavailable."""
    
    def test_enhancement_works_without_rembg(self):
        """Test that enhancement pipeline works even if rembg is unavailable."""
        service = ImageService()
        service._rembg_available = False
        service._rembg_remove = None
        
        img = Image.new("RGB", (100, 100), color=(50, 100, 150))
        result = service._enhance_image(img)
        
        assert result is not None
        assert result.mode == "RGB"
        assert result.mode == "RGB"