# Session Management Using JWT Tokens in Local Storage

## Goal
- After login, issue JWT access and refresh tokens.
- Store access and refresh tokens in **localStorage** (not cookies yet).
- Use access token in Authorization headers for protected requests.
- Auto-refresh tokens when expired.

---

# Backend Instructions

## Task 1: Import JWT Library

At the top of `app.py`, **add**:

```python
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
```

---

## Task 3: Initialize JWT Manager

Below your app and db initialization, **add**:

```python
app.config["JWT_SECRET_KEY"] = "your_jwt_secret_key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=60)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(seconds=600)
app.config["JWT_TOKEN_LOCATION"] = ["headers"]

jwt = JWTManager(app)
```


## Task 4: Update `/login` Route

Inside your existing `/login` route, **modify** the successful login part:

**Replace** this:

```python
return jsonify({"message": "Login successful!"})
```

**With this:**

```python
additional_claims = {"username": user.username}
access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)

return jsonify({
    "message": "Login successful",
    "access_token": access_token,
    "refresh_token": refresh_token,
})
```

**Why:**
- Backend now issues both access and refresh tokens after successful login.

---

## Task 5: Create `/refresh` Route

**Add a new route** in `app.py`:

```python
@app.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    claims = get_jwt()
    additional_claims = {"username": claims["username"]}
    new_access_token = create_access_token(identity=str(current_user),additional_claims=additional_claims)

    return jsonify(access_token=new_access_token)
```

**Why:**
- Frontend will call this endpoint to get new access tokens when the old one expires.

---

## Task 6: Protect `/protected` Route

In your `/protected` route, **decorate** it with:

```python
@jwt_required()
```

Then inside, **get username** from JWT claims:

```python
claims = get_jwt()
username = claims["username"]
return jsonify({"message": f"Hello {username}, welcome to the protected page."})
```

**Why:**
- Only authenticated users with valid access tokens can reach protected pages.

---




## Task 6: Create `/protected` Route

**Add a protected route** in `app.py`:

```python
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    claims = get_jwt()
    username = claims["username"]
    return jsonify({"message": f"Hello {username}, welcome to the protected page."})
```

---

# Frontend Instructions


## Task 1: Create auth.js for Managing Access and Refresh Tokens

You need to:
- Refresh the access token automatically when expired.
- Attach access token to each protected request.
- Save and manage tokens securely in `localStorage`.

---

## Step 1: Create `auth.js` File

```javascript
import axios from "axios";

// Base URL of your backend API
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Refresh the access token using the refresh token stored in localStorage.
 * This is called when a protected request fails with a 401 (unauthorized),
 * assuming the access token has expired.
 */
export async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("Refresh token is missing");
    }

    const response = await axios.post(`${BACKEND_URL}/refresh`, null, {
      headers: {
        Authorization: `Bearer ${refreshToken}`, // Send refresh token in Authorization header
      },
    });

    const { access_token } = response.data;

    // Save new access token to localStorage
    localStorage.setItem("access_token", access_token);

    return access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Make a protected request to the backend using the access token.
 * If the access token is expired, automatically attempts to refresh it
 * using the stored refresh token, then retries the original request.
 */
export async function makeAuthenticatedRequest(config) {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Access token is missing");
    }

    // Attach the token to the request headers
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
    config.url = `${BACKEND_URL}${config.url}`;

    return await axios(config);
  } catch (error) {
    // If access token is expired and we received a 401 Unauthorized,
    // try refreshing the token and retrying the request once
    if (error.response && error.response.status === 401) {
      try {
        const newAccessToken = await refreshAccessToken();

        config.headers.Authorization = `Bearer ${newAccessToken}`;
        config.url = `${BACKEND_URL}${config.url}`;
        return await axios(config);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        throw refreshError;
      }
    }

    throw error;
  }
}
```

---

## What you achieve with this update

- Automatically refresh access token if expired.
- Seamless retry of protected requests after refreshing.
- Centralized token management using `localStorage`.
- More secure and user-friendly session handling.


---
## Task 2: Update LoginPage.vue

- After successful login, always store `access_token` and `refresh_token` in localStorage.
- Always redirect to `/success` after successful login.

First import 'refreshAccessToken' from auth in the script:

 ```javascript
 import { refreshAccessToken } from "../auth";
 ```
Update your `login()` method to:

