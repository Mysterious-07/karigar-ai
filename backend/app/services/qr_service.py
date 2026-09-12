import os
import io
import qrcode
from qrcode.image.pil import PilImage
from app.core.config import settings

def get_store_url(slug: str) -> str:
    """
    Construct full public URL for a store slug based on configuration.
    """
    base_url = settings.FRONTEND_URL.rstrip('/')
    return f"{base_url}/store/{slug}"

def generate_qr_code_bytes(target_url: str) -> bytes:
    """
    Generate QR code image bytes (PNG) for a given target URL.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def save_store_qr_code(slug: str) -> str:
    """
    Generate and save store QR code PNG file to UPLOAD_DIR/qr/{slug}.png.
    Returns relative web path (e.g. /uploads/qr/{slug}.png).
    """
    store_url = get_store_url(slug)
    qr_bytes = generate_qr_code_bytes(store_url)

    abs_upload_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), settings.UPLOAD_DIR))
    qr_dir = os.path.join(abs_upload_dir, "qr")
    os.makedirs(qr_dir, exist_ok=True)

    file_name = f"{slug}.png"
    file_path = os.path.join(qr_dir, file_name)

    with open(file_path, "wb") as f:
        f.write(qr_bytes)

    return f"/uploads/qr/{file_name}"
