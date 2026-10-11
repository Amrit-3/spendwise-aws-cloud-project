import os
import psycopg2
from psycopg2.extras import RealDictCursor
import socket
from datetime import datetime
from flask import Flask, request, jsonify, render_template
import uuid
import boto3
from botocore.config import Config

S3_BUCKET = os.environ.get("S3_BUCKET")
S3_REGION = os.environ.get("AWS_REGION", "ap-south-1")
ALLOWED_RECEIPT_TYPES = {"image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf"}
MAX_RECEIPT_BYTES = 5 * 1024 * 1024  # 5 MB

_s3 = None
def get_s3():
    global _s3
    if _s3 is None:
        _s3 = boto3.client("s3", region_name=S3_REGION, config=Config(signature_version="s3v4"))
    return _s3

# Configuration
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "database.db")

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)
app.config["MAX_CONTENT_LENGTH"] = MAX_RECEIPT_BYTES + 512 * 1024

# Standard Categories
DEFAULT_CATEGORIES = [
    "Food & Dining",
    "Housing & Utilities",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Health & Wellness",
    "Education",
    "Travel",
    "Bills & Subscriptions",
    "Personal Care",
    "Other"
]

def get_db_connection():
    """Create a database connection with dictionary-like row factory and ensure schema exists."""
    conn = psycopg2.connect(
        dbname=os.environ.get("DB_NAME", "expense_tracker"),
        user=os.environ.get("DB_USER", "amrit"),
        password=os.environ.get("DB_PASSWORD"),
        host=os.environ.get("DB_HOST", "localhost"),
        port=os.environ.get("DB_PORT", "5432"),
        sslmode=os.environ.get("DB_SSLMODE", "prefer"),
        connect_timeout=5,
        cursor_factory=RealDictCursor
    )
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    return conn

def init_db():
    """Initialize SQLite database, tables, and seed initial sample data if empty."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()

    # Check if database is empty; if so, insert 5 realistic sample expenses
    cursor.execute("SELECT COUNT(*) as count FROM expenses")
    count = cursor.fetchone()["count"]
    
    if count == 0:
        today = datetime.now()
        sample_expenses = [
            (
                "Whole Foods Grocery Shopping",
                142.50,
                "Food & Dining",
                today.strftime("%Y-%m-%d"),
                "Weekly organic groceries, vegetables, and pantry items"
            ),
            (
                "High-Speed Fiber Internet",
                65.00,
                "Housing & Utilities",
                today.strftime("%Y-%m-") + f"{max(1, today.day - 2):02d}",
                "Monthly broadband 1Gbps fiber internet bill"
            ),
            (
                "Uber Airport Ride",
                38.75,
                "Transportation",
                today.strftime("%Y-%m-") + f"{max(1, today.day - 4):02d}",
                "Morning transit to airport terminal"
            ),
            (
                "Ergonomic Standing Desk",
                289.99,
                "Shopping",
                today.strftime("%Y-%m-") + f"{max(1, today.day - 7):02d}",
                "Motorized dual-motor adjustable standing desk for home office"
            ),
            (
                "Netflix & Spotify Subscriptions",
                28.98,
                "Entertainment",
                today.strftime("%Y-%m-") + f"{max(1, today.day - 10):02d}",
                "Monthly digital streaming and music bundle"
            ),
        ]
        
        cursor.executemany("""
            INSERT INTO expenses (title, amount, category, date, notes)
            VALUES (%s, %s, %s, %s, %s)
        """, sample_expenses)
        conn.commit()
        print("[DATABASE] Seeded 5 initial sample expenses.")
        
    conn.close()

def validate_expense_data(data, is_update=False):
    """Validate incoming expense JSON payload."""
    errors = []
    
    # Title
    if "title" in data or not is_update:
        title = data.get("title")
        if not title or not isinstance(title, str) or not title.strip():
            errors.append("Title is required and must be a non-empty string.")
        elif len(title.strip()) > 150:
            errors.append("Title must not exceed 150 characters.")

    # Amount
    if "amount" in data or not is_update:
        amount = data.get("amount")
        if amount is None:
            errors.append("Amount is required.")
        else:
            try:
                val = float(amount)
                if val <= 0:
                    errors.append("Amount must be greater than 0.")
                elif val > 1_000_000_000:
                    errors.append("Amount must be reasonable (less than $1,000,000,000).")
            except (ValueError, TypeError):
                errors.append("Amount must be a valid number.")

    # Category
    if "category" in data or not is_update:
        category = data.get("category")
        if not category or not isinstance(category, str) or not category.strip():
            errors.append("Category is required.")
        elif len(category.strip()) > 100:
            errors.append("Category must not exceed 100 characters.")

    # Date
    if "date" in data or not is_update:
        date_str = data.get("date")
        if not date_str or not isinstance(date_str, str):
            errors.append("Date is required in YYYY-MM-DD format.")
        else:
            try:
                datetime.strptime(date_str.strip(), "%Y-%m-%d")
            except ValueError:
                errors.append("Date must be a valid date in YYYY-MM-DD format.")

    # Notes (optional)
    if "notes" in data and data["notes"] is not None:
        notes = data.get("notes")
        if not isinstance(notes, str):
            errors.append("Notes must be a string.")
        elif len(notes) > 1000:
            errors.append("Notes must not exceed 1000 characters.")

    return errors

# --- Frontend Route ---

def ensure_schema():
    """Add the receipt_key column if it doesn't exist yet (safe to run repeatedly)."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_key TEXT")
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[SCHEMA] could not ensure schema: {e}")

