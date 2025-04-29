# Strengthen Authentication with Password Hashing and Account Lockout

## Goal
- Secure passwords by hashing before storing.
- Enforce password strength policies.
- Implement basic account lockout after multiple failed login attempts.

(No tokens, cookies, or refresh logic yet.)

---

# Backend Instructions

## Task 1: Import Required Libraries

At the top of your `backend/app.py` file, add:

```python
from flask_bcrypt import Bcrypt
from datetime import timedelta, datetime
import re
```

**Why:**
- `bcrypt` will be used to hash and verify passwords securely.
- `datetime` will help with account lockout timing.
- `re` is for password strength checking using regular expressions.

Below your `db = SQLAlchemy(app)` line, **add**:

```python
bcrypt = Bcrypt(app)
```

**Why:**
- This initializes the bcrypt extension.

---

## Task 2: Update User Model

Extend your `User` model to track failed login attempts and last failed attempt time.

Find your current `User` class and **replace it** with:

```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    failed_attempts = db.Column(db.Integer, default=0)
    last_failed_time = db.Column(db.DateTime, default=None)
```

**Why:**
- `failed_attempts` counts how many wrong login tries.
- `last_failed_time` stores when last wrong attempt happened (for lockout).

You may need to recreate your database to apply these changes.

---

## Task 3: Add Password Strength Checker Function

Below your User model, **add** the following function:

```python
def is_password_strong(password):
    errors = []
    if len(password) < 8:
        errors.append("at least 8 characters")
    if not re.search(r'[A-Z]', password):
        errors.append("one uppercase letter")
    if not re.search(r'[a-z]', password):
        errors.append("one lowercase letter")
    if not re.search(r'\d', password):
        errors.append("one digit")
    if not re.search(r'\W', password):
        errors.append("one special character")
    return errors
```

**Why:**
- This enforces strong passwords during user registration.

---

## Task 4: Update `/register` Route

Find your current `/register` route and **replace it** with:

```python
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    password_errors = is_password_strong(password)
    if password_errors:
        return jsonify({
            "message": "Password is too weak.",
            "requirements": password_errors
        }), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201
```

**Why:**
- Checks password strength before registering.
- Saves hashed password instead of plaintext.

---

## Task 5: Update `/login` Route

Find your current `/login` route and **replace it** with:

```python
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()

    LOCKOUT_THRESHOLD = 5
    LOCKOUT_TIME = timedelta(minutes=1)

    if user:
        if user.failed_attempts >= LOCKOUT_THRESHOLD:
            if datetime.utcnow() - user.last_failed_time < LOCKOUT_TIME:
                return jsonify({"message": "Account temporarily locked. Try again later."}), 403
            else:
                user.failed_attempts = 0
                db.session.commit()

        if bcrypt.check_password_hash(user.password, password):
            user.failed_attempts = 0
            db.session.commit()
            return jsonify({"message": "Login successful!"})
        else:
            user.failed_attempts += 1
            user.last_failed_time = datetime.utcnow()
            db.session.commit()
            return jsonify({"message": "Invalid username or password"}), 401

    return jsonify({"message": "Invalid username or password"}), 401
```

**Why:**
- Verifies passwords using bcrypt.
- Adds account lockout after too many failed login attempts.
- Resets failed attempts after successful login.

---
# Step 2: Frontend Updates for New Authentication (Password Rules + Lockout)

## Goal
- Show password strength errors on signup.
- Show lockout errors on login.
- Improve error messaging without changing the overall structure.

---

# Frontend Instructions

## Task 1: Track Loading State

In your `data()` section, **add** a `loading` field if it does not already exist:

```javascript
loading: false,
```

**Why:**
- To disable the submit button while waiting for backend responses.

---

## Task 2: Improve Signup Error Handling

In your existing `signup()` method, inside the `catch (error)` block:

**Replace** your catch block with:

```javascript
catch (error) {
  if (error.response) {
    if (error.response.data.requirements) {
      this.error = "Weak password: " + error.response.data.requirements.join(", ");
    } else if (error.response.data.message) {
      this.error = error.response.data.message;
    } else {
      this.error = "An unexpected error occurred.";
    }
  } else {
    this.error = "Cannot reach server.";
  }
}
```

**Why:**
- Displays detailed password strength issues during signup failures.

---

## Task 3: Improve Login Error Handling

In your existing `login()` method, inside the `catch (error)` block:

**Replace** your catch block with:

```javascript
catch (error) {
  if (error.response) {
    if (error.response.status === 403) {
      this.error = "Account temporarily locked. Please try again later.";
    } else if (error.response.status === 401) {
      this.error = "Invalid username or password.";
    } else if (error.response.data.message) {
      this.error = error.response.data.message;
    } else {
      this.error = "An unexpected error occurred.";
    }
  } else {
    this.error = "Cannot reach server.";
  }
}
```

**Why:**
- Shows a special message when a user's account is locked due to too many failed login attempts.

---

## Task 4: Ensure Proper UI Feedback

Make sure your template already has:

```html
<p v-if="error" class="text-danger text-center mt-3">{{ error }}</p>
<p v-if="loading" class="text-center text-primary">Processing...</p>
```

These elements automatically show errors and loading indicators based on your updated `error` and `loading` variables.

---