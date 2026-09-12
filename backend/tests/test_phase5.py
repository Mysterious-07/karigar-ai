import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.db.models.artisan import Artisan
from app.db.models.product import Product
from app.schemas.catalog import CatalogGenerationResponse
from app.core.security import create_access_token


# Helper to get auth token for an artisan
def _get_token(artisan_id: str) -> str:
    return create_access_token({"sub": str(artisan_id)})


@patch("app.services.grok_service.GrokService.generate_catalog")
def test_marathi_voice_transcript_catalog_generation(mock_grok, db_session, client: TestClient):
    # 1. Create artisan Ramesh
    artisan = Artisan(
        name="Ramesh",
        phone="9876543210",
        location="Palghar",
        state="Maharashtra",
        language="mr",
        craft_type="Warli Art"
    )
    db_session.add(artisan)
    db_session.commit()
    db_session.refresh(artisan)

    # 2. Raw voice transcript (what the artisan spoke)
    raw_transcript = "हा माझ्या हाताने बनवलेला वारली चित्र आहे. हे पारंपरिक वारली कलेवर आधारित आहे आणि मला हे बनवायला ३ दिवस लागले."

    # 3. Create Product with raw transcript as initial description
    product = Product(
        artisan_id=artisan.id,
        title="Draft Warli Painting",
        craft_type="Warli Art",
        description=raw_transcript,
        original_image="uploads/products/test_warli.jpg"
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    token = _get_token(artisan.id)

    # 4. Mock Grok to return AI-generated professional catalog
    ai_generated_description = "पारंपरिक वारली चित्रकलेचा हा सुंदर नमुना रमेश यांनी पालघर येथे हाताने तयार केला आहे. या कलाकृतीत पारंपरिक वारली शैलीचे सौंदर्य आणि सांस्कृतिक वारसा दिसून येतो."
    mock_grok.return_value = CatalogGenerationResponse(
        title="पारंपरिक वारली चित्रकला",
        description=ai_generated_description,
        category="चित्रकला आणि भित्तीचित्र",
        craft_type="वारली कला",
        material="Not specified",
        dimensions="Not specified",
        production_time="३ दिवस",
        tags=["वारली", "हस्तनिर्मित", "महाराष्ट्र", "पारंपरिक कला"],
        artisan_story="रमेश हे पालघर, महाराष्ट्र येथील पारंपरिक वारली कलाकार आहेत."
    )

    # 5. Call catalog generation with the raw transcript
    res = client.post(
        f"/api/products/{product.id}/generate-catalog",
        json={
            "description": raw_transcript,
            "language": "mr"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["quality_score"] >= 70

    # 6. CRITICAL: Verify AI-generated description is NOT the raw transcript
    final_description = data["product"]["description"]
    assert final_description != raw_transcript, (
        f"BUG: Final description should be AI-generated, not the raw transcript.\n"
        f"Raw transcript: {raw_transcript}\n"
        f"Final description: {final_description}"
    )
    assert final_description == ai_generated_description

    # 7. Verify all catalog fields were populated by AI
    assert data["product"]["title"] == "पारंपरिक वारली चित्रकला"
    assert data["product"]["category"] == "चित्रकला आणि भित्तीचित्र"
    assert data["product"]["craft_type"] == "वारली कला"
    assert data["product"]["production_time"] == "३ दिवस"
    assert data["product"]["artisan_story"] is not None and len(data["product"]["artisan_story"]) > 10

    # 8. Verify Grok was called with the raw transcript as input
    mock_grok.assert_called_once()
    call_args = mock_grok.call_args
    assert call_args.kwargs["raw_description"] == raw_transcript


# Hindi voice transcript test
@patch("app.services.grok_service.GrokService.generate_catalog")
def test_hindi_voice_transcript_catalog_generation(mock_grok, db_session, client: TestClient):
    artisan = Artisan(
        name="Sita Devi",
        phone="9988776655",
        location="Madhubani",
        state="Bihar",
        language="hi",
        craft_type="Madhubani Painting"
    )
    db_session.add(artisan)
    db_session.commit()

    raw_transcript = "यह मेरे हाथ से बनाया हुआ वारली चित्र है। यह पारंपरिक कला पर आधारित है और इसे बनाने में मुझे तीन दिन लगे।"

    product = Product(
        artisan_id=artisan.id,
        title="Draft Madhubani Artwork",
        craft_type="Madhubani Painting",
        description=raw_transcript,
        original_image="uploads/products/test_madhubani.jpg"
    )
    db_session.add(product)
    db_session.commit()
    
    token = _get_token(artisan.id)

    ai_generated_description = "सीता देवी द्वारा हाथ से बनाई गई यह पारंपरिक मधुबनी पेंटिंग बिहार की समृद्ध कला परंपरा को दर्शाती है।"
    mock_grok.return_value = CatalogGenerationResponse(
        title="हस्तनिर्मित मधुबनी चित्रकला",
        description=ai_generated_description,
        category="चित्रकला",
        craft_type="मधुबनी पेंटिंग",
        material="Not specified",
        dimensions="Not specified",
        production_time="तीन दिन",
        tags=["मधुबनी", "हस्तनिर्मित", "बिहार", "पारंपरिक"],
        artisan_story="सीता देवी मधुबनी, बिहार की प्रसिद्ध कलाकार हैं।"
    )

    res = client.post(
        f"/api/products/{product.id}/generate-catalog",
        json={
            "description": raw_transcript,
            "language": "hi"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True

    # CRITICAL: Verify AI-generated description differs from raw transcript
    assert data["product"]["description"] != raw_transcript
    assert data["product"]["description"] == ai_generated_description
    assert data["product"]["title"] == "हस्तनिर्मित मधुबनी चित्रकला"


# English voice transcript test
@patch("app.services.grok_service.GrokService.generate_catalog")
def test_english_voice_transcript_catalog_generation(mock_grok, db_session, client: TestClient):
    artisan = Artisan(
        name="Ramesh",
        phone="9876543210",
        location="Palghar",
        state="Maharashtra",
        language="en",
        craft_type="Warli Art"
    )
    db_session.add(artisan)
    db_session.commit()

    raw_transcript = "This is a handmade Warli painting based on traditional Warli art. It took me three days to create."

    product = Product(
        artisan_id=artisan.id,
        title="Handmade Warli Painting",
        craft_type="Warli Art",
        description=raw_transcript,
        original_image="uploads/products/test_en.jpg"
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    token = _get_token(artisan.id)

    ai_generated_description = "A stunning handcrafted Warli painting created by artisan Ramesh from Palghar, Maharashtra. This artwork showcases the timeless beauty of traditional Warli tribal art, meticulously painted over three days."
    mock_grok.return_value = CatalogGenerationResponse(
        title="Traditional Warli Tribal Art Painting",
        description=ai_generated_description,
        category="Paintings & Wall Art",
        craft_type="Warli Art",
        material="Not specified",
        dimensions="Not specified",
        production_time="3 days",
        tags=["Warli", "Handmade", "Maharashtra", "Tribal Art"],
        artisan_story="Handcrafted by Ramesh, a skilled Warli artisan from Palghar, Maharashtra."
    )

    res = client.post(
        f"/api/products/{product.id}/generate-catalog",
        json={
            "description": raw_transcript,
            "language": "en"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True

    # CRITICAL: Verify AI-generated description differs from raw transcript
    assert data["product"]["description"] != raw_transcript
    assert data["product"]["description"] == ai_generated_description

    # Verify all catalog fields populated
    assert data["product"]["title"] == "Traditional Warli Tribal Art Painting"
    assert data["product"]["category"] == "Paintings & Wall Art"
    assert data["product"]["production_time"] == "3 days"
    assert data["product"]["artisan_story"] is not None