ensure_schema()

@app.route("/")
def index():
    """Render the dashboard UI."""
    return render_template("index.html")

# --- REST API Endpoints ---

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "success",
        "message": "Personal Expense Tracker API is active and healthy.",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/categories", methods=["GET"])
def get_categories():
    """Return standard supported categories."""
    return jsonify({
        "status": "success",
        "categories": DEFAULT_CATEGORIES
    })

@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    """
    Get all expenses with optional filtering, search, and sorting.
    Query parameters:
      - search: string (matches title or notes)
      - category: string (exact match, 'All' for all)
      - start_date: YYYY-MM-DD
      - end_date: YYYY-MM-DD
      - sort_by: 'date' | 'amount' | 'title' | 'id' (default: 'date')
      - order: 'asc' | 'desc' (default: 'desc')
    """
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    sort_by = request.args.get("sort_by", "date").strip().lower()
    order = request.args.get("order", "desc").strip().lower()

    allowed_sort_columns = {
        "date": "date",
        "amount": "amount",
        "title": "title",
        "category": "category",
        "id": "id"
    }
    sort_col = allowed_sort_columns.get(sort_by, "date")
    sort_dir = "ASC" if order == "asc" else "DESC"

    query = "SELECT * FROM expenses WHERE 1=1"
    params = []

    if search:
        query += " AND (title LIKE %s OR notes LIKE %s)"
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern])

    if category and category.lower() != "all":
        query += " AND category = %s"
        params.append(category)

    if start_date:
        query += " AND date >= %s"
        params.append(start_date)

    if end_date:
        query += " AND date <= %s"
        params.append(end_date)

    # Order query
    query += f" ORDER BY {sort_col} {sort_dir}, id DESC"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    expenses = [dict(row) for row in rows]
    total_amount = sum(e["amount"] for e in expenses)
    conn.close()

    return jsonify({
        "status": "success",
        "count": len(expenses),
        "total_amount": round(total_amount, 2),
        "expenses": expenses
    })

@app.route("/api/expenses", methods=["POST"])
def add_expense():
    """Create a new expense entry."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            "status": "error",
            "message": "Invalid or missing JSON payload in request body."
        }), 400

    errors = validate_expense_data(data, is_update=False)
    if errors:
        return jsonify({
            "status": "error",
            "message": "Validation failed.",
            "errors": errors
        }), 400

    title = data["title"].strip()
    amount = round(float(data["amount"]), 2)
    category = data["category"].strip()
    date = data["date"].strip()
    notes = data.get("notes", "").strip() if data.get("notes") else None

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO expenses (title, amount, category, date, notes)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (title, amount, category, date, notes))
    conn.commit()
    new_id = cursor.fetchone()["id"]

    cursor.execute("SELECT * FROM expenses WHERE id = %s", (new_id,))
    new_expense = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "status": "success",
        "message": "Expense created successfully.",
        "expense": new_expense
    }), 201

@app.route("/api/expenses/<int:expense_id>", methods=["GET"])
def get_expense(expense_id):
    """Retrieve a single expense by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE id = %s", (expense_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({
            "status": "error",
            "message": f"Expense with ID {expense_id} was not found."
        }), 404

    return jsonify({
        "status": "success",
        "expense": dict(row)
    })

