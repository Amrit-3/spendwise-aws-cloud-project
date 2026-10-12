# Screenshot gallery

Console screenshots taken from the running deployment (`ap-south-1`, 11-12 October 2026). Account identifiers are redacted.

## Networking

![VPC resource map](screenshots/01-vpc-resource-map.jpg)
**VPC resource map.** Six subnets across two Availability Zones, six route tables, and the internet gateway, NAT gateway and S3 gateway endpoint.

![VPC details](screenshots/02-vpc-details.jpg)
**VPC details.** `10.0.0.0/16` with DNS resolution and DNS hostnames enabled.

![NAT gateway](screenshots/03-nat-gateway.jpg)
**NAT gateway.** One zonal NAT gateway in a public subnet gives the private app servers outbound access.

![DB route table, first DB subnet](screenshots/04-db-route-table-private1.jpg)
![DB route table, second DB subnet](screenshots/05-db-route-table-private2.jpg)
**Database route tables.** Only the local route and the S3 endpoint. There is no route to the NAT gateway or the internet.

## Security groups

![ALB security group](screenshots/06-sg-alb-inbound.jpg)
**`spendwise-alb-sg`.** HTTP (80) and HTTPS (443) from the internet.

![App security group](screenshots/07-sg-app-inbound.jpg)
**`spendwise-app-sg`.** Port 8000, allowed only from the load balancer's security group.

![RDS security group](screenshots/08-sg-rds-inbound.jpg)
**`spendwise-rds-sg`.** PostgreSQL (5432), allowed only from the app security group.

![RDS security group source](screenshots/09-rds-sg-source-is-app-sg.jpg)
**The source of the database rule is a security group ID** (the app group), not an IP range.

## Database

![RDS connectivity](screenshots/10-rds-connectivity-private.jpg)
**RDS connectivity.** In the project VPC, using the private DB subnet group, with Publicly accessible set to No.

![RDS available](screenshots/11-rds-available.jpg)
**RDS PostgreSQL** (`db.t3.micro`) in the Available state.

## Compute and load balancing

![Launch template](screenshots/12-launch-template-v2.jpg)
**Launch template, version 2** (default). Adds the receipt bucket setting to the server setup.

![Scaling policy](screenshots/13-scaling-policy-cpu60.jpg)
**Target tracking policy.** Keeps average CPU near 60%, with a 300-second warm-up.

![ALB listener](screenshots/14-alb-listener-http80.jpg)
**Application Load Balancer.** Internet-facing and Active, with an HTTP:80 listener forwarding to the target group.

![Healthy targets](screenshots/15-target-group-healthy.jpg)
**Target group.** Two healthy targets, one per Availability Zone.

## Demonstration: self-healing

![Instance terminated](screenshots/16-selfheal-instance-terminated.jpg)
**One instance terminated by hand.** The replacement is already initializing.

![Self-healing activity](screenshots/17-selfheal-activity.jpg)
**Auto Scaling activity.** The failed instance is taken out of service after an EC2 health check, and a replacement launches one second later.

## Demonstration: scale-out under load

![Alarms before load](screenshots/18-scaleout-before-alarms.jpg)
**Before the load test.** `AlarmHigh` is OK.

![Alarm in alarm state](screenshots/19-scaleout-alarm-in-alarm.jpg)
**During the load test.** `AlarmHigh` goes into the In alarm state.

![Alarm-triggered launches](screenshots/20-scaleout-activity-alarm-triggered.jpg)
**Activity history.** The alarm triggers the policy, and capacity grows from 2 to 3 and then from 3 to 4.

![Activity history](screenshots/21-scaleout-activity-history.jpg)
**Activity history, with the earlier self-healing entries below the scale-out.**

![Four instances](screenshots/22-scaleout-four-instances.jpg)
**Four instances running** across two Availability Zones.

![CPU spike](screenshots/23-scaleout-cpu-spike-4of4.jpg)
**CPU spike** with 4 of 4 instances healthy.

## Application and receipts

![Add expense form](screenshots/24-app-add-expense-receipt-field.jpg)
**Add Expense form** with the optional receipt field.

![App with receipt](screenshots/25-app-with-receipt-paperclip.jpg)
**The live app.** A paperclip button appears on the expense that has a receipt.

![S3 receipt object](screenshots/26-s3-receipt-object.jpg)
**The uploaded receipt** stored in S3.

![Block public access](screenshots/27-s3-block-public-access.jpg)
**S3 Block Public Access is On.** Receipts are served only through short-lived presigned links.

## IAM, secrets and monitoring

![IAM role](screenshots/28-iam-role-policies.jpg)
**EC2 instance role.** SSM, CloudWatch agent, a policy limited to the receipt bucket, and an inline policy to read one secret.

![Secrets Manager](screenshots/29-secrets-manager.jpg)
**Secrets Manager.** The database password is stored here. Servers fetch it at start-up, so it is never in the code or the launch template.

![CloudWatch alarms](screenshots/30-cloudwatch-alarms.jpg)
**CloudWatch alarms.** Two scaling alarms managed by Auto Scaling, and one unhealthy-targets alarm that emails through SNS.

![SNS subscription](screenshots/31-sns-subscription-confirmed.jpg)
**SNS subscription confirmed** for the alert email.
