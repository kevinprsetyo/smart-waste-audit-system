"""
ollama_service.py
-----------------
Reusable Ollama Cloud client service.

Wraps the official `ollama` Python SDK to communicate with the Ollama
Cloud API (https://ollama.com) using an API key loaded from the environment.

Responsibilities
----------------
- Read OLLAMA_API_KEY from environment (via python-dotenv).
- Construct a singleton `ollama.Client` pointed at the Ollama Cloud host.
- Expose `generate_audit_report()` — a single coroutine that takes a prompt
  and returns the model's text response.
- Raise `OllamaServiceError` for any API-level failure so callers can map it
  to an appropriate HTTP status code.
"""

import logging
import os
from typing import Final

import ollama
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load .env  (no-op if .env does not exist; env vars already set take priority)
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
OLLAMA_CLOUD_HOST: Final[str] = "https://ollama.com"
OLLAMA_MODEL: Final[str] = "gpt-oss:120b"

# ---------------------------------------------------------------------------
# Custom exception
# ---------------------------------------------------------------------------


class OllamaServiceError(Exception):
    """
    Raised when the Ollama Cloud API is unreachable, returns an error,
    or is mis-configured (e.g. missing API key).
    """


# ---------------------------------------------------------------------------
# Singleton client
# ---------------------------------------------------------------------------
_client: ollama.Client | None = None


def _get_client() -> ollama.Client:
    """
    Return the module-level Ollama Cloud client, creating it on first call.

    Raises
    ------
    OllamaServiceError
        If ``OLLAMA_API_KEY`` is not set in the environment.
    """
    global _client

    if _client is not None:
        return _client

    api_key: str | None = os.getenv("OLLAMA_API_KEY")
    if not api_key:
        raise OllamaServiceError(
            "OLLAMA_API_KEY environment variable is not set. "
            "Copy .env.example → .env and add your Ollama Cloud API key."
        )

    logger.info("Initialising Ollama Cloud client (host=%s, model=%s)", OLLAMA_CLOUD_HOST, OLLAMA_MODEL)

    _client = ollama.Client(
        host=OLLAMA_CLOUD_HOST,
        headers={"Authorization": f"Bearer {api_key}"},
    )

    return _client


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def generate_audit_report(prompt: str) -> str:
    """
    Send *prompt* to the Ollama Cloud model and return the generated text.

    Parameters
    ----------
    prompt : str
        The complete audit prompt (built by :func:`statistics.build_audit_prompt`).

    Returns
    -------
    str
        The model's raw text response (stripped of leading/trailing whitespace).

    Raises
    ------
    OllamaServiceError
        On any configuration error, network failure, or API error from Ollama.
        The caller (route handler) should map this to HTTP 503.
    """
    client = _get_client()

    messages: list[dict[str, str]] = [
        {"role": "user", "content": prompt},
    ]

    logger.info("Sending audit prompt to Ollama Cloud model '%s'  (%d chars)", OLLAMA_MODEL, len(prompt))

    try:
        response: ollama.ChatResponse = client.chat(
            model=OLLAMA_MODEL,
            messages=messages,
        )
    except ollama.ResponseError as exc:
        logger.error("Ollama API returned an error: status=%s  error=%s", exc.status_code, exc.error)
        raise OllamaServiceError(
            f"Ollama Cloud API error (HTTP {exc.status_code}): {exc.error}"
        ) from exc
    except Exception as exc:
        logger.error("Unexpected error communicating with Ollama Cloud: %s", exc)
        raise OllamaServiceError(
            f"Failed to reach Ollama Cloud: {exc}"
        ) from exc

    # Safely extract the response text
    try:
        report: str = response.message.content.strip()
    except AttributeError as exc:
        logger.error("Unexpected response structure from Ollama: %s", response)
        raise OllamaServiceError("Ollama returned an unexpected response format.") from exc

    logger.info("Audit report generated successfully  (%d chars)", len(report))
    return report