```javascript
async login() {
  if (!this.username || !this.password) {
    this.error = "Both username and password are required.";
    return;
  }
  this.loading = true;
  try {
    const response = await axios.post(`${BACKEND_URL}/login`, {
      username: this.username,
      password: this.password,
    });

    const { access_token, refresh_token } = response.data;
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);

    this.$router.push("/success");
  } catch (error) {
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
  } finally {
    this.loading = false;
  }
}
```

- Also update the `mounted()` hook to check existing tokens:

```javascript
async mounted() {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (accessToken) {
    try {
      await axios.get(`${BACKEND_URL}/protected`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      this.$router.push("/success");
    } catch {
      if (refreshToken) {
        try {
          await refreshAccessToken();
          this.$router.push("/success");
        } catch (refreshError) {
          this.clearTokens();
        }
      } else {
        this.clearTokens();
      }
    }
  } else if (refreshToken) {
    try {
      await refreshAccessToken();
      this.$router.push("/success");
    } catch {
      this.clearTokens();
    }
  }
},
```

Add `clearTokens` method to LoginPage.vue:

```javascript
    clearTokens() {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
```

This allows automatic redirection to `/success` if a valid token is already stored.

## Task 3: Update SuccessPage.vue to Use and Display Access Token

You need to:
- Validate access token after page load.
- Display user welcome message.
- Display access token details (issued time, expiry time, subject).
- Handle logout and clear tokens properly.

---

## Step 1: Update Template

Replace your old static HTML with a dynamic template:

```vue
<template>
  <div class="container mt-5 text-center">
    <h1 v-if="authenticated">Welcome, {{ username }}</h1>
    <p v-if="message" class="text-success">{{ message }}</p>

    <div class="card mt-4" v-if="authenticated">
      <div class="card-body">
        <h5 class="card-title">Your Token Details</h5>
        <table class="table">
          <tbody>
            <tr>
              <th>Token Type</th>
              <td>Access Token</td>
            </tr>
            <tr>
              <th>Issued At</th>
              <td>{{ formatTimestamp(tokenDetails.iat) }}</td>
            </tr>
            <tr>
              <th>Expires At</th>
              <td>{{ formatTimestamp(tokenDetails.exp) }}</td>
            </tr>
            <tr>
              <th>Remaining Time</th>
              <td>{{ calculateRemainingTime(tokenDetails.exp) }}</td>
            </tr>
            <tr>
              <th>Subject (User ID)</th>
              <td>{{ tokenDetails.sub }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <button v-if="authenticated" @click="logout" class="btn btn-danger mt-3">Logout</button>
  </div>
</template>
```

---

## Step 2: Update Script Logic

Inside your `<script>` block:

```javascript
import { makeAuthenticatedRequest, refreshAccessToken } from "../auth";
import { jwtDecode } from "jwt-decode";

export default {
  data() {
    return {
      authenticated: false,
      username: "",
      message: "",
      tokenDetails: {},
    };
  },
  async mounted() {
    await this.validateToken();
  },
  methods: {
    async validateToken() {
      try {
        let token = localStorage.getItem("access_token");
        if (!token) {
          token = await refreshAccessToken();
        }

        const response = await makeAuthenticatedRequest({
          method: "GET",
          url: "/protected",
        });

        this.authenticated = true;
        this.message = response.data.message;
        this.username = response.data.message.split(" ")[1];

        if (token) {
          this.tokenDetails = jwtDecode(token);
        }
      } catch (error) {
        console.error("Token validation failed:", error.response?.data || error.message);
        this.authenticated = false;
        this.clearTokens();
        this.$router.push("/");
      }
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    },
    calculateRemainingTime(exp) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = exp - now;
      if (remaining <= 0) return "Expired";
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      return `${minutes}m ${seconds}s`;
    },
    logout() {
      this.clearTokens();
      this.$router.push("/");
    },
    clearTokens() {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
  },
};
```

---

## Step 3: Update Styling (optional)

You can keep your existing styles or add:

```css
.container {
  max-width: 700px;
}
.card {
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.table th {
  text-align: left;
  width: 40%;
}
.table td {
  text-align: left;
}
```

---

## What you achieve with this update

- Automatically validate access token after login.
- Show username dynamically.
- Show token expiration, issuance, and remaining time.
- If token invalid/expired, redirect back to login.
- Support logout properly.

