# SpendWise — Personal Expense Tracker

A modern, fast, full-stack Personal Expense Tracker web application built with **Python Flask**, **SQLite**, and **Vanilla HTML5, CSS3, and JavaScript**.

---

## 🌟 Key Features

- **Full CRUD Management**: Add, view, edit, and delete expense transactions with instant UI feedback.
- **Analytics & Visualizations**:
  - Interactive **Spending by Category** Doughnut Chart (powered by Chart.js).
  - Dynamic **Monthly Spending Trend** Bar Chart.
  - Real-time KPI summary metric cards (Total Spending, Transaction Count, Highest Expense, Average Expense).
- **Search & Multi-Filter Engine**:
  - Live debounce search by title or notes memo.
  - Category filter dropdown.
  - Multi-column sorting (Newest, Oldest, Highest Amount, Lowest Amount, Title A-Z).
- **Modern Glassmorphic UI/UX**:
  - Dark Mode (default) & Light Mode with instant toggle and local storage persistence.
  - Accessible modal dialogs for Adding, Editing, and Safe Delete confirmation.
  - Toast notifications system with auto-dismiss progress bars.
  - Loading skeleton states and clean empty-state fallback illustrations.
- **Data Export**: One-click **Export to CSV** for spreadsheets and accounting backups.
- **Zero-Config Database**:
  - Automatically provisions SQLite database and tables on first startup.
  - Auto-seeds 5 realistic sample expenses if database is empty.
  - Preserves all your data across server restarts without overwriting.
- **Lightweight & Self-Contained**:
  - No Node.js, npm, Docker, or external database server required.
  - Runs natively on Windows CMD using standard Python and Flask.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.8+ & Flask REST API
- **Database**: SQLite 3 (Standard Library)
- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism Design System), Vanilla JavaScript (ES6+)
- **Icons & Visuals**: Lucide Icons & Chart.js (via CDN)

---

## 📂 Project Structure

```text
expense_tracker/
├── app.py                  # Flask backend server, REST API routes, SQLite manager
├── requirements.txt        # Python dependency manifest (Flask)
├── README.md               # Project documentation and user guide
├── database.db             # SQLite database file (created automatically on startup)
├── templates/
│   └── index.html          # Semantic HTML5 dashboard template and modals
└── static/
    ├── style.css           # Glassmorphism, themes (dark/light), responsive CSS
    └── script.js           # Vanilla JS controller, Chart.js integrations, API fetchers
```

---

## 🚀 Quick Start (Windows CMD)

### 1. Prerequisites
Make sure you have **Python 3.8+** installed and added to your `PATH`. You can verify by opening CMD and typing:
```cmd
python --version
```

### 2. Navigate to Project Directory
From `C:\Users\mantr`:
```cmd
cd ant1\expense_tracker
```
Or use the full absolute path:
```cmd
cd C:\Users\mantr\ant1\expense_tracker
```

### 3. Install Dependencies
```cmd
pip install -r requirements.txt
```

### 4. Run the Application
```cmd
python app.py
```

### 5. Open in Your Web Browser
Open your browser and navigate to:
```text
http://127.0.0.1:5000
```

---

## 📡 REST API Documentation

### Base URL
`http://127.0.0.1:5000/api`

### Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check and timestamp |
| `GET` | `/api/categories` | Get list of supported expense categories |
| `GET` | `/api/expenses` | Get all expenses (supports search, category, sort filters) |
| `POST` | `/api/expenses` | Create a new expense |
| `GET` | `/api/expenses/<id>` | Retrieve a single expense by ID |
| `PUT` / `PATCH` | `/api/expenses/<id>` | Update an existing expense |
| `DELETE` | `/api/expenses/<id>` | Delete an expense by ID |
| `GET` | `/api/expenses/stats` | Aggregated metrics, category breakdown & monthly trends |

---

### Example API Requests

#### 1. Get All Expenses (with optional filters)
```bash
curl -X GET "http://127.0.0.1:5000/api/expenses?category=Food%20%26%20Dining&sort_by=amount&order=desc"
```

#### 2. Create a New Expense
```bash
curl -X POST "http://127.0.0.1:5000/api/expenses" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Starbucks Caramel Macchiato",
       "amount": 6.75,
       "category": "Food & Dining",
       "date": "2026-09-18",
       "notes": "Afternoon coffee break"
     }'
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Expense created successfully.",
  "expense": {
    "id": 6,
    "title": "Starbucks Caramel Macchiato",
    "amount": 6.75,
    "category": "Food & Dining",
    "date": "2026-09-18",
    "notes": "Afternoon coffee break",
    "created_at": "2026-09-18 10:30:00"
  }
}
```

#### 3. Update an Expense
```bash
curl -X PUT "http://127.0.0.1:5000/api/expenses/6" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Starbucks Coffee & Pastry",
       "amount": 11.50,
       "category": "Food & Dining",
       "date": "2026-09-18",
       "notes": "Breakfast combo"
     }'
```

#### 4. Delete an Expense
```bash
curl -X DELETE "http://127.0.0.1:5000/api/expenses/6"
```

#### 5. Get Aggregate Statistics
```bash
curl -X GET "http://127.0.0.1:5000/api/expenses/stats"
```

---

## ⚙️ Configuration & Port Customization

### Changing the Port
By default, the server runs on port `5000`. You can change the port in two ways:

1. **Via Windows CMD Environment Variable:**
   ```cmd
   set PORT=8080
   python app.py
   ```
2. **Automatic Port Fallback:**
   If port `5000` is already occupied by another application, `app.py` automatically detects this and binds to the next available port (e.g. `5001`, `5002`) with a clear notice in the terminal.

---

## 🔧 Troubleshooting

### 1. `pip` or `python` is not recognized
- Ensure Python is installed from [python.org](https://www.python.org).
- Check the box **"Add Python to PATH"** during installation.
- Restart CMD.

### 2. Port Conflict
If port `5000` is in use, the application will automatically select an available port. Alternatively, specify a custom port:
```cmd
set PORT=5050
python app.py
```

### 3. Reset Database to Fresh State
To start with a clean database and reset sample data:
1. Stop the application (`Ctrl + C`).
2. Delete the `database.db` file:
   ```cmd
   del database.db
   ```
3. Run `python app.py` again. The database and 5 realistic sample expenses will be automatically recreated.

---

## 📜 License
Open-source under the MIT License.
