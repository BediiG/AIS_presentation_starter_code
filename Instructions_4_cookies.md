# Switch to Secure Cookie-Based Token Handling

## Goal
- Remove access/refresh tokens from headers.
- Issue tokens securely via **HTTP-only cookies**.
- Always use cookies for authentication and session refresh.

---

## Step 1: Update JWT Configuration

After initializing your `Flask` app:

```python
app.config["JWT_SECRET_KEY"] = "your_jwt_secret_key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=36000)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(seconds=360000)

# Use cookies instead of headers
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token_cookie"
app.config["JWT_REFRESH_COOKIE_NAME"] = "refresh_token_cookie"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Recommended: True in production
app.config["JWT_COOKIE_SECURE"] = False        # Set True if using HTTPS
```

✅ Explanation:
- Access and refresh tokens will now be automatically stored and read from cookies.
- No Authorization headers needed.

---

## Step 2: Update `/login` Route

In your `/login` route, **replace** the success block:

```python
if bcrypt.check_password_hash(user.password, password):
    user.failed_attempts = 0
    db.session.commit()
    additional_claims = {"username": user.username}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=additional_claims)

    response = jsonify({"message": "Login successful"})
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    return response
```

✅ Explanation:
- **Access token** and **refresh token** are securely sent in **HTTP-only cookies**.
- Response body stays small and simple.

---

## Step 3: Update `/refresh` Route

In your `/refresh` route, **replace** the return statement:

```python
new_access_token = create_access_token(identity=str(current_user), additional_claims=additional_claims)

response = jsonify({"message": "Token refreshed"})
set_access_cookies(response, new_access_token)
return response
```

✅ Explanation:
- Refreshing token automatically **updates** the cookie.

---

## Step 4: Update `/protected` Route

No change needed except now JWT will be validated from cookies automatically.
Keep it:

```python
@app.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    claims = get_jwt()
    username = claims["username"]
    return jsonify({"message": f"Hello {username}, welcome to the protected page."})
```

✅ Explanation:
- `@jwt_required()` automatically extracts the token from cookies.

---

## Step 5: Create `/logout` Route


```python
@app.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logged out"})
    unset_jwt_cookies(response)
    return response
```

✅ Explanation:
- Clears both the access and refresh token cookies upon logout.

---

# ✅ What You Achieve with This Setup:
- No sensitive tokens exposed in JavaScript.
- No Authorization headers sent manually.
- Automatic CSRF protection if enabled later.
- Easier session management with secure cookies.
- Cleaner, safer, production-friendly authentication flow.

# Frontend Update Instructions (LoginPage.vue)

## Goal
- Fully switch to cookie-based session management.
- No usage of access_token and refresh_token in localStorage anymore.
- Tokens automatically handled in cookies.

---

# Task 1: Update LoginPage.vue Template

✅ **No changes needed in template.**

You can keep the form and button structure exactly the same.

---

# Task 2: Update Script Logic

### Step 2.1: Clean Up `mounted()`

Replace your current `mounted()` method with:

```javascript
async mounted() {
  try {
    await axios.get(`${BACKEND_URL}/protected`, {
      withCredentials: true,
    });
    this.$router.push("/success");
  } catch {
    // Not authenticated, do nothing
  }
}
```

**Why:**
- It simply tries to reach the `/protected` page with cookies attached.
- No localStorage tokens needed anymore.

---

### Step 2.2: Update `login()`

Replace your `login()` method with:

