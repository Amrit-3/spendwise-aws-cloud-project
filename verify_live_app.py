"""
Live Server Integration and End-to-End Verification Script
Tests all HTTP endpoints, static assets, and full CRUD flow against live running server.
"""
import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def request_json(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            content = response.read().decode("utf-8")
            try:
                return status, json.loads(content)
            except json.JSONDecodeError:
                return status, content
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except json.JSONDecodeError:
            return e.code, content

def run_live_tests():
    print(f"[*] Beginning Live Verification against: {BASE_URL}\n")

    # 1. Homepage HTML
    status, html = request_json("/")
    assert status == 200, f"Expected 200 for /, got {status}"
    assert "SpendWise" in html, "SpendWise brand missing from HTML"
    assert "Total Spending" in html, "Total Spending metric missing"
    assert "Spending by Category" in html, "Category chart missing"
    print("  [PASS] 1. Homepage loads successfully (Status 200)")

    # 2. Static CSS
    status, css = request_json("/static/style.css")
    assert status == 200, f"Expected 200 for style.css, got {status}"
    assert "--brand-gradient" in css, "CSS theme variables missing"
    print("  [PASS] 2. Static CSS file served correctly (Status 200)")

    # 3. Static JS
    status, js = request_json("/static/script.js")
    assert status == 200, f"Expected 200 for script.js, got {status}"
    assert "renderCategoryChart" in js, "Chart controller missing in JS"
    print("  [PASS] 3. Static JS file served correctly (Status 200)")

    # 4. Health Check
    status, health = request_json("/api/health")
    assert status == 200, f"Expected 200 for /api/health, got {status}"
    assert health["status"] == "success", "Health status not success"
    print("  [PASS] 4. API Health endpoint responds (Status 200)")

    # 5. Categories
    status, cat_res = request_json("/api/categories")
    assert status == 200, f"Expected 200 for /api/categories, got {status}"
    assert len(cat_res["categories"]) >= 5, "Categories list is too short"
    print(f"  [PASS] 5. Categories endpoint returned {len(cat_res['categories'])} categories")

    # 6. Initial Expenses
    status, exp_res = request_json("/api/expenses")
    assert status == 200, f"Expected 200 for /api/expenses, got {status}"
    initial_count = exp_res["count"]
    print(f"  [PASS] 6. GET /api/expenses returned {initial_count} records (Total: ${exp_res['total_amount']:.2f})")

    # 7. Statistics
    status, stats_res = request_json("/api/expenses/stats")
    assert status == 200, f"Expected 200 for /api/expenses/stats, got {status}"
    stats = stats_res["stats"]
    assert stats["transaction_count"] == initial_count
    assert len(stats["category_spending"]) > 0
    print(f"  [PASS] 7. GET /api/expenses/stats returned valid metrics (Highest: ${stats['highest_expense']['amount']:.2f})")

    # 8. Create New Expense (POST)
    new_expense_payload = {
        "title": "Fresh Organic Berries",
        "amount": 22.50,
        "category": "Food & Dining",
        "date": "2026-09-18",
        "notes": "Farmer market trip"
    }
    status, create_res = request_json("/api/expenses", method="POST", data=new_expense_payload)
    assert status == 201, f"Expected 201 for POST /api/expenses, got {status}"
    created_id = create_res["expense"]["id"]
    assert create_res["expense"]["title"] == "Fresh Organic Berries"
    print(f"  [PASS] 8. POST /api/expenses created expense ID #{created_id} (Status 201)")

    # 9. Search by Query Filter
    status, search_res = request_json(f"/api/expenses?search={urllib.parse.quote('Berries')}")
    assert status == 200, f"Expected 200 for search, got {status}"
    assert any(e["id"] == created_id for e in search_res["expenses"]), "Search failed to find created item"
    print(f"  [PASS] 9. Live search filter query verified (Found {search_res['count']} match)")

    # 10. Update Expense (PUT)
    update_payload = {
        "title": "Fresh Organic Berries & Wild Honey",
        "amount": 27.80,
        "category": "Food & Dining",
        "date": "2026-09-18",
        "notes": "Added wild raw honey jar"
    }
    status, update_res = request_json(f"/api/expenses/{created_id}", method="PUT", data=update_payload)
    assert status == 200, f"Expected 200 for PUT /api/expenses/{created_id}, got {status}"
    assert update_res["expense"]["amount"] == 27.80
    assert update_res["expense"]["title"] == "Fresh Organic Berries & Wild Honey"
    print(f"  [PASS] 10. PUT /api/expenses/{created_id} updated successfully (Status 200)")

    # 11. Delete Expense (DELETE)
    status, delete_res = request_json(f"/api/expenses/{created_id}", method="DELETE")
    assert status == 200, f"Expected 200 for DELETE /api/expenses/{created_id}, got {status}"
    print(f"  [PASS] 11. DELETE /api/expenses/{created_id} deleted successfully (Status 200)")

    # 12. Confirm Deletion
    status, get_deleted = request_json(f"/api/expenses/{created_id}")
    assert status == 404, f"Expected 404 after deletion, got {status}"
    print(f"  [PASS] 12. GET /api/expenses/{created_id} correctly returned 404 Not Found")

    # 13. Validation Error Handling
    status, err_res = request_json("/api/expenses", method="POST", data={"title": "", "amount": -5})
    assert status == 400, f"Expected 400 Bad Request, got {status}"
    assert err_res["status"] == "error"
    print("  [PASS] 13. Input validation error correctly rejected with 400 Bad Request")

    print("\n" + "=" * 60)
    print("  [SUCCESS] ALL 13 LIVE VERIFICATION TESTS PASSED!")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    run_live_tests()