@app.route("/api/expenses/<int:expense_id>", methods=["PUT", "PATCH"])
def update_expense(expense_id):
    """Update an existing expense by ID."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            "status": "error",
            "message": "Invalid or missing JSON payload in request body."
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE id = %s", (expense_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        return jsonify({
            "status": "error",
            "message": f"Expense with ID {expense_id} was not found."
        }), 404

    errors = validate_expense_data(data, is_update=(request.method == "PATCH"))
    if errors:
        conn.close()
        return jsonify({
            "status": "error",
            "message": "Validation failed.",
            "errors": errors
        }), 400

    title = data.get("title", existing["title"]).strip()
    amount = round(float(data.get("amount", existing["amount"])), 2)
    category = data.get("category", existing["category"]).strip()
    date = data.get("date", existing["date"]).strip()
    notes = data.get("notes", existing["notes"])
    if notes is not None:
        notes = notes.strip()

    cursor.execute("""
        UPDATE expenses
        SET title = %s, amount = %s, category = %s, date = %s, notes = %s
        WHERE id = %s
    """, (title, amount, category, date, notes, expense_id))
    conn.commit()

    cursor.execute("SELECT * FROM expenses WHERE id = %s", (expense_id,))
    updated_expense = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "status": "success",
        "message": "Expense updated successfully.",
        "expense": updated_expense
    })

@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    """Delete an expense by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # First, find the expense
    cursor.execute(
        "SELECT * FROM expenses WHERE id = %s",
        (expense_id,)
    )
    existing = cursor.fetchone()

    # If the expense doesn't exist, return 404
    if not existing:
        conn.close()
        return jsonify({
            "status": "error",
            "message": f"Expense with ID {expense_id} was not found."
        }), 404

    # Delete the expense from PostgreSQL
    cursor.execute(
        "DELETE FROM expenses WHERE id = %s",
        (expense_id,)
    )
    conn.commit()
    conn.close()

    # Delete its receipt from S3, if one exists
    if existing.get("receipt_key") and S3_BUCKET:
        try:
            get_s3().delete_object(
                Bucket=S3_BUCKET,
                Key=existing["receipt_key"]
            )
        except Exception as e:
            print(f"[S3] could not delete receipt: {e}")

    return jsonify({
        "status": "success",
        "message": "Expense deleted successfully.",
        "id": expense_id
    })

