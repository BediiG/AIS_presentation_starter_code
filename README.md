# AIS Presentation Starter Code

This project was developed as a hands-on lecture for the **Advanced Information Security** course at UKIM. It demonstrates how to implement a secure authentication and session management system using OWASP guidelines. The application includes a Flask backend and Vue 3 frontend, packaged in Docker containers for easy deployment and testing.

The project progressively covers the following topics:
- User registration and login using a relational database
- Password hashing and account lockout after multiple failed attempts
- Stateless session management using access and refresh tokens (JWT)
- Migration from token-based localStorage sessions to HTTP-only secure cookies
- Implementation of HTTPS using self-signed certificates for both backend and frontend
- CORS configuration and secure API routing
- Token refresh and protection of restricted routes

Each stage aligns with secure development practices and illustrates real-world session handling techniques.


## How to Start the Project

### 1. Start Docker Containers

In the project root, run:

```bash
docker-compose up --build
```

This builds and starts both frontend and backend environments.

---

### 2. Open a Terminal Inside the Frontend Container

In a new terminal window:

```bash
docker exec -it ais_presentation_starter_code-frontend-1 sh
```

Inside the container, start the Vue frontend:

```bash
npm run dev
```

This runs the frontend development server at port 5173.

---

### 3. Open a Terminal Inside the Backend Container

In another new terminal window:

```bash
docker exec -it ais_presentation_starter_code-backend-1 sh
```

Inside the container, start the Flask backend:

```bash
python app.py
```

This runs the backend API server at port 5000.

---

### 4. Open in Your Browser

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend (optional to check API directly): [http://localhost:5000](http://localhost:5000)

After you implement steps, you can test login and signup flows from the frontend.

---

## Useful Notes

- After editing backend files, you might need to manually restart `python app.py`.
- Environment variables are loaded from `.env` files.
- You should have a `.env` file locally based on the provided `.env.example`.

---

## Docker Setup

This project uses:
- Node.js 20 (Alpine) inside the frontend container.
- Python 3.11 (Slim) inside the backend container.
- Docker volumes to synchronize local file changes without rebuilding.
- Docker Compose to orchestrate containers.

---

