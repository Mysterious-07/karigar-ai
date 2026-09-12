import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.db.models import Base
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.db.models.store import Store, StoreProduct
from app.db.models.enquiry import Enquiry
from app.db.models.match import BuyerMatch
from app.db.models.buyer import Buyer
from app.db.seed_buyers import seed_demo_buyers
from app.services.store_service import ensure_artisan_store, add_product_to_store
from app.services.qr_service import save_store_qr_code

logger = logging.getLogger("karigar_ai.seed_data")

def seed_full_demo_data():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        # 1. Seed demo buyers first
        seed_demo_buyers(db)

        # 2. Check if demo artisan Ramesh exists or create
        artisan = db.query(Artisan).filter(Artisan.name == "Ramesh").first()
        if not artisan:
            artisan = Artisan(
                name="Ramesh",
                phone="9876543210",
                email="ramesh.warli@example.com",
                location="Palghar",
                state="Maharashtra",
                language="mr",
                craft_type="Warli Art",
                bio="Master Warli artist from Palghar, Maharashtra with over 15 years of experience preserving traditional Maharashtrian tribal art on handmade paper and terracotta."
            )
            db.add(artisan)
            db.commit()
            db.refresh(artisan)
            print(f"Created demo artisan: {artisan.name} (ID: {artisan.id})")

        # 3. Ensure store exists for Ramesh
        store = ensure_artisan_store(artisan.id, db)
        store.store_name = "Ramesh Warli Art Store"
        store.slug = "ramesh-warli-art"
        store.description = "Handcrafted Warli tribal artwork by master artisan Ramesh from Maharashtra. Authentic folk art on handmade paper and natural canvas."
        store.is_public = True
        qr_path = save_store_qr_code(store.slug)
        store.qr_code_path = qr_path
        db.commit()
        db.refresh(store)
        print(f"Created/updated store: {store.store_name} (Slug: /store/{store.slug})")

        # 4. Check/create product 1: Traditional Warli Harvest Painting
        product1 = db.query(Product).filter(Product.title == "Traditional Warli Harvest Painting").first()
        if not product1:
            product1 = Product(
                artisan_id=artisan.id,
                title="Traditional Warli Harvest Painting",
                craft_type="Warli Art",
                category="Paintings & Wall Art",
                description="हा माझ्या हाताने बनवलेला वारली चित्र आहे. हे पारंपरिक वारली कलेवर आधारित आहे आणि मला हे बनवायला ३ दिवस लागले.",
                material="Handmade Rice Paper & Natural White Pigments",
                dimensions="18 x 24 inches",
                production_time="3 days",
                price=2200.0,
                material_cost=600.0,
                labour_cost=900.0,
                other_cost=200.0,
                suggested_min_price=1900.0,
                suggested_max_price=2500.0,
                suggested_price=2200.0,
                pricing_explanation="Cost Breakdown: Material (₹600) + Labor (₹900 for 3 days) + Overhead (₹200) = ₹1,700 base cost. Suggested selling range ₹1,900 - ₹2,500 ensures 25-45% profit margin for wholesale and retail.",
                pricing_confidence="High",
                artisan_story="Created by Ramesh in Palghar using authentic rice paste paint and traditional geometric Warli motifs depicting harvest celebrations.",
                ai_quality_score=88.0,
                status="active",
                slug="traditional-warli-harvest-painting"
            )
            db.add(product1)
            db.commit()
            db.refresh(product1)
            print(f"Created product: {product1.title}")

        # 5. Check/create product 2: Warli Tribal Ceremony Frame
        product2 = db.query(Product).filter(Product.title == "Warli Tribal Ceremony Frame").first()
        if not product2:
            product2 = Product(
                artisan_id=artisan.id,
                title="Warli Tribal Ceremony Frame",
                craft_type="Warli Art",
                category="Home Decor",
                description="Traditional circular dancing Warli ritual artwork framed in dark teak wood.",
                material="Canvas & Wood Frame",
                dimensions="12 x 12 inches",
                production_time="2 days",
                price=1600.0,
                suggested_min_price=1400.0,
                suggested_max_price=1800.0,
                suggested_price=1600.0,
                artisan_story="Hand-painted by Ramesh depicting Tarpa dance ceremonies.",
                ai_quality_score=85.0,
                status="active",
                slug="warli-tribal-ceremony-frame"
            )
            db.add(product2)
            db.commit()
            db.refresh(product2)
            print(f"Created product: {product2.title}")

        # 6. Associate products to store
        add_product_to_store(store.id, product1.id, db)
        add_product_to_store(store.id, product2.id, db)

        # 7. Seed Buyer Matches for Product 1
        buyers = db.query(Buyer).all()
        if buyers:
            b1 = buyers[0]  # Pune Heritage Home Decor
            b2 = buyers[2] if len(buyers) > 2 else buyers[0]  # Maharashtra Hotel Art Supply
            
            existing_match1 = db.query(BuyerMatch).filter(BuyerMatch.product_id == product1.id, BuyerMatch.buyer_id == b1.id).first()
            if not existing_match1:
                match1 = BuyerMatch(
                    product_id=product1.id,
                    buyer_id=b1.id,
                    match_score=92.0,
                    reason="High demand for Warli folk art paintings. Budget range (₹1,500-₹5,000) aligns perfectly with suggested price range.",
                    status="contacted"
                )
                db.add(match1)

            existing_match2 = db.query(BuyerMatch).filter(BuyerMatch.product_id == product1.id, BuyerMatch.buyer_id == b2.id).first()
            if not existing_match2:
                match2 = BuyerMatch(
                    product_id=product1.id,
                    buyer_id=b2.id,
                    match_score=88.0,
                    reason="Hospitality decor supplier regularly purchasing authentic Maharashtrian wall art in bulk.",
                    status="suggested"
                )
                db.add(match2)
            db.commit()

        # 8. Seed Customer Enquiries
        existing_enquiries = db.query(Enquiry).filter(Enquiry.store_id == store.id).all()
        if len(existing_enquiries) == 0:
            e1 = Enquiry(
                product_id=product1.id,
                store_id=store.id,
                visitor_name="Ananya Sen",
                visitor_contact="ananya.sen@corporate-gifts.com",
                message="Interested in ordering 10 pieces of Traditional Warli Harvest Painting for a Diwali corporate event.",
                status="new"
            )
            e2 = Enquiry(
                product_id=product2.id,
                store_id=store.id,
                visitor_name="Rajesh Verma",
                visitor_contact="+91 98112 23344",
                message="Can you customize dimensions for Warli Tribal Ceremony Frame to 16x16 inches for hotel room decor?",
                status="contacted"
            )
            db.add_all([e1, e2])
            db.commit()
            print("Created demo customer enquiries.")

        print("\n==========================================")
        print("DEMO DATA SEEDED SUCCESSFULLY!")
        print("==========================================")
        print(f"Artisan ID: {artisan.id}")
        print(f"Artisan Name: {artisan.name}")
        print(f"Store Slug: /store/{store.slug}")
        print(f"Public Storefront URL: http://localhost:3000/store/{store.slug}")
        print(f"QR Code URL: http://localhost:3000/dashboard/store/qr")
        print("==========================================")

    except Exception as e:
        logger.error(f"Error seeding demo data: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_full_demo_data()