@app.route("/api/expenses/stats", methods=["GET"])
@app.route("/api/stats", methods=["GET"])
def get_stats():
    """
    Get aggregated statistics:
    - total_spending
    - transaction_count
    - highest_expense
    - average_expense
    - category_spending (list of { category, total, count, percentage })
    - monthly_spending (list of { month, total, count })
    - recent_expenses
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total & Count & Avg
    cursor.execute("""
        SELECT 
            COALESCE(SUM(amount), 0) as total_spending,
            COUNT(*) as transaction_count,
            COALESCE(AVG(amount), 0) as average_expense,
            COALESCE(MAX(amount), 0) as max_amount
        FROM expenses
    """)
    summary = cursor.fetchone()
    total_spending = round(summary["total_spending"], 2)
    transaction_count = summary["transaction_count"]
    average_expense = round(summary["average_expense"], 2)

    # Highest Expense record
    highest_expense = None
    if transaction_count > 0:
        cursor.execute("SELECT * FROM expenses ORDER BY amount DESC, id DESC LIMIT 1")
        high_row = cursor.fetchone()
        if high_row:
            highest_expense = dict(high_row)

    # Category Spending
    cursor.execute("""
        SELECT 
            category,
            ROUND(SUM(amount)::numeric, 2) as total,
            COUNT(*) as count
        FROM expenses
        GROUP BY category
        ORDER BY total DESC
    """)
    category_rows = cursor.fetchall()
    category_spending = []
    for row in category_rows:
        cat_total = row["total"]
        pct = round((float(cat_total) / float(total_spending) * 100), 1) if total_spending > 0 else 0
        category_spending.append({
            "category": row["category"],
            "total": cat_total,
            "count": row["count"],
            "percentage": pct
        })

    # Monthly Spending (grouped by YYYY-MM)
    cursor.execute("""
        SELECT 
            SUBSTR(date, 1, 7) as month,
            ROUND(SUM(amount)::numeric, 2) AS total,
            COUNT(*) as count
        FROM expenses
        GROUP BY SUBSTR(date, 1, 7)
        ORDER BY month ASC
    """)
    month_rows = cursor.fetchall()
    monthly_spending = []
    for row in month_rows:
        m_str = row["month"]
        try:
            m_dt = datetime.strptime(m_str, "%Y-%m")
            m_label = m_dt.strftime("%b %Y")
        except ValueError:
            m_label = m_str
        monthly_spending.append({
            "month": m_str,
            "label": m_label,
            "total": row["total"],
            "count": row["count"]
        })

    # Recent 5 expenses
    cursor.execute("SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 5")
    recent_rows = cursor.fetchall()
    recent_expenses = [dict(r) for r in recent_rows]

    conn.close()

    return jsonify({
        "status": "success",
        "stats": {
            "total_spending": total_spending,
            "transaction_count": transaction_count,
            "average_expense": average_expense,
            "highest_expense": highest_expense,
            "category_spending": category_spending,
            "monthly_spending": monthly_spending,
            "recent_expenses": recent_expenses
        }
    })

# --- Error Handlers ---

@app.route("/api/expenses/<int:expense_id>/receipt", methods=["POST"])
def upload_receipt(expense_id):
    """Upload a receipt (JPG, PNG or PDF, max 5 MB) for an expense."""
    if not S3_BUCKET:
        return jsonify({"status": "error", "message": "Receipt storage is not configured."}), 503

    file = request.files.get("receipt")
    if not file or not file.filename:
        return jsonify({"status": "error", "message": "No receipt file provided."}), 400

    ext = ALLOWED_RECEIPT_TYPES.get(file.mimetype)
    if not ext:
        return jsonify({"status": "error", "message": "Only JPG, PNG or PDF receipts are allowed."}), 400

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_RECEIPT_BYTES:
        return jsonify({"status": "error", "message": "Receipt must be 5 MB or smaller."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, receipt_key FROM expenses WHERE id = %s", (expense_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"status": "error", "message": f"Expense with ID {expense_id} was not found."}), 404

    new_key = f"receipts/{expense_id}/{uuid.uuid4().hex}.{ext}"
    try:
        get_s3().upload_fileobj(file, S3_BUCKET, new_key, ExtraArgs={"ContentType": file.mimetype})
    except Exception as e:
        conn.close()
        print(f"[S3] upload failed: {e}")
        return jsonify({"status": "error", "message": "Could not store the receipt."}), 502

    old_key = existing["receipt_key"]
    cursor.execute("UPDATE expenses SET receipt_key = %s WHERE id = %s", (new_key, expense_id))
    conn.commit()
    conn.close()

    if old_key:
        try:
            get_s3().delete_object(Bucket=S3_BUCKET, Key=old_key)
        except Exception as e:
            print(f"[S3] could not delete old receipt: {e}")

    return jsonify({"status": "success", "message": "Receipt uploaded."}), 201


@app.route("/api/expenses/<int:expense_id>/receipt", methods=["GET"])
def get_receipt_link(expense_id):
    """Return a temporary (5 minute) link to view the receipt. The bucket stays private."""
    if not S3_BUCKET:
        return jsonify({"status": "error", "message": "Receipt storage is not configured."}), 503

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT receipt_key FROM expenses WHERE id = %s", (expense_id,))
    row = cursor.fetchone()
    conn.close()

    if not row or not row["receipt_key"]:
        return jsonify({"status": "error", "message": "No receipt for this expense."}), 404

    url = get_s3().generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET, "Key": row["receipt_key"]},
        ExpiresIn=300,
    )
    return jsonify({"status": "success", "url": url})

@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({
            "status": "error",
            "message": "Resource or API route not found."
        }), 404
    return render_template("index.html"), 404

@app.errorhandler(405)
def method_not_allowed(e):
    if request.path.startswith("/api/"):
        return jsonify({
            "status": "error",
            "message": "Method not allowed for this endpoint."
        }), 405
    return "Method Not Allowed", 405

@app.errorhandler(500)
def server_error(e):
    if request.path.startswith("/api/"):
        return jsonify({
            "status": "error",
            "message": "An internal server error occurred."
        }), 500
    return "Internal Server Error", 500

def find_available_port(start_port=5000, max_attempts=2):
    """Check if port is available to bind; return the first free port (5000 or 5001)."""
    for port in range(start_port, start_port + max_attempts):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.bind(("127.0.0.1", port))
            sock.close()
            return port
        except OSError:
            sock.close()
            continue
    return start_port

if __name__ == "__main__":
    init_db()
    
    # Check default port or environment port
    target_port = int(os.environ.get("PORT", 5000))
    free_port = find_available_port(target_port)
    
    if free_port != target_port:
        print(f"[PORT WARNING] Port {target_port} is busy. Switched to port {free_port}.")
    
    print("\n" + "=" * 55)
    print("  [*] Personal Expense Tracker Web App is Starting!")
    print(f"  [+] Local URL: http://127.0.0.1:{free_port}")
    print("  [+] SQLite Database initialized: database.db")
    print("=" * 55 + "\n")
    
    # Run with reloader disabled to prevent duplicate processes and changing ports
    app.run(host="127.0.0.1", port=free_port, debug=False, use_reloader=False)
