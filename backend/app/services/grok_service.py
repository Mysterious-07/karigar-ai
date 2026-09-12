import os
import json
import base64
import logging
from typing import Optional
from app.core.config import settings
from app.schemas.catalog import CatalogGenerationResponse
from app.services.ai_client import ai_client, AIClientError

logger = logging.getLogger("karigar_ai.grok")


class GrokService:
    """
    Multilingual AI catalog generation service.
    Understands Marathi/Hindi/English input; generates marketplace-ready
    English (default) or Hindi output. Raises AIClientError on failure — no silent fallback.
    """

    def __init__(self):
        self.model = settings.XAI_MODEL

    def generate_catalog(
        self,
        raw_description: str,
        craft_type: str,
        language: str = "en",
        output_language: str = "en",
        artisan_name: Optional[str] = None,
        artisan_location: Optional[str] = None,
        artisan_state: Optional[str] = None,
        image_path: Optional[str] = None
    ) -> CatalogGenerationResponse:
        """
        Calls the AI provider to generate a structured product catalog.
        - Understands input in Marathi/Hindi/English.
        - Generates marketplace-ready content in output_language (English default, Hindi supported).
        - Strict anti-hallucination: unavailable facts become "Not provided".
        Raises AIClientError if the AI provider is unavailable or returns invalid content.
        """
        language_names = {
            "en": "English",
            "hi": "Hindi (हिंदी)",
            "mr": "Marathi (मराठी)"
        }
        input_lang = language_names.get(language.lower(), "English")
        out_lang = language_names.get(output_language.lower(), "English")

        vision_enabled = bool(settings.XAI_VISION_MODEL)
        has_image = bool(image_path and os.path.exists(image_path) and vision_enabled)

        vision_instruction = ""
        if has_image:
            vision_instruction = (
                "9. A product photo is attached. You MAY use it to understand the product's general "
                "appearance and craft style, but NEVER invent specific facts (materials, dimensions, "
                "weight, certifications, origins) from the photo alone — only use what is clearly visible "
                "and unambiguous, or what the artisan stated.\n"
            )
        else:
            vision_instruction = (
                "9. No image analysis is performed for this request. Base your output ONLY on the "
                "artisan's text description. Do NOT claim or imply you have seen a product photo.\n"
            )

        system_prompt = (
            "You are an AI assistant helping marginalized Indian artisans create professional, "
            "marketplace-ready product catalogs.\n\n"
            "LANGUAGE RULES:\n"
            f"- The artisan's input may be written or spoken in {input_lang}. Understand it fully.\n"
            f"- You MUST generate ALL catalog content (title, description, category, craft_type, material, "
            f"dimensions, production_time, tags, artisan_story) in {out_lang} — the professional "
            f"marketplace language for this listing.\n"
            "- Keep the marketplace description professional and buyer-friendly.\n\n"
            "STRICT ANTI-HALLUCINATION RULES YOU MUST FOLLOW:\n"
            "1. NEVER fabricate product facts. Do NOT invent materials, dimensions, weight, production time, "
            "certifications, awards, government registration, geographical origin, historical claims, "
            "prices, or craft authenticity unless the artisan explicitly stated them.\n"
            "2. If material is not mentioned or clearly inferable from the artisan's words, set 'material' to 'Not provided'.\n"
            "3. If dimensions are not provided, set 'dimensions' to 'Not provided'.\n"
            "4. If production time is not provided, set 'production_time' to 'Not provided'.\n"
            "5. Do NOT use generic exaggerated claims like '100% natural', 'eco-friendly', 'best quality', "
            "or 'award-winning' unless the artisan explicitly stated them.\n"
            "6. Preserve the authentic story and traditional voice of the artisan — translate/adapt it, "
            "do not embellish it with invented details.\n"
            "7. You MUST respond ONLY with valid JSON matching the required schema keys:\n"
            "   {\n"
            '     "title": "...",\n'
            '     "description": "...",\n'
            '     "category": "...",\n'
            '     "craft_type": "...",\n'
            '     "material": "...",\n'
            '     "dimensions": "...",\n'
            '     "production_time": "...",\n'
            '     "tags": ["tag1", "tag2", "tag3"],\n'
            '     "artisan_story": "..."\n'
            "   }\n"
            f"{vision_instruction}"
        )

        user_prompt_text = (
            f"Artisan Input Description: {raw_description if raw_description.strip() else '(No text description provided — use the product photo.)'}\n"
            f"Craft Type: {craft_type}\n"
            f"Artisan Name: {artisan_name or 'Artisan'}\n"
            f"Location: {artisan_location or 'India'}, {artisan_state or ''}\n"
            f"Input Language: {input_lang}\n"
            f"Required Output Language: {out_lang}\n\n"
            "Please generate the complete structured product catalog JSON."
        )

        # Build message content payload (image only when a vision model is configured)
        user_content = []
        if has_image:
            try:
                with open(image_path, "rb") as img_file:
                    b64_img = base64.b64encode(img_file.read()).decode("utf-8")

                ext = os.path.splitext(image_path)[1].lower()
                mime_map = {".png": "image/png", ".webp": "image/webp", ".jpeg": "image/jpeg", ".jpg": "image/jpeg"}
                mime_type = mime_map.get(ext, "image/jpeg")

                user_content.append({"type": "text", "text": user_prompt_text})
                user_content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{b64_img}"
                    }
                })
            except Exception as e:
                logger.error(f"Error encoding image for vision API: {e}")
                user_content = user_prompt_text
        else:
            user_content = user_prompt_text

        # Use shared AI client — raises AIClientError on failure
        request_model = settings.XAI_VISION_MODEL if has_image else self.model
        raw_content = ai_client.chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_content,
            temperature=0.3,
            response_format={"type": "json_object"},
            request_type="catalog_generation",
            model_override=request_model,
        )

        try:
            return self._parse_and_validate(raw_content)
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"AI catalog response was not valid JSON: {type(e).__name__}")
            raise AIClientError(
                "AI returned an invalid response. Please try again.",
                category="invalid_response",
            )

    def _parse_and_validate(self, json_str: str) -> CatalogGenerationResponse:
        cleaned_str = json_str.strip()
        if cleaned_str.startswith("```json"):
            cleaned_str = cleaned_str[7:]
        if cleaned_str.startswith("```"):
            cleaned_str = cleaned_str[3:]
        if cleaned_str.endswith("```"):
            cleaned_str = cleaned_str[:-3]
        cleaned_str = cleaned_str.strip()

        data = json.loads(cleaned_str)
        return CatalogGenerationResponse.model_validate(data)


grok_service = GrokService()