import logging
from sqlalchemy.orm import Session
from app.db.models.buyer import Buyer

logger = logging.getLogger("karigar_ai.seed")

DEMO_BUYERS = [
    {
        "business_name": "Pune Heritage Home Decor",
        "buyer_type": "Home Decor Store",
        "location": "Pune, Maharashtra",
        "requirements": "Looking for traditional Indian folk art wall hangings, Warli paintings, and handcrafted pottery for luxury home decor clients.",
        "min_order_quantity": 10,
        "category": "Home Decor & Wall Art",
        "preferred_crafts": "Warli Art, Pottery & Ceramics, Terracotta & Clay Art",
        "preferred_categories": "Paintings & Wall Art, Home Decor",
        "budget_min": 1500.0,
        "budget_max": 5000.0,
        "bulk_order_interest": "Yes"
    },
    {
        "business_name": "Mumbai Boutique Living",
        "buyer_type": "Boutique",
        "location": "Mumbai, Maharashtra",
        "requirements": "Premium fashion boutique looking for authentic Banarasi silk sarees, Chikankari embroidery, and handloom apparel.",
        "min_order_quantity": 5,
        "category": "Fashion & Textiles",
        "preferred_crafts": "Banarasi & Handloom Weaving, Embroidery & Chikankari",
        "preferred_categories": "Apparel, Sarees, Textiles",
        "budget_min": 3000.0,
        "budget_max": 15000.0,
        "bulk_order_interest": "Yes"
    },
    {
        "business_name": "Maharashtra Hotel Art Supply",
        "buyer_type": "Hotel Interior Supplier",
        "location": "Nagpur, Maharashtra",
        "requirements": "Hospitality supplier sourcing handmade traditional paintings, brass statues, and wall art for resort interiors.",
        "min_order_quantity": 15,
        "category": "Hospitality & Interiors",
        "preferred_crafts": "Warli Art, Brass & Metalware, Wood Carving & Handicrafts",
        "preferred_categories": "Paintings & Wall Art, Sculptures",
        "budget_min": 2000.0,
        "budget_max": 10000.0,
        "bulk_order_interest": "Yes"
    },
    {
        "business_name": "UrbanCraft Corporate Gifting",
        "buyer_type": "Corporate Gifting Agency",
        "location": "Mumbai, Maharashtra",
        "requirements": "Sourcing artisanal corporate gifts, leather accessories, brass desk items, and boxed handmade souvenirs.",
        "min_order_quantity": 25,
        "category": "Corporate Gifts",
        "preferred_crafts": "Brass & Metalware, Leather Crafts, Wood Carving & Handicrafts",
        "preferred_categories": "Corporate Gifts, Accessories",
        "budget_min": 1000.0,
        "budget_max": 4000.0,
        "bulk_order_interest": "Yes"
    },
    {
        "business_name": "Indian Roots Art Gallery",
        "buyer_type": "Art Gallery",
        "location": "Delhi NCR",
        "requirements": "Promoting authentic master artisan tribal paintings, Warli art, terracotta sculptures, and rare Indian crafts.",
        "min_order_quantity": 3,
        "category": "Fine Art & Antiques",
        "preferred_crafts": "Warli Art, Terracotta & Clay Art, Tribal Art",
        "preferred_categories": "Paintings & Wall Art, Collectibles",
        "budget_min": 5000.0,
        "budget_max": 25000.0,
        "bulk_order_interest": "No"
    },
    {
        "business_name": "Heritage Hospitality Interiors",
        "buyer_type": "Interior Designer",
        "location": "Jaipur, Rajasthan",
        "requirements": "Interior design studio purchasing blue pottery vases, terracotta craft, and handcrafted wooden decor items.",
        "min_order_quantity": 8,
        "category": "Interior Design",
        "preferred_crafts": "Pottery & Ceramics, Wood Carving & Handicrafts, Terracotta & Clay Art",
        "preferred_categories": "Home Decor, Pottery",
        "budget_min": 2500.0,
        "budget_max": 12000.0,
        "bulk_order_interest": "Yes"
    },
    {
        "business_name": "Handmade Retail Collective",
        "buyer_type": "Retailer",
        "location": "Bengaluru, Karnataka",
        "requirements": "Curated retail chain for ethnic handcrafted lifestyle products, scarves, pottery, and sustainable home accents.",
        "min_order_quantity": 20,
        "category": "Retail Chain",
        "preferred_crafts": "Banarasi & Handloom Weaving, Pottery & Ceramics, Embroidery & Chikankari",
        "preferred_categories": "Apparel, Accessories, Home Decor",
        "budget_min": 1200.0,
        "budget_max": 6000.0,
        "bulk_order_interest": "Yes"
    },
    {
        "business_name": "Traditional Arts Export House",
        "buyer_type": "Exporter",
        "location": "Chennai, Tamil Nadu",
        "requirements": "Exporting authentic Indian handicraft items, carved wooden items, leather goods, and brass idols to global markets.",
        "min_order_quantity": 50,
        "category": "Export & Wholesale",
        "preferred_crafts": "Wood Carving & Handicrafts, Leather Crafts, Brass & Metalware",
        "preferred_categories": "Handicrafts, Export",
        "budget_min": 2000.0,
        "budget_max": 15000.0,
        "bulk_order_interest": "Yes"
    }
]

def seed_demo_buyers(db: Session):
    """
    Seeds database with demo buyers if none exist.
    """
    existing_count = db.query(Buyer).count()
    if existing_count == 0:
        logger.info("Seeding database with demo buyer profiles...")
        for buyer_data in DEMO_BUYERS:
            buyer = Buyer(**buyer_data)
            db.add(buyer)
        db.commit()
        logger.info(f"Successfully seeded {len(DEMO_BUYERS)} demo buyers.")
