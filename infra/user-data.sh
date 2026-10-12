#!/bin/bash
# Launch template user data for SpendWise (runs once, as root, when an instance first boots).
# Replace the two <placeholders> before using it:
#   <RDS-ENDPOINT>  the RDS instance endpoint
#   <ACCOUNT-ID>    your AWS account ID (used in the S3 bucket name)
exec > /var/log/user-data.log 2>&1
set -ex

apt-get update
apt-get install -y git python3-venv python3-pip

git clone https://github.com/Amrit-3/spendwise-aws-cloud-project.git /opt/spendwise
python3 -m venv /opt/spendwise/venv
/opt/spendwise/venv/bin/pip install -r /opt/spendwise/requirements.txt

useradd --system --no-create-home --shell /usr/sbin/nologin spendwise

cat > /opt/spendwise/start.sh << 'EOF'
#!/bin/bash
export DB_HOST=<RDS-ENDPOINT>
export DB_SSLMODE=require
export S3_BUCKET=spendwise-receipts-<ACCOUNT-ID>
export AWS_REGION=ap-south-1
export DB_PASSWORD=$(/opt/spendwise/venv/bin/python -c "import boto3,json; print(json.loads(boto3.client('secretsmanager',region_name='ap-south-1').get_secret_value(SecretId='spendwise/db-password')['SecretString'])['password'])")
exec /opt/spendwise/venv/bin/gunicorn --bind 0.0.0.0:8000 --workers 2 --no-control-socket app:app
EOF
chmod +x /opt/spendwise/start.sh

cat > /etc/systemd/system/spendwise.service << 'EOF'
[Unit]
Description=SpendWise Flask app (Gunicorn)
After=network-online.target
Wants=network-online.target

[Service]
User=spendwise
Group=spendwise
WorkingDirectory=/opt/spendwise
ExecStart=/opt/spendwise/start.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now spendwise
