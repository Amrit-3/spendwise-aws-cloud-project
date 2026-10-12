#!/bin/bash
# /opt/spendwise/start.sh  (reference copy; user-data.sh writes this file on each server)
# Fetches the database password from AWS Secrets Manager using the instance's IAM role,
# so no password is stored on disk, in git, or in the launch template.
# Replace <RDS-ENDPOINT> and <ACCOUNT-ID> with your own values.
export DB_HOST=<RDS-ENDPOINT>
export DB_SSLMODE=require
export S3_BUCKET=spendwise-receipts-<ACCOUNT-ID>
export AWS_REGION=ap-south-1
export DB_PASSWORD=$(/opt/spendwise/venv/bin/python -c "import boto3,json; print(json.loads(boto3.client('secretsmanager',region_name='ap-south-1').get_secret_value(SecretId='spendwise/db-password')['SecretString'])['password'])")
exec /opt/spendwise/venv/bin/gunicorn --bind 0.0.0.0:8000 --workers 2 --no-control-socket app:app
