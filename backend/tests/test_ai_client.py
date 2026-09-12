import os
import pytest
from unittest.mock import patch, MagicMock
from app.services.ai_client import ai_client, AIClientError
from app.core.config import settings


# ============ Mock AI Unit Tests (always run) ============

def test_ai_client_not_configured():
    """When no API key is set, is_configured should be False."""
    with patch.object(settings, "XAI_API_KEY", ""):
        client = ai_client.__class__()
        assert client.is_configured is False


def test_ai_client_mock_key_not_configured():
    """Mock keys should not be treated as configured."""
    with patch.object(settings, "XAI_API_KEY", "mock_key_for_tests"):
        client = ai_client.__class__()
        assert client.is_configured is False


def test_ai_client_health_check_not_configured():
    """Health check should report not configured when no key."""
    with patch.object(settings, "XAI_API_KEY", ""):
        client = ai_client.__class__()
        result = client.check_health()
        assert result["configured"] is False
        assert result["reachable"] is False


def test_ai_client_health_check_invalid_key():
    """Health check with invalid key should report unreachable."""
    with patch.object(settings, "XAI_API_KEY", "invalid_test_key_12345678901234567890"):
        client = ai_client.__class__()
        result = client.check_health()
        assert result["configured"] is True
        assert result["reachable"] is False


def test_ai_client_chat_completion_not_configured_raises():
    """chat_completion should raise AIClientError when not configured."""
    with patch.object(settings, "XAI_API_KEY", ""):
        client = ai_client.__class__()
        with pytest.raises(AIClientError) as exc_info:
            client.chat_completion(system_prompt="test", user_prompt="test")
        assert exc_info.value.category == "config"


def test_ai_client_chat_completion_api_failure_raises():
    """chat_completion should raise AIClientError on API failure — no silent fallback."""
    with patch.object(settings, "XAI_API_KEY", "valid_looking_test_key_1234567890"):
        client = ai_client.__class__()
        with patch("openai.resources.chat.completions.Completions.create") as mock_create:
            mock_create.side_effect = Exception("API Connection Timeout")
            with pytest.raises(AIClientError) as exc_info:
                client.chat_completion(system_prompt="test", user_prompt="test")
            assert exc_info.value.category == "connection"


def test_ai_client_chat_completion_success():
    """chat_completion should return content on success."""
    with patch.object(settings, "XAI_API_KEY", "valid_looking_test_key_1234567890"):
        client = ai_client.__class__()
        with patch("openai.resources.chat.completions.Completions.create") as mock_create:
            mock_response = MagicMock()
            mock_response.choices = [
                MagicMock(message=MagicMock(content='{"title": "Test"}'))
            ]
            mock_create.return_value = mock_response
            result = client.chat_completion(system_prompt="test", user_prompt="test")
            assert result == '{"title": "Test"}'


def test_ai_client_error_categories():
    """Error categories should be correctly classified."""
    with patch.object(settings, "XAI_API_KEY", "valid_looking_test_key_1234567890"):
        client = ai_client.__class__()
        with patch("openai.resources.chat.completions.Completions.create") as mock_create:
            # Model not found
            mock_create.side_effect = Exception("Model not found: grok-2-latest")
            with pytest.raises(AIClientError) as exc_info:
                client.chat_completion(system_prompt="t", user_prompt="t")
            assert exc_info.value.category == "model_not_found"

            # Auth error
            mock_create.side_effect = Exception("Incorrect API key provided")
            with pytest.raises(AIClientError) as exc_info:
                client.chat_completion(system_prompt="t", user_prompt="t")
            assert exc_info.value.category == "auth"


# ============ Real Integration Test (only runs with valid, working XAI_API_KEY) ============

def _has_valid_api_key() -> bool:
    """Check if a real API key is configured (not mock, not empty)."""
    key = settings.XAI_API_KEY
    return bool(key) and not key.startswith("mock_") and len(key) > 20


def _ai_provider_reachable() -> bool:
    """Check if the AI provider is actually reachable with the configured key."""
    if not _has_valid_api_key():
        return False
    result = ai_client.check_health()
    return result.get("reachable", False)


@pytest.mark.skipif(
    not _has_valid_api_key(),
    reason="XAI_API_KEY not configured — skipping real AI integration test"
)
@pytest.mark.skipif(
    _has_valid_api_key() and not _ai_provider_reachable(),
    reason="AI provider unreachable with configured key (key may be invalid/expired) — skipping"
)
def test_real_ai_integration_health_check():
    """
    Real integration test: verifies the AI provider is actually reachable.
    Only runs when a valid XAI_API_KEY is configured AND the provider responds.
    """
    result = ai_client.check_health()
    assert result["configured"] is True
    assert result["reachable"] is True, f"AI provider unreachable: {result.get('error')}"
    assert result["latency_ms"] > 0


@pytest.mark.skipif(
    not _has_valid_api_key(),
    reason="XAI_API_KEY not configured — skipping real AI integration test"
)
@pytest.mark.skipif(
    _has_valid_api_key() and not _ai_provider_reachable(),
    reason="AI provider unreachable with configured key (key may be invalid/expired) — skipping"
)
def test_real_ai_integration_chat_completion():
    """
    Real integration test: verifies an actual AI response is received.
    Only runs when a valid XAI_API_KEY is configured AND the provider responds.
    """
    content = ai_client.chat_completion(
        system_prompt="You are a test assistant. Respond with valid JSON only.",
        user_prompt='Return this exact JSON: {"status": "ok", "source": "ai"}',
        temperature=0.0,
        response_format={"type": "json_object"},
        request_type="integration_test",
    )
    assert content is not None
    assert len(content) > 0
    # Verify it's valid JSON
    import json
    data = json.loads(content)
    assert "status" in data or "source" in data
