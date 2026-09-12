import logging
import json
from typing import Optional
from sqlalchemy.orm import Session

from app.db.models.product import Product
from app.db.models.artisan import Artisan
from app.schemas.pricing import PricingRequest, PricingResponse
from app.core.config import settings
from app.services.ai_client import ai_client, AIClientError

logger = logging.getLogger("karigar_ai.pricing")


class PricingService:
    """
    AI-assisted price guidance service.
    Provides explainable cost-based price recommendations.
    Raises AIClientError on failure — no silent fallback.
    """

    def __init__(self):
        self.model = settings.XAI_MODEL

    def calculate_price_guidance(
        self,
        db: Session,
        product: Product,
        request: PricingRequest
    ) -> PricingResponse:
        """
        Calculates AI-assisted price guidance based on cost inputs, craft context, and production effort.
        This is COST-BASED AI PRICE GUIDANCE — not a claim about live market prices.
        Raises AIClientError if the AI provider is unavailable.
        """
        mat_cost = request.material_cost or 0.0
        lab_cost = request.labour_cost or 0.0
        oth_cost = request.other_cost or 0.0
        total_input_cost = mat_cost + lab_cost + oth_cost

        # Determine confidence level based on input completeness
        confidence = "High" if (mat_cost > 0 and lab_cost > 0) else ("Medium" if total_input_cost > 0 else "Low")

        # Fetch artisan for location/craft context
        artisan = db.query(Artisan).filter(Artisan.id == product.artisan_id).first()

        # Build prompt context
        lang_names = {"en": "English", "hi": "Hindi (हिंदी)", "mr": "Marathi (मराठी)"}
        target_lang = lang_names.get(request.language.lower(), "English")

        system_prompt = (
            "You are an expert Indian Handicrafts Pricing & Business Advisor assisting traditional artisans.\n\n"
            "IMPORTANT — WHAT THIS IS:\n"
            "- You are providing 'AI Suggested Price Guidance' — NOT a guaranteed market price.\n"
            "- This is COST-BASED guidance. You do NOT have access to live market prices, stock exchanges, "
            "or real-time competitor data.\n"
            "- Do NOT claim 'current market price is ₹X' unless the artisan provided a current selling price.\n\n"
            "STRICT GUIDELINES YOU MUST FOLLOW:\n"
            "1. Base your recommendation primarily on the artisan's actual cost inputs (material, labour, other).\n"
            "2. NEVER invent missing cost inputs or claim access to live real-time market data.\n"
            "3. Ensure prices properly value handmade artisan labour, skill, and heritage.\n"
            "4. Provide a reasonable range: minimum (cost + small margin), suggested (fair value), premium (higher margin for uniqueness).\n"
            f"5. Respond ONLY with valid JSON in language: {target_lang}.\n"
            "6. JSON Schema required:\n"
            "{\n"
            '  "suggested_min_price": 1800.0,\n'
            '  "suggested_max_price": 2400.0,\n'
            '  "suggested_price": 2100.0,\n'
            '  "currency": "₹",\n'
            '  "confidence": "' + confidence + '",\n'
            '  "explanation": "...",\n'
            '  "factors": ["Factor 1", "Factor 2"],\n'
            '  "warnings": ["Warning 1"]\n'
            "}"
        )

        user_prompt = (
            f"Product Title: {product.title}\n"
            f"Craft Type: {product.craft_type}\n"
            f"Category: {product.category or 'Handicrafts'}\n"
            f"Material: {product.material or 'Not provided'}\n"
            f"Dimensions: {product.dimensions or 'Not provided'}\n"
            f"Production Time: {request.production_time or product.production_time or 'Not specified'}\n"
            f"Material Cost: ₹{mat_cost}\n"
            f"Labour Cost: ₹{lab_cost}\n"
            f"Other Costs: ₹{oth_cost}\n"
            f"Total Direct Input Cost: ₹{total_input_cost}\n"
            f"Current Selling Price (if any): ₹{request.current_price or product.price or 'None'}\n"
            f"Quantity: {request.quantity}\n"
            f"Target Language: {target_lang}\n\n"
            "Please calculate the suggested price guidance range and explanation."
        )

        # Use shared AI client — raises AIClientError on failure
        raw_json = ai_client.chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            response_format={"type": "json_object"},
            request_type="pricing_guidance",
        )

        try:
            return self._parse_pricing_json(raw_json, total_input_cost, confidence, product)
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"AI pricing response was not valid JSON: {type(e).__name__}")
            raise AIClientError(
                "AI returned an invalid response. Please try again.",
                category="invalid_response",
            )

    def _parse_pricing_json(self, raw_json: str, base_cost: float, confidence: str, product: Product) -> PricingResponse:
        cleaned = raw_json.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        data = json.loads(cleaned.strip())
        return PricingResponse.model_validate(data)


pricing_service = PricingService()