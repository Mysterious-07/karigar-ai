import logging
import time
from typing import Optional
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger("karigar_ai.ai_client")


class AIClientError(Exception):
    """Raised when the AI provider is unreachable or returns an error."""

    def __init__(self, message: str, category: str = "unknown"):
        self.message = message
        self.category = category
        super().__init__(message)


class AIClient:
    """
    Shared client for xAI/Grok API calls.
    Provides health check, safe logging, and structured error handling.
    """

    def __init__(self):
        self.api_key = settings.XAI_API_KEY
        self.base_url = settings.XAI_BASE_URL
        self.model = settings.XAI_MODEL

    @property
    def is_configured(self) -> bool:
        """Returns True if an API key is configured and looks valid."""
        return bool(self.api_key) and not self.api_key.startswith("mock_") and len(self.api_key) > 20

    def _get_client(self) -> OpenAI:
        if not self.is_configured:
            raise AIClientError(
                "AI service is not configured. Please set XAI_API_KEY in the environment.",
                category="config",
            )
        return OpenAI(api_key=self.api_key, base_url=self.base_url)

    def check_health(self) -> dict:
        """
        Performs a lightweight health check against the AI provider.
        Returns structured result without exposing the API key.
        """
        if not self.is_configured:
            return {
                "configured": False,
                "reachable": False,
                "model": self.model,
                "error": "XAI_API_KEY is not configured or invalid.",
            }

        start = time.time()
        try:
            client = self._get_client()
            # List models to verify the key and endpoint are valid
            client.models.list()
            latency_ms = int((time.time() - start) * 1000)
            logger.info(
                f"AI health check: provider reachable, model={self.model}, latency={latency_ms}ms"
            )
            return {
                "configured": True,
                "reachable": True,
                "model": self.model,
                "latency_ms": latency_ms,
            }
        except Exception as e:
            latency_ms = int((time.time() - start) * 1000)
            logger.error(
                f"AI health check failed: category=connection, latency={latency_ms}ms, error={type(e).__name__}"
            )
            return {
                "configured": True,
                "reachable": False,
                "model": self.model,
                "error": f"AI provider unreachable: {type(e).__name__}",
            }

    def chat_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        response_format: Optional[dict] = None,
        request_type: str = "chat",
        model_override: Optional[str] = None,
    ) -> str:
        """
        Sends a chat completion request to the AI provider.
        Raises AIClientError on failure — does NOT silently fall back.
        """
        if not self.is_configured:
            raise AIClientError(
                "AI service is not configured. Please set XAI_API_KEY in the environment.",
                category="config",
            )

        client = self._get_client()
        start = time.time()
        request_model = model_override or self.model
        logger.info(f"AI request started: type={request_type}, model={request_model}")

        try:
            kwargs = {
                "model": request_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
            }
            if response_format:
                kwargs["response_format"] = response_format

            response = client.chat.completions.create(**kwargs)
            latency_ms = int((time.time() - start) * 1000)
            content = response.choices[0].message.content or ""

            logger.info(
                f"AI request succeeded: type={request_type}, model={request_model}, latency={latency_ms}ms"
            )
            return content
        except Exception as e:
            latency_ms = int((time.time() - start) * 1000)
            error_category = "api"
            if "model" in str(e).lower():
                error_category = "model_not_found"
            elif "api key" in str(e).lower() or "authentication" in str(e).lower():
                error_category = "auth"
            elif "connection" in str(e).lower() or "timeout" in str(e).lower():
                error_category = "connection"

            logger.error(
                f"AI request failed: type={request_type}, model={request_model}, "
                f"category={error_category}, latency={latency_ms}ms, error={type(e).__name__}"
            )
            raise AIClientError(
                f"AI service error: {type(e).__name__}. Please try again.",
                category=error_category,
            )


ai_client = AIClient()