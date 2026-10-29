import pytest


def get_token(client, email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_student_cannot_create_course(client):
    student_token = get_token(client, "aarav.patel@student.com", "Student@123")
    res = client.post(
        "/api/v1/courses",
        json={"name": "Hacking 101", "code": "HACK-101"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    # Must be 403 Forbidden
    assert res.status_code == 403


def test_student_cannot_record_payment(client):
    student_token = get_token(client, "aarav.patel@student.com", "Student@123")
    res = client.post(
        "/api/v1/fees/payments",
        json={
            "student_id": "any-id",
            "fee_assignment_id": "any-id",
            "amount": 1000.0,
            "payment_method": "CASH"
        },
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 403


def test_admin_dashboard_stats(client):
    admin_token = get_token(client, "admin@apexacademy.com", "Admin@123")
    res = client.get("/api/v1/reports/dashboard-stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    stats = res.json()["data"]
    assert stats["active_students_count"] >= 10
    assert stats["faculty_count"] >= 2
    assert stats["active_batches_count"] >= 2
    assert "fees_collected_this_month" in stats


def test_faculty_assigned_classes(client):
    faculty_token = get_token(client, "prof.sharma@apexacademy.com", "Faculty@123")
    res = client.get("/api/v1/faculty/me/classes", headers={"Authorization": f"Bearer {faculty_token}"})
    assert res.status_code == 200
    classes = res.json()["data"]
    assert len(classes) >= 1
    assert "batch_name" in classes[0]


def test_student_fee_details(client):
    student_token = get_token(client, "aarav.patel@student.com", "Student@123")
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {student_token}"}).json()["data"]
    
    # Get student record
    admin_token = get_token(client, "admin@apexacademy.com", "Admin@123")
    students_res = client.get("/api/v1/students", headers={"Authorization": f"Bearer {admin_token}"})
    students = students_res.json()["data"]["items"]
    aarav = [s for s in students if s["user"]["email"] == "aarav.patel@student.com"][0]

    # Student views their own fee details
    res = client.get(f"/api/v1/fees/student/{aarav['id']}", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    fee_assignments = res.json()["data"]
    assert len(fee_assignments) >= 1
    assert fee_assignments[0]["student_id"] == aarav["id"]


def test_pdf_receipt_download(client):
    admin_token = get_token(client, "admin@apexacademy.com", "Admin@123")
    payments_res = client.get("/api/v1/fees/payments", headers={"Authorization": f"Bearer {admin_token}"})
    payments = payments_res.json()["data"]
    assert len(payments) >= 1
    receipt_num = payments[0]["receipt_number"]
    assert receipt_num is not None

    res = client.get(f"/api/v1/fees/receipts/{receipt_num}/pdf", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
