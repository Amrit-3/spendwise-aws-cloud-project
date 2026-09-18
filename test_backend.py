"""
Comprehensive Backend Automated Test Suite for SpendWise Expense Tracker
"""
import os
import json
import unittest
import sqlite3
from app import app, init_db, get_db_connection, DATABASE_PATH

class ExpenseTrackerBackendTestCase(unittest.TestCase):
    def setUp(self):
        import app as app_module
        self.test_db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "test_database.db")
        app_module.DATABASE_PATH = self.test_db_path
        app.config["TESTING"] = True
        self.client = app.test_client()
        
        # Ensure fresh test database state
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)
        init_db()

    def tearDown(self):
        if os.path.exists(self.test_db_path):
            os.remove(self.test_db_path)

    def test_database_initialization_and_seeding(self):
        """Verify database and sample data are automatically created."""
        self.assertTrue(os.path.exists(DATABASE_PATH), "Database file was not created.")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM expenses")
        count = cursor.fetchone()["count"]
        conn.close()
        
        self.assertEqual(count, 5, f"Expected 5 initial sample expenses, found {count}")

    def test_health_check_endpoint(self):
        """Test GET /api/health."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIn("healthy", data["message"].lower())

    def test_get_categories(self):
        """Test GET /api/categories."""
        response = self.client.get("/api/categories")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertIsInstance(data["categories"], list)
        self.assertIn("Food & Dining", data["categories"])
        self.assertIn("Shopping", data["categories"])

    def test_get_all_expenses(self):
        """Test GET /api/expenses."""
        response = self.client.get("/api/expenses")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["count"], 5)
        self.assertGreater(data["total_amount"], 0)
        self.assertEqual(len(data["expenses"]), 5)

    def test_create_expense_success(self):
        """Test POST /api/expenses with valid payload."""
        payload = {
            "title": "Gym Membership",
            "amount": 49.99,
            "category": "Health & Wellness",
            "date": "2026-09-18",
            "notes": "Monthly fitness club membership"
        }
        response = self.client.post(
            "/api/expenses",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["expense"]["title"], "Gym Membership")
        self.assertEqual(data["expense"]["amount"], 49.99)
        self.assertEqual(data["expense"]["category"], "Health & Wellness")
        self.assertEqual(data["expense"]["date"], "2026-09-18")
        self.assertIsNotNone(data["expense"]["id"])

    def test_create_expense_validation_errors(self):
        """Test POST /api/expenses with invalid payloads."""
        # Missing title
        res1 = self.client.post(
            "/api/expenses",
            data=json.dumps({"amount": 25.00, "category": "Food & Dining", "date": "2026-09-18"}),
            content_type="application/json"
        )
        self.assertEqual(res1.status_code, 400)
        self.assertIn("Title is required", json.dumps(res1.get_json()))

        # Negative amount
        res2 = self.client.post(
            "/api/expenses",
            data=json.dumps({"title": "Refund", "amount": -10.0, "category": "Food & Dining", "date": "2026-09-18"}),
            content_type="application/json"
        )
        self.assertEqual(res2.status_code, 400)

        # Invalid date format
        res3 = self.client.post(
            "/api/expenses",
            data=json.dumps({"title": "Lunch", "amount": 15.0, "category": "Food & Dining", "date": "18-09-2026"}),
            content_type="application/json"
        )
        self.assertEqual(res3.status_code, 400)

    def test_get_single_expense(self):
        """Test GET /api/expenses/<id>."""
        response = self.client.get("/api/expenses/1")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["expense"]["id"], 1)

        # Non-existent
        res_404 = self.client.get("/api/expenses/9999")
        self.assertEqual(res_404.status_code, 404)

    def test_update_expense(self):
        """Test PUT /api/expenses/<id>."""
        update_payload = {
            "title": "Whole Foods Grocery - Updated",
            "amount": 160.00,
            "category": "Food & Dining",
            "date": "2026-09-18",
            "notes": "Added wine and organic produce"
        }
        response = self.client.put(
            "/api/expenses/1",
            data=json.dumps(update_payload),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["expense"]["title"], "Whole Foods Grocery - Updated")
        self.assertEqual(data["expense"]["amount"], 160.00)

        # Non-existent
        res_404 = self.client.put(
            "/api/expenses/9999",
            data=json.dumps(update_payload),
            content_type="application/json"
        )
        self.assertEqual(res_404.status_code, 404)

    def test_delete_expense(self):
        """Test DELETE /api/expenses/<id>."""
        response = self.client.delete("/api/expenses/1")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")

        # Verify deletion
        get_res = self.client.get("/api/expenses/1")
        self.assertEqual(get_res.status_code, 404)

        # Delete non-existent
        del_404 = self.client.delete("/api/expenses/9999")
        self.assertEqual(del_404.status_code, 404)

    def test_get_statistics(self):
        """Test GET /api/expenses/stats."""
        response = self.client.get("/api/expenses/stats")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "success")
        stats = data["stats"]
        self.assertEqual(stats["transaction_count"], 5)
        self.assertGreater(stats["total_spending"], 0)
        self.assertGreater(stats["average_expense"], 0)
        self.assertIsNotNone(stats["highest_expense"])
        self.assertIsInstance(stats["category_spending"], list)
        self.assertIsInstance(stats["monthly_spending"], list)

    def test_search_and_filter(self):
        """Test query filters on GET /api/expenses."""
        # Search by keyword
        res_search = self.client.get("/api/expenses?search=Uber")
        self.assertEqual(res_search.status_code, 200)
        data_search = res_search.get_json()
        self.assertEqual(data_search["count"], 1)
        self.assertIn("Uber", data_search["expenses"][0]["title"])

        # Category filter
        res_cat = self.client.get("/api/expenses?category=Transportation")
        self.assertEqual(res_cat.status_code, 200)
        data_cat = res_cat.get_json()
        self.assertEqual(data_cat["count"], 1)
        self.assertEqual(data_cat["expenses"][0]["category"], "Transportation")

        # Sort by amount desc
        res_sort = self.client.get("/api/expenses?sort_by=amount&order=desc")
        self.assertEqual(res_sort.status_code, 200)
        data_sort = res_sort.get_json()
        amounts = [e["amount"] for e in data_sort["expenses"]]
        self.assertEqual(amounts, sorted(amounts, reverse=True))

    def test_frontend_homepage_renders(self):
        """Test GET / renders HTML template."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        html = response.get_data(as_text=True)
        self.assertIn("SpendWise", html)
        self.assertIn("Total Spending", html)
        self.assertIn("Add New Expense", html)

if __name__ == "__main__":
    unittest.main(verbosity=2)
