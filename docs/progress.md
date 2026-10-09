# Project Progress Log — SpendWise

## Project Goal

Build a Personal Expense Tracker using Flask and PostgreSQL, deploy it on AWS, and gain hands-on experience with cloud infrastructure and Linux server administration.

## Work Completed

### 1. Local Application Setup

- Set up a Python virtual environment.
- Installed the application's Python dependencies.
- Ran the Flask application locally.
- Tested expense management features and API endpoints.

### 2. PostgreSQL Database Migration

- Migrated the application's database connection from SQLite to PostgreSQL.
- Installed and configured the PostgreSQL Python driver.
- Created the `expense_tracker` database.
- Tested expense creation, retrieval, updates, deletion, and statistics.
- Created a PostgreSQL backup of the AWS database.

### 3. AWS Infrastructure

- Deployed the application on an Amazon EC2 instance running Ubuntu Server 24.04 LTS.
- Used the AWS Mumbai region (`ap-south-1`).
- Configured a VPC, public subnet, Internet Gateway, route table, and security group.
- Restricted inbound SSH access to the configured public IP address.

### 4. Application Deployment

- Configured Gunicorn to run the Flask application as a systemd service.
- Configured PostgreSQL to listen on the local interface.
- Used an SSH tunnel to access the application securely from the Mac.
- Configured and tested Nginx for local access. The active SSH tunnel connects directly to Gunicorn.

## Current Architecture

- **Compute:** Amazon EC2
- **Operating system:** Ubuntu Server 24.04 LTS
- **Backend:** Python and Flask
- **Application server:** Gunicorn
- **Database:** PostgreSQL on the same EC2 instance
- **Access method:** SSH tunnel

Amazon RDS, Amazon S3, an Application Load Balancer, Auto Scaling, and CloudWatch monitoring were not implemented in this project.

## Testing Status

The application was manually tested during deployment, including expense operations and database migration. A PostgreSQL backup was created and its contents were inspected.

The existing automated test suite needs updating to use an isolated PostgreSQL test database. It has not yet been fully validated against that setup.

## Security and Cost Considerations

- Keep SSH access restricted to trusted IP addresses.
- Keep database access limited to the local interface.
- Never commit private keys, passwords, or database backups to GitHub.
- Review AWS resources and potential charges before ending the deployment.
- Preserve and verify the database backup before removing any resources.

## Lessons Learned

- Deploying a Flask application on an Ubuntu EC2 instance.
- Configuring basic AWS networking and security groups.
- Connecting Flask to PostgreSQL.
- Running an application with Gunicorn and systemd.
- Accessing a server through an SSH tunnel.
- Troubleshooting database integration and creating PostgreSQL backups.

## Next Steps

- Verify the backup can be restored safely.
- Update automated tests to use an isolated PostgreSQL test database.
- Review the AWS deployment and document any remaining limitations.
- Shut down unneeded AWS resources only after backup and cost checks.
- Explore RDS, S3, IAM roles, and CloudWatch in a future project.

## AI Assistance

ChatGPT was used as a learning and debugging assistant. Commands and configuration changes were applied and tested during the project, with errors used to guide troubleshooting and improve understanding.