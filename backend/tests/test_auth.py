def test_health_and_ready(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    res_ready = client.get("/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"


def test_admin_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@apexacademy.com",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "ADMIN"


def test_faculty_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "prof.sharma@apexacademy.com",
        "password": "Faculty@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["data"]["user"]["role"] == "FACULTY"


def test_student_login_success(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "aarav.patel@student.com",
        "password": "Student@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["data"]["user"]["role"] == "STUDENT"


def test_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@apexacademy.com",
        "password": "WrongPassword999!"
    })
    assert res.status_code == 401


def test_get_current_user_me(client):
    # Login as admin
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@apexacademy.com",
        "password": "Admin@123"
    })
    token = login_res.json()["data"]["access_token"]

    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    user_data = me_res.json()["data"]
    assert user_data["email"] == "admin@apexacademy.com"
    assert user_data["role"] == "ADMIN"
