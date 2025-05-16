# Step 6: Securing Secrets with Environment Variables

In this final step, you'll move all sensitive configuration values (like secret keys and database connection strings) out of your `app.py` and into a dedicated `.env` file. This aligns with security best practices and makes your app easier to deploy securely.

---

## Goal
- Remove hardcoded secrets from `app.py`
- Load secret values from a `.env` file using `python-dotenv`
- Prevent secrets from being exposed in version control

---

## Step 1: Install python-dotenv

First, install the required Python library:

```bash
pip install python-dotenv
```

> If you're using `requirements.txt`, add:
>
> ```
> python-dotenv
> ```

---

## Step 2: Create a `.env` File

At the root of your project, create a file named `.env` with the following content:

```env
SECRET_KEY=change_this_to_a_secure_random_key
JWT_SECRET_KEY=change_this_to_another_secure_key
DATABASE_URL=sqlite:///auth.db
```

> You can generate strong random values using:
> ```python
> import secrets
> secrets.token_hex(32)
> ```

---

## Step 3: Add `.env` to `.gitignore`

To ensure your secrets aren’t committed to version control:

```bash
echo ".env" >> .gitignore
```

---

## Step 4: Load the `.env` File in `app.py`

Update the top of your `app.py` file:

```python
import os
from dotenv import load_dotenv

load_dotenv()
```

Then replace your hardcoded config values with environment lookups:

```python
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
```

---


## Summary

You’ve now externalized your application secrets, making your project safer and more portable. Secrets are no longer hardcoded, and the app is ready to adapt to different environments securely.
