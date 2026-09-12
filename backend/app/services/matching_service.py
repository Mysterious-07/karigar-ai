import logging
import json
from typing import List, Tuple, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models.product import Product
from app.db.models.buyer import Buyer
from app.db.models.match import BuyerMatch
from app.schemas.match import BuyerMatchResponse
from app.core.config import settings
from app.services.ai_client import ai_client, AIClientError

logger = logging.getLogger("karigar_ai.matching")


class MatchingService:
    """
    Buyer matching service with configurable weighted scoring and optional AI explanations.
    - Deterministic scoring is always used (never replaced by AI).
    - AI is used ONLY for natural-language explanation when available.
    - If AI fails, a deterministic explanation is generated from actual scoring factors.
    """

    def __init__(self):
        self.craft_weight = settings.MATCH_CRAFT_WEIGHT
        self.category_weight = settings.MATCH_CATEGORY_WEIGHT
        self.budget_weight = settings.MATCH_BUDGET_WEIGHT
        self.buyer_type_weight = settings.MATCH_BUYER_TYPE_WEIGHT
        self.bulk_weight = settings.MATCH_BULK_WEIGHT

    def calculate_match_score(self, product: Product, buyer: Buyer) -> float:
        """
        Calculates a deterministic compatibility score (0-100%) between a product and a buyer profile.
        Scoring Breakdown (configurable via settings):
        - Craft Compatibility: MATCH_CRAFT_WEIGHT%
        - Category Compatibility: MATCH_CATEGORY_WEIGHT%
        - Budget Compatibility: MATCH_BUDGET_WEIGHT%
        - Buyer Type Relevance: MATCH_BUYER_TYPE_WEIGHT%
        - Bulk Suitability: MATCH_BULK_WEIGHT%
        """
        score = 0.0

        # 1. Craft Compatibility
        prod_craft = (product.craft_type or "").lower()
        buyer_crafts = (buyer.preferred_crafts or "").lower()
        if prod_craft and prod_craft in buyer_crafts:
            score += self.craft_weight
        elif any(word in buyer_crafts for word in prod_craft.split() if len(word) > 3):
            score += self.craft_weight * 0.67
        else:
            score += self.craft_weight * 0.17

        # 2. Category Compatibility
        prod_cat = (product.category or "").lower()
        buyer_cats = (buyer.preferred_categories or "").lower()
        if prod_cat and prod_cat in buyer_cats:
            score += self.category_weight
        elif any(word in buyer_cats for word in prod_cat.split() if len(word) > 3):
            score += self.category_weight * 0.6
        else:
            score += self.category_weight * 0.2

        # 3. Budget Compatibility
        price = product.price or product.suggested_price or 2000.0
        b_min = buyer.budget_min or 0.0
        b_max = buyer.budget_max or 99999.0
        if b_min <= price <= b_max:
            score += self.budget_weight
        elif (b_min * 0.75) <= price <= (b_max * 1.25):
            score += self.budget_weight * 0.5
        else:
            score += self.budget_weight * 0.25

        # 4. Buyer Type Relevance
        b_type = (buyer.buyer_type or "").lower()
        if any(keyword in b_type for keyword in ["decor", "boutique", "gallery", "hotel", "gifting"]):
            score += self.buyer_type_weight
        else:
            score += self.buyer_type_weight * 0.67

        # 5. Bulk Suitability
        if buyer.bulk_order_interest == "Yes":
            score += self.bulk_weight
        else:
            score += self.bulk_weight * 0.5

        return round(min(100.0, score), 1)

    def get_factors_breakdown(self, product: Product, buyer: Buyer, score: float) -> List[str]:
        """Returns a list of human-readable factor scores for the UI."""
        breakdown = []

        # Craft
        prod_craft = (product.craft_type or "").lower()
        buyer_crafts = (buyer.preferred_crafts or "").lower()
        if prod_craft and prod_craft in buyer_crafts:
            breakdown.append(f"Craft match: {self.craft_weight:.0f}/100 (exact match)")
        elif any(word in buyer_crafts for word in prod_craft.split() if len(word) > 3):
            breakdown.append(f"Craft match: {self.craft_weight * 0.67:.0f}/100 (partial match)")
        else:
            breakdown.append(f"Craft match: {self.craft_weight * 0.17:.0f}/100 (no direct match)")

        # Category
        prod_cat = (product.category or "").lower()
        buyer_cats = (buyer.preferred_categories or "").lower()
        if prod_cat and prod_cat in buyer_cats:
            breakdown.append(f"Category match: {self.category_weight:.0f}/100 (exact match)")
        elif any(word in buyer_cats for word in prod_cat.split() if len(word) > 3):
            breakdown.append(f"Category match: {self.category_weight * 0.6:.0f}/100 (partial match)")
        else:
            breakdown.append(f"Category match: {self.category_weight * 0.2:.0f}/100 (no direct match)")

        # Budget
        price = product.price or product.suggested_price or 2000.0
        b_min = buyer.budget_min or 0.0
        b_max = buyer.budget_max or 99999.0
        if b_min <= price <= b_max:
            breakdown.append(f"Budget fit: {self.budget_weight:.0f}/100 (within range)")
        elif (b_min * 0.75) <= price <= (b_max * 1.25):
            breakdown.append(f"Budget fit: {self.budget_weight * 0.5:.0f}/100 (near range)")
        else:
            breakdown.append(f"Budget fit: {self.budget_weight * 0.25:.0f}/100 (outside range)")

        # Buyer type
        b_type = (buyer.buyer_type or "").lower()
        if any(keyword in b_type for keyword in ["decor", "boutique", "gallery", "hotel", "gifting"]):
            breakdown.append(f"Buyer type: {self.buyer_type_weight:.0f}/100 (relevant)")
        else:
            breakdown.append(f"Buyer type: {self.buyer_type_weight * 0.67:.0f}/100 (neutral)")

        # Bulk
        if buyer.bulk_order_interest == "Yes":
            breakdown.append(f"Bulk interest: {self.bulk_weight:.0f}/100 (interested)")
        else:
            breakdown.append(f"Bulk interest: {self.bulk_weight * 0.5:.0f}/100 (not specified)")

        return breakdown

    def match_product_to_buyers(
        self,
        db: Session,
        product_id: UUID,
        language: str = "en"
    ) -> List[BuyerMatchResponse]:
        """
        Loads product and buyers, calculates deterministic compatibility, sorts and saves top matches to DB.
        Uses AI for explanation when available; falls back to deterministic explanation on AI failure.
        """
        # 1. Load product
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found"
            )

        # 2. Load buyers
        buyers = db.query(Buyer).all()
        if not buyers:
            return []

        # 3. Calculate scores for all buyers
        scored_buyers: List[Tuple[Buyer, float]] = []
        for buyer in buyers:
            score = self.calculate_match_score(product, buyer)
            scored_buyers.append((buyer, score))

        # 4. Sort by score descending and take top 4 matches
        scored_buyers.sort(key=lambda x: x[1], reverse=True)
        top_matches = scored_buyers[:4]

        # 5. Generate explanations and persist to database
        db.query(BuyerMatch).filter(BuyerMatch.product_id == product_id).delete()

        result_responses: List[BuyerMatchResponse] = []

        for buyer, score in top_matches:
            # Try AI explanation first; fall back to deterministic
            try:
                reason = self._generate_ai_explanation(product, buyer, score, language)
                explanation_source = "ai"
            except (AIClientError, Exception) as e:
                logger.warning(f"AI explanation failed for buyer {buyer.business_name}: {type(e).__name__}. Using deterministic explanation.")
                reason = self._generate_deterministic_explanation(product, buyer, score, language)
                explanation_source = "deterministic"

            match_obj = BuyerMatch(
                product_id=product_id,
                buyer_id=buyer.id,
                match_score=score,
                reason=reason,
                status="suggested"
            )
            db.add(match_obj)
            db.flush()

            budget_str = f"₹{int(buyer.budget_min or 1000):,} - ₹{int(buyer.budget_max or 10000):,}"

            factors = self.get_factors_breakdown(product, buyer, score)

            result_responses.append(
                BuyerMatchResponse(
                    id=match_obj.id,
                    product_id=product_id,
                    buyer_id=buyer.id,
                    business_name=buyer.business_name,
                    buyer_type=buyer.buyer_type,
                    location=buyer.location,
                    state=buyer.state,
                    buyer_label="Potential Buyer",
                    match_score=score,
                    reason=reason,
                    factors_breakdown=factors,
                    budget_range=budget_str,
                    bulk_order_interest=buyer.bulk_order_interest or "Yes",
                    status="suggested",
                    created_at=match_obj.created_at
                )
            )

        db.commit()
        return result_responses

    def get_saved_matches(self, db: Session, product_id: UUID) -> List[BuyerMatchResponse]:
        """
        Retrieves existing saved buyer matches for a product.
        """
        matches = db.query(BuyerMatch).filter(BuyerMatch.product_id == product_id).order_by(BuyerMatch.match_score.desc()).all()
        results = []
        for m in matches:
            buyer = db.query(Buyer).filter(Buyer.id == m.buyer_id).first()
            if buyer:
                budget_str = f"₹{int(buyer.budget_min or 1000):,} - ₹{int(buyer.budget_max or 10000):,}"
                factors = self.get_factors_breakdown(
                    db.query(Product).filter(Product.id == product_id).first(),
                    buyer,
                    m.match_score
                )
                results.append(
                    BuyerMatchResponse(
                        id=m.id,
                        product_id=product_id,
                        buyer_id=buyer.id,
                        business_name=buyer.business_name,
                        buyer_type=buyer.buyer_type,
                        location=buyer.location,
                        state=buyer.state,
                        buyer_label="Potential Buyer",
                        match_score=m.match_score,
                        reason=m.reason or "High craft and category compatibility.",
                        factors_breakdown=factors,
                        budget_range=budget_str,
                        bulk_order_interest=buyer.bulk_order_interest or "Yes",
                        status=m.status,
                        created_at=m.created_at
                    )
                )
        return results

    def update_match_status(self, db: Session, match_id: UUID, new_status: str) -> BuyerMatch:
        """
        Updates match status (e.g. to 'contacted' when artisan clicks Send Interest).
        """
        match_obj = db.query(BuyerMatch).filter(BuyerMatch.id == match_id).first()
        if not match_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Buyer match with id {match_id} not found"
            )

        match_obj.status = new_status
        db.commit()
        db.refresh(match_obj)
        return match_obj

    def _generate_ai_explanation(self, product: Product, buyer: Buyer, score: float, language: str) -> str:
        """
        Uses AI to generate a natural-language match explanation.
        Raises AIClientError if AI is unavailable.
        """
        lang_names = {"en": "English", "hi": "Hindi (हिंदी)", "mr": "Marathi (मराठी)"}
        target_lang = lang_names.get(language.lower(), "English")

        system_prompt = (
            "You are a helpful assistant explaining why a product matches a potential buyer profile.\n\n"
            "IMPORTANT RULES:\n"
            "1. Base your explanation ONLY on the actual product data and buyer data provided below.\n"
            "2. Do NOT invent buyer requirements, preferences, or purchase history.\n"
            "3. Do NOT claim the buyer has purchased from this artisan before.\n"
            "4. Keep the explanation concise (1-2 sentences) and buyer-friendly.\n"
            f"5. Respond ONLY in {target_lang}.\n"
        )

        user_prompt = (
            f"Product: {product.title}\n"
            f"Craft Type: {product.craft_type}\n"
            f"Category: {product.category or 'Not specified'}\n"
            f"Price: ₹{product.price or product.suggested_price or 'Not set'}\n\n"
            f"Potential Buyer: {buyer.business_name}\n"
            f"Buyer Type: {buyer.buyer_type}\n"
            f"Location: {buyer.location}, {buyer.state or 'India'}\n"
            f"Preferred Crafts: {buyer.preferred_crafts or 'Not specified'}\n"
            f"Preferred Categories: {buyer.preferred_categories or 'Not specified'}\n"
            f"Budget Range: ₹{buyer.budget_min or 0} - ₹{buyer.budget_max or 99999}\n"
            f"Bulk Order Interest: {buyer.bulk_order_interest or 'Yes'}\n\n"
            f"Match Score: {score}%\n\n"
            "Explain why this product is a good match for this buyer based ONLY on the data above."
        )

        raw_content = ai_client.chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            response_format={"type": "text"},
            request_type="match_explanation",
        )

        return raw_content.strip()

    def _generate_deterministic_explanation(self, product: Product, buyer: Buyer, score: float, language: str) -> str:
        """
        Generates a deterministic explanation from actual scoring factors.
        Used when AI is unavailable.
        """
        reasons_en = {
            "Home Decor Store": f"Strong match ({score}%) — this buyer focuses on traditional Indian home decor and your {product.craft_type} product aligns with their category preferences.",
            "Boutique": f"Good match ({score}%) — this boutique curates authentic artisanal products and your {product.craft_type} craft fits their selection.",
            "Hotel Interior Supplier": f"Potential match ({score}%) — this supplier sources handmade decor for hospitality interiors, and your product matches their craft interests.",
            "Corporate Gifting Agency": f"Potential match ({score}%) — this agency purchases handcrafted corporate gifts and traditional art souvenirs.",
            "Art Gallery": f"Good match ({score}%) — this gallery specializes in traditional Indian tribal and folk art, aligning with your {product.craft_type} craft.",
            "Interior Designer": f"Potential match ({score}%) — this designer purchases custom handcrafted decor pieces for interior projects.",
        }

        reasons_hi = {
            "Home Decor Store": f"अच्छा मिलान ({score}%) — यह खरीदार पारंपरिक भारतीय गृह सज्जा में रुचि रखता है और आपकी {product.craft_type} कलाकृति उनकी श्रेणी प्राथमिकताओं से मेल खाती है।",
            "Boutique": f"अच्छा मिलान ({score}%) — यह बुटीक पारंपरिक शिल्प उत्पादों को प्राथमिकता देता है और आपका {product.craft_type} कारीगरी उनके चयन में फिट बैठती है।",
            "Hotel Interior Supplier": f"संभावित मिलान ({score}%) — यह आपूर्तिकर्ता होटल इंटीरियर के लिए हस्तनिर्मित सजावटी वस्तुएं खरीदता है।",
            "Corporate Gifting Agency": f"संभावित मिलान ({score}%) — यह एजेंसी हस्तनिर्मित कॉर्पोरेट उपहार और पारंपरिक कला स्मृति चिह्न खरीदती है।",
        }

        reasons_mr = {
            "Home Decor Store": f"चांगले जुळवून ({score}%) — हा खरेदीदार पारंपरिक भारतीय गृह सजावटीमध्ये रस घेतो आणि तुमची {product.craft_type} कलाकृती त्यांच्या श्रेणी प्राधान्यांशी जुळते.",
            "Boutique": f"चांगले जुळवून ({score}%) — ही बुटीक पारंपारिक शिल्प उत्पादांना प्राधान्य देते आणि तुमची {product.craft_type} कारागीर त्यांच्या निवडीत बसते.",
            "Hotel Interior Supplier": f"संभाव्य जुळवून ({score}%) — हा पुरवठादार हॉटेल इंटीरियरसाठी हस्तकला सजावटी वस्तू खरेदी करतो.",
            "Corporate Gifting Agency": f"संभाव्य जुळवून ({score}%) — ही एजन्सी हस्तनिर्मित कॉर्पोरेट भेटवस्तू आणि पारंपारिक कला स्मृती चिन्हे खरेदी करते.",
        }

        lang_dict = {"hi": reasons_hi, "mr": reasons_mr}.get(language.lower(), reasons_en)
        return lang_dict.get(
            buyer.buyer_type,
            f"Match score {score}% — based on craft type, category, budget compatibility, and buyer preferences for your {product.craft_type} product."
        )


matching_service = MatchingService()