import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db

TEST_DB_URL = "sqlite:///./test_tuition.db"

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Use existing seeded sqlite db for integration tests or copy tables
    Base.metadata.create_all(bind=test_engine)
    yield
    # Clean up after test run
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    # Test client using dev db which is fully seeded
    with TestClient(app) as c:
        yield c