```javascript
async login() {
  if (!this.username || !this.password) {
    this.error = "Both username and password are required.";
    return;
  }
  this.loading = true;
  try {
    await axios.post(
      `${BACKEND_URL}/login`,
      {
        username: this.username,
        password: this.password,
      },
      {
        withCredentials: true,
      }
    );

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

**Important Changes:**
- No token parsing from `response.data`.
- Only `withCredentials: true` option needed.

---

### Step 2.3: Update `signup()`

Replace your `signup()` method with:

```javascript
async signup() {
  if (!this.username || !this.password) {
    this.error = "Both username and password are required.";
    return;
  }
  this.loading = true;
  try {
    const response = await axios.post(
      `${BACKEND_URL}/register`,
      {
        username: this.username,
        password: this.password,
      },
      { withCredentials: true }
    );

    if (response.status === 201) {
      this.isSignup = false;
      this.error = "";
    }
  } catch (error) {
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
  } finally {
    this.loading = false;
  }
}
```

**Why:**
- Although signup does not create a token immediately, it's safer to enable `withCredentials: true` for all backend communications.

---

### Step 2.4: Clean Up `clearTokens()`

Remove the entire `clearTokens()` method from LoginPage.vue.

**Why:**
- Tokens are now stored in cookies, not localStorage.
- Logout will be handled differently later by calling `/logout` backend endpoint.

---

# What You Achieve

- **Login** sends username and password, receives tokens as cookies.
- **Session** automatically sent on every protected request.
- **No manual token management needed** anymore on the frontend side.



Now we update  `SuccessPage.vue` and `auth.js` files so that authentication relies entirely on secure cookies.  
The goal is to remove all `localStorage` logic 

---

# Part 1: Update `SuccessPage.vue`


## 1. Update `mounted()` to Always Trust Cookies
Change the `mounted()` lifecycle method to:

- Directly call `await this.validateToken()` without checking tokens manually.
- Do not attempt to read from `localStorage`.

---

## 2. Update `validateToken()` Method
Inside `validateToken()`:

- Remove logic fetching `access_token` from `localStorage`.
- Always make a request to `/protected` using `makeAuthenticatedRequest`.
- If the request succeeds, extract and display the username.
- If it fails, redirect back to `/`.

Code:

```javascript
async validateToken() {
  try {
    await refreshAccessToken();

    const response = await makeAuthenticatedRequest({
      method: "GET",
      url: "/protected",
    });

    this.authenticated = true;
    this.message = response.data.message;
    this.username = response.data.message.split(" ")[1];
  } catch (error) {
    console.error("Token validation failed:", error.response?.data || error.message);
    this.authenticated = false;
    this.$router.push("/");
  }
}
```

---

## 3. Update `logout()` Method
In the `logout()` method:

- Always call the `/logout` backend endpoint using `fetch`.
- Always set `credentials: "include"` in the fetch request.
- After logout, redirect back to the home page.

Code:

```javascript
logout() {
  fetch(`${BACKEND_URL}/logout`, {
    method: "POST",
    credentials: "include",
  }).then(() => {
    this.authenticated = false;
    this.$router.push("/");
  }).catch((error) => {
    console.error("Logout failed:", error);
  });
}
```

---

## 4. Delete `clearTokens()` Method
- Fully remove the `clearTokens()` method because you are not handling tokens manually anymore.

---

## 5. Update Template
- Remove the block that shows token details.
- Keep only the welcome message and logout button.

Your `<template>` should now **only show** username and a logout button.

---

# Part 2: Update `auth.js`

---

## 1. Update `refreshAccessToken()` to Always Use Cookies
Replace the `refreshAccessToken()` function with:

```javascript
export async function refreshAccessToken() {
  try {
    await axios.post(`${BACKEND_URL}/refresh`, null, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Error refreshing token:", error.response?.data || error.message);
    throw error;
  }
}
```

**Changes:**
- Always call `/refresh` using `credentials: "include"`.
- No need to manually send Authorization header.
- No more reading or writing from `localStorage`.

---

## 2. Update `makeAuthenticatedRequest()` to Always Use Cookies
Replace the `makeAuthenticatedRequest()` function with:

```javascript
export async function makeAuthenticatedRequest(config) {
  try {
    return await axios({
      ...config,
      url: `${BACKEND_URL}${config.url}`,
      withCredentials: true,
    });
  } catch (error) {
    console.error("Authenticated request failed:", error.response?.data || error.message);
    throw error;
  }
}
```

**Changes:**
- Always include cookies with the request.
- No manual Authorization header needed.
- No retry logic needed because `/refresh` already manages session renewal.

---


