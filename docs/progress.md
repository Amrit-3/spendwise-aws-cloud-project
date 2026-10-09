# Project Progress Log — Personal Expense Tracker

## Day 1 — October 8, 2026

### Goal
Build a Personal Expense Tracker and learn how to deploy it using AWS cloud services.

### Work Completed

#### 1. AWS Network Foundation
- Created `ExpenseTracker-VPC` with CIDR `10.0.0.0/16`.
- Created two public subnets and two private subnets.
- Created and associated public and private route tables.
- Created and attached `ExpenseTracker-IGW`.
- Configured security groups for the Application Load Balancer, EC2, and RDS.
- Launched `ExpenseTracker-EC2-1` in a private subnet.

#### 2. Local Application Setup
- Cloned the project repository from GitHub.
- Set up a Python virtual environment.
- Installed the application's dependencies.
- Ran the Flask application locally.

#### 3. PostgreSQL Migration
- Installed PostgreSQL locally.
- Created the `expense_tracker` database.
- Installed the `psycopg2-binary` Python driver.
- Migrated the application's database connection from SQLite to PostgreSQL.
- Fixed SQL compatibility issues and debugging errors.
- Tested expense creation, expense retrieval, categories, and statistics.

### Final Result
The Flask application successfully saves and retrieves expenses using local PostgreSQL. The relevant API requests returned successful HTTP status codes, including `201 Created` when adding an expense.

### AI Assistance
ChatGPT was used as a learning and debugging assistant during the local PostgreSQL setup and SQLite-to-PostgreSQL migration. I executed the commands, applied the changes, tested the application, and used the resulting errors to troubleshoot the integration.

### Next Steps
- Improve GitHub documentation.
- Prepare the application for AWS RDS PostgreSQL.
- Connect the application to RDS.
- Continue building and testing the AWS architecture.
- Document each step and its purpose.

### AWS Cost-Safety Notes
Stop EC2 instances when they are not needed. Check for any resources that may incur charges before ending a session. Preserve the project infrastructure unless a resource is intentionally being removed.