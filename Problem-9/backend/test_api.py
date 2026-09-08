from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing /api/health ...")
    r = client.get("/api/health")
    assert r.status_code == 200, r.text
    print("[OK] Health check:", r.json())

    print("Testing /api/dashboard/summary ...")
    r = client.get("/api/dashboard/summary?period=this_month")
    assert r.status_code == 200, r.text
    print("[OK] Dashboard summary:", r.json())

    print("Testing /api/dashboard/category-expenses ...")
    r = client.get("/api/dashboard/category-expenses?period=this_month")
    assert r.status_code == 200, r.text
    print(f"[OK] Category expenses count: {len(r.json())}")

    print("Testing /api/dashboard/insights ...")
    r = client.get("/api/dashboard/insights")
    assert r.status_code == 200, r.text
    print("[OK] Financial insights:", r.json()["smart_tip"].encode('ascii', 'replace').decode())

    print("Testing /api/transactions ...")
    r = client.get("/api/transactions?limit=10")
    assert r.status_code == 200, r.text
    print(f"[OK] Transactions total: {r.json()['total']}, returned: {len(r.json()['items'])}")

    print("Testing /api/transactions/export/csv ...")
    r = client.get("/api/transactions/export/csv")
    assert r.status_code == 200, r.text
    assert "Transaction ID" in r.text
    print("[OK] CSV export verified!")

    print("Testing /api/accounts ...")
    r = client.get("/api/accounts")
    assert r.status_code == 200, r.text
    print(f"[OK] Accounts count: {len(r.json())}")

    print("Testing /api/categories ...")
    r = client.get("/api/categories")
    assert r.status_code == 200, r.text
    print(f"[OK] Categories count: {len(r.json())}")

    print("Testing /api/budgets ...")
    r = client.get("/api/budgets")
    assert r.status_code == 200, r.text
    print(f"[OK] Budgets count: {len(r.json())}")

    print("Testing /api/credit-cards/summary ...")
    r = client.get("/api/credit-cards/summary")
    assert r.status_code == 200, r.text
    print(f"[OK] Credit cards total outstanding: {r.json()['total_outstanding']}")

    print("Testing /api/insurance/summary ...")
    r = client.get("/api/insurance/summary")
    assert r.status_code == 200, r.text
    print(f"[OK] Insurance total premium: {r.json()['total_insurance_premium']}")

    print("Testing /api/transactions/upload-receipt ...")
    import io
    test_file = io.BytesIO(b"dummy image bytes for test")
    r = client.post("/api/transactions/upload-receipt", files={"file": ("receipt.png", test_file, "image/png")})
    assert r.status_code == 200, r.text
    assert "url" in r.json()
    print(f"[OK] Receipt upload verified: {r.json()['url']}")

    print("Testing /api/categories total_amount and counts ...")
    r = client.get("/api/categories")
    assert r.status_code == 200, r.text
    cats = r.json()
    assert len(cats) > 0
    assert "total_amount" in cats[0]
    print(f"[OK] Categories count: {len(cats)}, Sample category '{cats[0]['name']}' total spent: {cats[0]['total_amount']}")

    print("Testing /api/transactions/scan-invoice (USD + Debit Card Receipt) ...")
    with open("uploads/sample_usd_debit_receipt.png", "rb") as f:
        r = client.post("/api/transactions/scan-invoice", files={"file": ("sample_usd.png", f, "image/png")})
    assert r.status_code == 200, r.text
    scan_usd = r.json()
    assert scan_usd["currency"] == "USD", f"Expected USD but got {scan_usd.get('currency')}"
    assert scan_usd["payment_method"] == "Debit Card", f"Expected Debit Card but got {scan_usd.get('payment_method')}"
    assert scan_usd["original_amount"] == 49.0, f"Expected 49.0 but got {scan_usd.get('original_amount')}"
    print(f"[OK] Scanned USD Debit Receipt correctly: {scan_usd['title']} | ${scan_usd['original_amount']} USD -> Rs {scan_usd['amount']} | Payment: {scan_usd['payment_method']}")

    print("Testing Creating Multi-Currency Transaction & Newest First Sorting ...")
    tx_payload = {
        "title": "Automated Test DigitalOcean Hosting",
        "amount": 4238.5,
        "original_amount": 49.0,
        "currency": "USD",
        "exchange_rate": 86.5,
        "type": "Expense",
        "category_id": cats[0]["id"],
        "account_id": 1,
        "date": "2026-09-08T14:30:00Z",
        "payment_method": "Debit Card",
        "notes": "Verified Multi-Currency & Debit Card Test",
        "status": "Completed"
    }
    r = client.post("/api/transactions", json=tx_payload)
    assert r.status_code == 201, r.text
    created_tx = r.json()
    assert created_tx["currency"] == "USD"
    assert created_tx["original_amount"] == 49.0

    # Verify this new transaction is strictly the FIRST item in transactions list
    r_list = client.get("/api/transactions?limit=5")
    assert r_list.status_code == 200
    first_item = r_list.json()["items"][0]
    assert first_item["id"] == created_tx["id"], f"Expected newest tx {created_tx['id']} on top, but got {first_item['id']}"
    print(f"[OK] Newest transaction #{created_tx['id']} verified at index 0 of history!")

    print("\nALL BACKEND API AND MULTI-CURRENCY TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()
