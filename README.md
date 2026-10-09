# SpendWise — Personal Expense Tracker

A full-stack expense tracking web application built with Flask, PostgreSQL, HTML, CSS, and JavaScript. This project is also a hands-on learning journey into AWS cloud infrastructure and deployment.

> **Project status:** Runs locally with PostgreSQL. AWS infrastructure setup is in progress.

## Features

- **Expense management:** Create, view, update, and delete expenses.
- **Spending analytics:** Category breakdowns, monthly trends, and summary statistics.
- **Search and filtering:** Search expenses, filter by category, and sort transactions.
- **Responsive interface:** Dark and light themes, modals, and notifications.
- **Data export:** Export expenses to CSV.
- **REST API:** Flask endpoints for expense management and statistics.

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, Flask |
| Database | PostgreSQL 16 |
| Database driver | psycopg2-binary |
| Frontend | HTML5, CSS3, JavaScript |
| Charts | Chart.js |
| Cloud platform | Amazon Web Services (AWS) — in progress |
| Version control | Git and GitHub |

## Project Structure

```text
personal-expense-tracker/
├── app.py
├── requirements.txt
├── README.md
├── test_backend.py
├── verify_live_app.py
├── docs/
│   └── progress.md
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Run Locally on macOS

### 1. Prerequisites

Install Python 3 and PostgreSQL 16.

Verify the installations:

```bash
python3 --version
psql --version
```

### 2. Clone the repository

```bash
git clone https://github.com/Mantrapandya/personal-expense-tracker.git
cd personal-expense-tracker
```

### 3. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
pip install psycopg2-binary
```

### 5. Start PostgreSQL

If PostgreSQL 16 was installed using Homebrew:

```bash
brew services start postgresql@16
```

### 6. Create the database

```bash
createdb expense_tracker
```

If the database already exists, do not create it again.

### 7. Run the application

```bash
python3 app.py
```

Open the local URL printed in your terminal. It may be `http://127.0.0.1:5000` or another port if port 5000 is already occupied.

## Database

The application currently uses a local PostgreSQL database named `expense_tracker`.

The application database connection is configured in `app.py`. Before deploying to AWS, database connection details should be moved into environment variables rather than hard-coded in source code.

## REST API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/categories` | List expense categories |
| GET | `/api/expenses` | List and filter expenses |
| POST | `/api/expenses` | Create an expense |
| GET | `/api/expenses/<id>` | Retrieve an expense |
| PUT/PATCH | `/api/expenses/<id>` | Update an expense |
| DELETE | `/api/expenses/<id>` | Delete an expense |
| GET | `/api/expenses/stats` | Retrieve spending statistics |

## AWS Learning Roadmap

The planned cloud architecture is:

```text
Internet
   |
Application Load Balancer
   |
EC2 instances in private subnets
   |
Amazon RDS for PostgreSQL

EC2 --------> Amazon S3
Services ----> Amazon CloudWatch
```

Planned AWS components:

- Amazon VPC, public and private subnets, and route tables
- Internet Gateway and security groups
- Amazon EC2
- Amazon RDS for PostgreSQL
- Application Load Balancer
- Auto Scaling
- IAM roles and Amazon S3
- Amazon CloudWatch

**Note:** This is the target architecture. Not all components have been deployed or connected yet.

## Learning and Development Log

Development progress is documented in [`docs/progress.md`](docs/progress.md).

ChatGPT was used as a learning and debugging assistant during the local PostgreSQL setup and database migration.

## Security Notes

- Never commit passwords, AWS access keys, private keys, or database credentials.
- Use environment variables or an appropriate secrets-management solution for credentials.
- Restrict database access to trusted application resources.
- Review AWS resource usage and charges regularly.

## Future Improvements

- Configure Amazon RDS PostgreSQL.
- Connect the Flask application to RDS securely.
- Deploy the application on EC2 behind an Application Load Balancer.
- Configure Auto Scaling and CloudWatch monitoring.
- Integrate S3 using an IAM role.
- Add deployment documentation and architecture diagrams.

## License

The original project README states that this project is released under the MIT License. Ensure a corresponding `LICENSE` file exists in the repository before distributing it under that license.
