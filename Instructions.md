# Step 1: Connecting Signup and Login Backend

## Goal
- Add basic database functionality.
- Implement `/register` and `/login` API routes.

---

# Backend Instructions


## Task 1: Define User Model

Below your database initialization, add:

```python
# Define User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
```

This model represents the users table in the database with fields for id, username, and password.

---

## Task 2: Create Database Tables

Below your User model, add:

```python
# Create the database tables
with app.app_context():
    db.create_all()
```

This ensures the database tables are created when the app starts.

## Task 4: Create /register route

Below your `CORS(app)` line add:

```python
# Route to register a new user
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    
    # Check if username and password are provided
    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400

    # Check if user already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists"}), 409

    # Create new user and save to database
    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201
```

This endpoint accepts a username and password, checks if the user already exists, and saves the user to the database if they are new.

---

# Step 1: Connecting Frontend Signup and Login to Backend

## Goal
- Implement real signup (`/register`) and login (`/login`) functionality.
- Connect the Vue frontend to Flask backend via Axios.
- Show success or error messages based on backend response.

---

# Frontend Instructions

## Task 1: Add Axios Import

Open `frontend/src/pages/LoginPage.vue`.

At the top of the `<script>` block, add:

```javascript
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
```

Axios will let us easily send HTTP requests.
BACKEND_URL points to your Flask backend server (from `.env` file).

---

## Task 2: Update login() Method

Replace the current dummy `login()` method with the following:

```javascript
async login() {
  if (!this.username || !this.password) {
    this.error = "Both username and password are required.";
    return;
  }
  this.loading = true;
  try {
    await axios.post(`${BACKEND_URL}/login`, {
      username: this.username,
      password: this.password,
    });
    this.$router.push("/success");
  } catch (error) {
    this.error = "Invalid username or password.";
  } finally {
    this.loading = false;
  }
}
```

This sends a POST request to the `/login` backend route.
On success, redirects to `/success` page.
On failure, displays an error message.

---

## Task 3: Update signup() Method

Replace the current dummy `signup()` method with the following:

```javascript
async signup() {
  if (!this.username || !this.password) {
    this.error = "Both username and password are required.";
    return;
  }
  this.loading = true;
  try {
    const response = await axios.post(`${BACKEND_URL}/register`, {
      username: this.username,
      password: this.password,
    });

    if (response.status === 201) {
      this.isSignup = false; // Switch back to login form
      this.error = "";
    }
  } catch (error) {
    if (error.response) {
      this.error = error.response.data.message || "Registration failed.";
    } else {
      this.error = "Cannot reach server.";
    }
  } finally {
    this.loading = false;
  }
}
```

This sends a POST request to the `/register` backend route.
On success, switches back to login mode.
On failure, displays an appropriate error message.

---

## Task 4: Show Loading Spinner (Optional)

There is already a:

```html
<p v-if="loading" class="text-center text-primary">Processing...</p>
```

in your template.

When `loading` is `true`, a loading message will appear automatically.

---

This completes Step 1: Backend and Frontend Connection for Signup and Login!
