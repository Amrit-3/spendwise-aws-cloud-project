# SpendWise — Personal Expense Tracker

A full-stack expense tracking web application built with Flask, PostgreSQL, HTML, CSS, and JavaScript. This project is also a hands-on learning journey into AWS cloud infrastructure and deployment.

> **Project status:** Mini project completed. Deployed and tested on an AWS EC2 instance. The application uses PostgreSQL on the same instance and is accessed through an SSH tunnel. The AWS deployment will be shut down after documentation is finalized.

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
| Application server | Gunicorn |
| Web server / reverse proxy | Nginx (configured for local access) |
| Frontend | HTML5, CSS3, JavaScript |
| Charts | Chart.js |
| Cloud platform | Amazon Web Services (AWS) |
| Compute | Amazon EC2 (Ubuntu Server 24.04 LTS) |
| Networking | Amazon VPC, public subnet, Internet Gateway, route table, security group |
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

### Prerequisites

- Python 3
- PostgreSQL 16
- Git

Verify the installations:

```bash
python3 --version
psql --version
git --version
```

### 1. Clone the repository

```bash
git clone https://github.com/Amrit-3/spendwise-aws-cloud-project.git
cd spendwise-aws-cloud-project
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

The required Python dependencies, including Flask, `psycopg2-binary`, and Gunicorn, are listed in `requirements.txt` and installed with `pip install -r requirements.txt`.

### 4. Start PostgreSQL

If PostgreSQL 16 was installed using Homebrew:

```bash
brew services start postgresql@16
```

### 5. Create the database and PostgreSQL user

The application connects to a database named `expense_tracker` as the PostgreSQL user `amrit`.

Create the database and user using your local PostgreSQL administrator account. Configure authentication so the application can connect locally as `amrit`. Do not put database passwords in the source code or commit them to GitHub.

The application creates the `expenses` table automatically when it connects to the database.

### 6. Run the application

```bash
python3 app.py
```

Open the local URL printed in the terminal, usually `http://127.0.0.1:5000`.

**Note:** A fresh local database starts empty. The six expense records used during the AWS deployment are not automatically included in a new database.
## Database

The application uses PostgreSQL with a database named `expense_tracker`. The Flask application connects using the `psycopg2-binary` driver, and the `expenses` table is created automatically when a database connection is established.

For this mini project, PostgreSQL runs on the same EC2 instance as the application and listens only on the local interface. Database credentials should be managed securely and never committed to source control.

The original SQLite database file (`database.db`) is separate from the PostgreSQL database used in the AWS deployment.

## Testing

The application was manually tested during deployment, including expense creation, updates, deletion, database migration, and backup creation. The existing automated test suite needs updating to match the PostgreSQL implementation and has not yet been fully validated against an isolated test database.

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

## AWS Architecture

The application was deployed on a single Amazon EC2 instance running Ubuntu Server 24.04 LTS in the AWS Mumbai region (`ap-south-1`).

```text
MacBook browser
      |
      v
SSH tunnel (encrypted connection, port 22)
      |
      v
AWS VPC (10.0.0.0/16)
  |
  +-- Public subnet (10.0.1.0/24)
        |
        +-- EC2 instance (Ubuntu Server)
              |
              +-- Gunicorn (127.0.0.1:8000)
              |     |
              |     +-- Flask application
              |
              +-- PostgreSQL (127.0.0.1:5432)
```

### AWS services and resources used

- **Amazon EC2:** Hosts the Flask application and PostgreSQL database.
- **Amazon VPC:** Provides the virtual network.
- **Public subnet:** Contains the EC2 instance.
- **Internet Gateway:** Provides a route between the VPC and the internet.
- **Route table:** Routes internet-bound traffic through the Internet Gateway.
- **Security group:** Restricts inbound SSH access to the configured public IP address.

### Deployment and security decisions

- Gunicorn serves the Flask application on the local interface at `127.0.0.1:8000`.
- PostgreSQL listens on the local interface at `127.0.0.1:5432`.
- The application is accessed through an SSH tunnel.
- Nginx was configured and tested for local access, but the active SSH tunnel connects directly to Gunicorn.
- No public HTTP/HTTPS application endpoint or domain was configured.

### Services not implemented

Amazon RDS, Amazon S3, IAM instance roles, CloudWatch monitoring, Elastic Load Balancing, and Auto Scaling were not implemented in this mini project. They are candidates for a separate, more advanced cloud project.
## Learning and Development Log

Development progress is documented in [`docs/progress.md`](docs/progress.md).

ChatGPT was used as a learning and debugging assistant during the local PostgreSQL setup and database migration.

## Security Notes

- Never commit passwords, AWS access keys, private keys, or database credentials.
- Use environment variables or an appropriate secrets-management solution for credentials.
- Restrict database access to trusted application resources.
- Review AWS resource usage and charges regularly.

## Lessons Learned

- Deployed a Flask application on an Amazon EC2 instance running Ubuntu Linux.
- Configured a VPC, public subnet, Internet Gateway, route table, and security group.
- Connected a Flask application to PostgreSQL running on the same EC2 instance.
- Used Gunicorn and systemd to run the application as a service.
- Used an SSH tunnel to access the application without opening public web ports.
- Practiced database migration, CRUD testing, and PostgreSQL backups.

## License

The original project README states that this project is released under the MIT License. Ensure a corresponding `LICENSE` file exists in the repository before distributing it under that license.
