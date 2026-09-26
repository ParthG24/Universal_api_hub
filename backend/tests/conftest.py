import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base, get_db
from app.main import app
from app.core.security import get_password_hash, hash_api_key, create_access_token
from app.db.models import Admin, Connector, InputField

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed test admin
    admin = Admin(
        email="testadmin@example.com",
        password_hash=get_password_hash("TestPassword123!"),
    )
    session.add(admin)

    # Seed test connector
    test_key = "uah_test_key_12345"
    connector = Connector(
        slug="test-rephrase",
        name="Test Rephrase",
        description="A test connector",
        provider="groq",
        model="llama-3.1-8b-instant",
        system_prompt="Rephrase text into JSON",
        output_schema={"rephrased": "string", "count": "number"},
        status="active",
        api_key_hash=hash_api_key(test_key),
    )
    session.add(connector)
    session.flush()

    field1 = InputField(
        connector_id=connector.id,
        name="text",
        field_type="text",
        required=True,
        description="Input text",
        validation_rules={"min_length": 3, "max_length": 500},
        order=0,
    )
    session.add(field1)
    session.commit()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token():
    return create_access_token("testadmin@example.com")
