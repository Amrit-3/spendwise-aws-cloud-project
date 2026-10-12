# Teardown guide

Delete everything in this order. AWS refuses to delete a resource that something else still uses, so the order follows the dependencies. Work in the **Mumbai (`ap-south-1`)** region.

Do this only after your screenshots and docs are saved and pushed to GitHub.

The resources that bill by the hour are the **NAT Gateway, the load balancer, RDS and the EC2 instances**, plus the **Elastic IP** once the NAT is gone. Delete those first.

## 1. Auto Scaling group (removes the servers)
**EC2 > Auto Scaling groups > `spendwise-asg` > Delete.**
This terminates the instances and also removes the two scaling alarms it created. Wait until the instances are terminated.

## 2. Load balancer, then target group
1. **EC2 > Load Balancers > `spendwise-alb` > Actions > Delete.**
2. **EC2 > Target Groups > `spendwise-tg` > Actions > Delete** (after the load balancer is gone).

## 3. Launch template
**EC2 > Launch Templates > `spendwise-lt` > Actions > Delete template.**

## 4. RDS database
1. **RDS > Databases > `spendwise-db` > Actions > Delete.**
2. Untick "Create final snapshot" unless you want to keep a copy. Tick the acknowledgement box.
3. Untick "Retain automated backups".
4. Wait until the database is gone, then delete the subnet group: **RDS > Subnet groups > `spendwise-db-subnet-group` > Delete.**

If you create a final snapshot, it keeps billing for storage until you delete it too (**RDS > Snapshots**).

## 5. NAT Gateway, then the Elastic IP
1. **VPC > NAT gateways** > select it > **Actions > Delete NAT gateway.** Wait until the state says **Deleted**.
2. **VPC > Elastic IPs** > select the one that was attached > **Actions > Release Elastic IP addresses.**

A released-late Elastic IP keeps billing, so do not skip this.

## 6. Security groups (in this order)
**VPC > Security groups.** Each group refers to the one before it, so delete them in this order:
1. `spendwise-rds-sg`
2. `spendwise-app-sg`
3. `spendwise-alb-sg`

Do not delete the VPC's `default` group. It is removed with the VPC.

## 7. The VPC
**VPC > Your VPCs > `spendwise-vpc-vpc` > Actions > Delete VPC.**
This removes the subnets, route tables, internet gateway and S3 endpoint with it. If it complains about a dependency, read which resource it names. It is usually a network interface still attached, so wait a few minutes after steps 1 to 5 and try again.

## 8. S3 bucket
1. **S3 > `spendwise-receipts-<account-id>` > Empty.**
2. Then **Delete** the bucket.

## 9. Secrets Manager
**Secrets Manager > `spendwise/db-password` > Actions > Delete secret.**
The console requires a waiting period of at least 7 days before the secret is gone. Check **Billing** later to confirm it is not charged during that window.

## 10. IAM
1. **IAM > Roles > `spendwise-ec2-role...` > Delete.**
2. **IAM > Policies** > delete `spendwise-s3-receipts-policy`. (The inline secret policy goes with the role.)

## 11. Monitoring leftovers
1. **CloudWatch > Alarms** > delete `spendwise-unhealthy-targets`.
2. **SNS > Topics** > delete `spendwise-alerts`. The subscription is removed with it.

## 12. Check for strays
- **EC2 > Load Balancers:** also look for any older load balancer from a previous attempt (for example `mysrver-LB`). Delete it, with its target group and any instances behind it, if you do not need it.
- **EC2 > Instances, Volumes and Elastic IPs:** nothing should be left running or unattached.
- **RDS > Snapshots:** nothing you did not mean to keep.

## 13. Confirm billing stopped
- **Billing > Bills** shows the current month by service. Check again the next day, because charges appear with a delay.
- A budget alert is a good habit for any future project: **Billing > Budgets**.
