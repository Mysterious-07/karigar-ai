import re
import uuid
from sqlalchemy.orm import Session
from app.db.models.store import Store, StoreProduct
from app.db.models.artisan import Artisan
from app.db.models.product import Product

def slugify(text: str) -> str:
    """
    Convert text to lowercase, URL-friendly slug.
    Replaces spaces and non-alphanumeric chars with hyphens.
    """
    if not text:
        return "store"
    # Convert to lowercase
    s = text.strip().lower()
    # Replace non-alphanumeric characters with hyphen
    s = re.sub(r'[^a-z0-9]+', '-', s)
    # Strip leading/trailing hyphens
    s = s.strip('-')
    return s or "store"

def generate_store_slug(artisan_name: str, craft_type: str, db: Session, current_store_id: uuid.UUID | None = None) -> str:
    """
    Generate unique store slug based on artisan name and craft type.
    Example: Ramesh Warli Art -> ramesh-warli-art
    Handles duplicate names by appending -2, -3, etc.
    """
    base_slug = slugify(f"{artisan_name} {craft_type}")
    slug = base_slug
    counter = 2

    while True:
        query = db.query(Store).filter(Store.slug == slug)
        if current_store_id:
            query = query.filter(Store.id != current_store_id)
        existing = query.first()
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

def generate_product_slug(title: str, db: Session, current_product_id: uuid.UUID | None = None) -> str:
    """
    Generate product slug based on title.
    Example: Traditional Warli Painting -> traditional-warli-painting
    Handles duplicate titles safely.
    """
    base_slug = slugify(title)
    slug = base_slug
    counter = 2

    while True:
        query = db.query(Product).filter(Product.slug == slug)
        if current_product_id:
            query = query.filter(Product.id != current_product_id)
        existing = query.first()
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

def ensure_artisan_store(artisan_id: uuid.UUID, db: Session) -> Store:
    """
    Get or automatically create a storefront for the given artisan.
    """
    store = db.query(Store).filter(Store.artisan_id == artisan_id).first()
    if store:
        if not store.slug:
            artisan = db.query(Artisan).filter(Artisan.id == artisan_id).first()
            name = artisan.name if artisan else "Artisan"
            craft = artisan.craft_type if artisan else "Craft"
            store.slug = generate_store_slug(name, craft, db, current_store_id=store.id)
            db.commit()
            db.refresh(store)
        return store

    artisan = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not artisan:
        raise ValueError(f"Artisan with id {artisan_id} not found")

    store_name = f"{artisan.name}'s Digital Store"
    slug = generate_store_slug(artisan.name, artisan.craft_type, db)

    store = Store(
        artisan_id=artisan_id,
        store_name=store_name,
        slug=slug,
        description=f"Handcrafted {artisan.craft_type} by {artisan.name} from {artisan.location}, {artisan.state}.",
        is_public=True,
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return store

def add_product_to_store(store_id: uuid.UUID, product_id: uuid.UUID, db: Session) -> StoreProduct:
    """
    Ensure a product is associated with the store in store_products.
    """
    existing = db.query(StoreProduct).filter(
        StoreProduct.store_id == store_id,
        StoreProduct.product_id == product_id
    ).first()

    if existing:
        return existing

    store_product = StoreProduct(
        store_id=store_id,
        product_id=product_id,
        is_public=True
    )
    db.add(store_product)
    db.commit()
    db.refresh(store_product)
    return store_product
