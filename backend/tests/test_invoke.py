from unittest.mock import AsyncMock, patch
from app.providers.base import ProviderResult


def test_admin_login_success(client):
    response = client.post(
        "/api/admin/auth/login",
        json={"email": "testadmin@example.com", "password": "TestPassword123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_admin_login_bad_credentials(client):
    response = client.post(
        "/api/admin/auth/login",
        json={"email": "testadmin@example.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401


def test_get_connector_docs_public(client):
    response = client.get("/api/connectors/test-rephrase/docs")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "test-rephrase"
    assert "curl_snippet" in data
    assert "parameters" in data


def test_invoke_missing_api_key(client):
    response = client.post(
        "/api/connectors/test-rephrase/invoke",
        json={"text": "Hello world"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["type"] == "auth_error"


def test_invoke_with_valid_key_and_mocked_provider(client):
    mock_result = ProviderResult(
        raw_text='{"rephrased": "Greetings world", "count": 2}',
        input_tokens=15,
        output_tokens=8,
        total_tokens=23,
        estimated_cost=0.00001,
        latency_ms=120.0,
    )

    with patch("app.providers.groq.GroqProvider.generate", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_result

        response = client.post(
            "/api/connectors/test-rephrase/invoke",
            headers={"X-API-Key": "uah_test_key_12345"},
            json={"text": "Hello world"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["rephrased"] == "Greetings world"
        assert data["data"]["count"] == 2
        assert data["meta"]["tokens"] == 23


def test_invoke_validation_failure(client):
    # 'text' is required and has min_length 3
    response = client.post(
        "/api/connectors/test-rephrase/invoke",
        headers={"X-API-Key": "uah_test_key_12345"},
        json={"text": "a"},  # too short
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error"]["type"] == "validation_error"
