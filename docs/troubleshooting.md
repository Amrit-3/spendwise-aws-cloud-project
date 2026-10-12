# Troubleshooting log

Real problems hit while building SpendWise on AWS, what caused them, and how they were fixed.

## Networking and AWS setup

### Removed the NAT route from the wrong route tables
**Symptom:** The two route tables for the app subnets lost their `0.0.0.0/0 -> NAT` route.
**Cause:** The goal was to cut internet access for the DB subnets only. The edit was applied to the app route tables as well.
**Fix:** Added the route back to both app route tables. Only the two DB route tables should have no NAT route.
**Lesson:** Servers in private subnets need the NAT Gateway for package installs, Secrets Manager and Systems Manager. The database does not.

### Role name typed twice
**Symptom:** The IAM role was created as `spendwise-ec2-rolespendwise-ec2-role`.
**Cause:** A typo in the name field during role creation.
**Fix:** IAM roles cannot be renamed. The name works the same, so it was kept. Recreating the role is the only way to get a clean name.

### Review the whole form before creating
Settings such as the VPC, target type and load balancer scheme cannot be changed after creation. Checking each review page before clicking Create avoided deleting and rebuilding.

## Connecting to the servers (Session Manager)

### `source: not found`
**Symptom:** `source venv/bin/activate` failed with `sh: source: not found`.
**Cause:** The Session Manager shell is `sh`, which has no `source` command.
**Fix:** Use `. venv/bin/activate` (a dot), or run `bash` first.

### `git clone` failed with `Permission denied`
**Symptom:** `could not create work tree dir ... Permission denied`.
**Cause:** Session Manager starts in a directory the `ssm-user` account cannot write to.
**Fix:** `cd ~` first, then clone.

## Application and configuration

### Environment variable change was not on GitHub
**Symptom:** `grep DB_HOST app.py` on the server printed nothing.
**Cause:** The code change to read database settings from environment variables was only on the laptop.
**Fix:** Commit and push, then `git pull` on the server. Servers launched by Auto Scaling clone from GitHub, so GitHub must hold the version that works.

### Exported the placeholder instead of the real value
**Symptom:** `echo $DB_HOST` printed `YOUR-RDS-ENDPOINT`.
**Cause:** The command was copied with its placeholder text.
**Fix:** Export the real endpoint from the RDS console.

### Gunicorn "Control server error: Permission denied"
**Symptom:** The service ran, but the log ended with `Control server error: [Errno 13] Permission denied`.
**Cause:** Gunicorn 26 tries to create a control socket in the user's home directory. The `spendwise` system user has no home directory.
**Fix:** Added `--no-control-socket` to the Gunicorn command. The flag name was confirmed with `gunicorn --help` before use.

### Newer Ubuntu and Python than expected
**Observation:** The instances ran Ubuntu 26.04 and Python 3.14, not 24.04.
**Check:** `cat /etc/os-release` confirmed it. `psycopg2-binary`, Flask, Gunicorn and boto3 all installed without trouble. The version was verified by looking, not assumed.

## Code review catches

### Delete route used a variable before it was defined
**Symptom:** None yet. The bug was found in review.
**Cause:** The S3 cleanup block was pasted above the line that defines `existing`, so every delete would have failed.
**Why the checks missed it:** `python -m py_compile` only checks syntax. It cannot see that a variable is used before it exists.
**Fix:** Moved the block after the delete, and tested with `curl -X DELETE` against a real route.

### `boto3` missing on the laptop
**Symptom:** `ModuleNotFoundError: No module named 'boto3'` when running locally.
**Cause:** `boto3` was added to the code and `requirements.txt`, but not installed in the local virtual environment.
**Fix:** `pip install boto3`.

### Add Expense button did nothing
**Symptom:** Clicking Add Expense did nothing. Delete still worked. The server log showed no `POST`.
**Diagnosis:** The browser console showed `null is not an object (evaluating 'elements.editReceiptHint.textContent')`. The new JavaScript expected form fields that the page did not have.
**Cause:** `index.html` had never been updated, because the text copied from the preview was the rendered page, not the HTML source.
**Fix:** Added the receipt fields to `index.html` as code, then checked with `grep -c "editReceiptHint" templates/index.html`.
**Lesson:** A silent failure in the browser usually shows up as an error in the console, and a missing line in the server log tells you the request was never sent.

## Browser and testing quirks

- **Safari:** Cmd+Shift+R opens Reader view. Use Develop, then Empty Caches, then Cmd+R.
- **HTTP vs HTTPS:** Browsers upgrade `http://` to `https://` automatically. The load balancer only has an HTTP listener, so type the address with `http://`.
- **macOS port 5000:** AirPlay uses it, so the app falls back to 5001 locally.

## Monitoring

### `AlarmLow` is always "In alarm" on an idle app
This is normal. It means CPU is below the scale-in threshold. The group cannot shrink below its minimum of 2, so nothing happens.

### "No data available" on the Auto Scaling monitoring graphs
Group metrics collection is off by default. Enable it in the group's Advanced configurations before running a load test, because graphs only record from that point.
