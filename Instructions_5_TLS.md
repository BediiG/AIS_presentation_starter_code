# Lab Instructions: Upgrading Application to HTTPS (Secure Localhost)

This lab will guide you step-by-step on how to configure **both backend and frontend** to serve over **HTTPS locally** using **self-signed certificates**.

You will:
- Generate certificates.
- Update backend (`app.py`) and frontend (`vite.config.js`) settings.
- Properly configure CORS.
- Update `.env` to point to HTTPS URLs.

---

# Part 1: Generate SSL Certificates

## 1. Create `generate_cert.py`
Create a new Python script named `generate_cert.py` at the project root with the following content:

```python
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from datetime import datetime, timedelta

def generate_cert(cert_prefix):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    with open(f"{cert_prefix}-key.pem", "wb") as f:
        f.write(key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "TR"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Istanbul"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Istanbul"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "AIS Demo"),
        x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
    ])

    cert = x509.CertificateBuilder()\
        .subject_name(subject)\
        .issuer_name(issuer)\
        .public_key(key.public_key())\
        .serial_number(x509.random_serial_number())\
        .not_valid_before(datetime.utcnow())\
        .not_valid_after(datetime.utcnow() + timedelta(days=365))\
        .add_extension(
            x509.SubjectAlternativeName([x509.DNSName("localhost")]),
            critical=False
        )\
        .sign(key, hashes.SHA256())

    with open(f"{cert_prefix}-cert.pem", "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    print(f"{cert_prefix}-cert.pem and {cert_prefix}-key.pem generated for localhost")

generate_cert("frontend")
generate_cert("backend")
```

**Explanation:**
- Generates `frontend-cert.pem` and `frontend-key.pem` for Vite.
- Generates `backend-cert.pem` and `backend-key.pem` for Flask.

---

## 2. Run the script
In your terminal, execute:

```bash
python generate_cert.py
```

You should now have 4 new files:
- `frontend-cert.pem`
- `frontend-key.pem`
- `backend-cert.pem`
- `backend-key.pem`

---

# Part 2: Update Backend (`app.py`)

## 1. Update CORS Configuration
**Before** you had simply:

```python
CORS(app)
```

**Now replace it with:**

```python
from flask_cors import CORS

CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": "https://localhost:5173"}},
    methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"]
)
```

**Explanation:**
- `supports_credentials=True` is necessary for sending cookies across domains.
- `origins` is locked to `https://localhost:5173` to limit CORS access to your Vite frontend.
- Only `GET` and `POST` methods are allowed.
- Only `Content-Type` and `Authorization` headers are allowed.

---

## 2. Run Backend with SSL
Update your `if __name__ == "__main__"` block to:

```python
if __name__ == "__main__":
    app.run(ssl_context=("backend-cert.pem", "backend-key.pem"), port=5000)
```

**Changes:**
- Instead of running with `host="0.0.0.0"`, you now specify `ssl_context` to use HTTPS.
- The backend will serve on `https://localhost:5000`.

---

# Part 3: Update Frontend (`vite.config.js`)

## 1. Replace Vite Config
Replace your existing `vite.config.js` with:

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'

export default defineConfig({
  plugins: [vue()],
  server: {
    https: {
      cert: fs.readFileSync('../frontend-cert.pem'),
      key: fs.readFileSync('../frontend-key.pem'),
    },
    port: 5173,
  },
})
```

**Changes:**
- Use the frontend SSL certificates generated earlier.
- Vite now runs on `https://localhost:5173`.

---

# Part 4: Update Environment File (`.env`)

Update your `.env` file to point to HTTPS backend:

```env
VITE_BACKEND_URL=https://localhost:5000
```

**Important:**
- Always use HTTPS now when making API requests.
- The `makeAuthenticatedRequest` and `refreshAccessToken` functions in `auth.js` already pull from `VITE_BACKEND_URL`, so no additional code changes needed.

---

# After Migration Checklist

- [x] SSL certificates generated for both frontend and backend.
- [x] Flask backend (`app.py`) runs with HTTPS and secure CORS settings.
- [x] Vite frontend uses HTTPS with certificates.
- [x] Environment points to `https://localhost:5000`.
- [x] Frontend sends all requests with credentials (cookies).

---

# Important Notes for Local Testing

- Your browser will warn that the certificate is **self-signed** and **not trusted**.
  - You need to manually "Accept the Risk" and continue for `localhost`.
- In production, you must use a real certificate issued by a trusted Certificate Authority (CA).

---

# How to Trust Your Local Self-Signed Certificate (frontend-cert.pem)

## 1. Export the Certificate
You already have the file:

```bash
cp frontend-cert.pem frontend-cert.pem


1. Open Chrome and navigate to:

chrome://settings/security


2. Scroll down and click **Manage Certificates**.
3. Under the **Authorities** tab:
- Click **Import**.
- Select `frontend-cert.pem` 

4. When prompted:
- Check **Trust this certificate for identifying websites**.
- Confirm and finish.

5. Restart Chrome for the changes to take effect.


