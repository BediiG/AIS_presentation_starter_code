# AIS Presentation Starter Code

This project sets up a simple frontend (Vue 3 + Vite) and backend (Flask) environment using Docker.

Both services are installed automatically inside containers, allowing you to start developing immediately without installing Node.js, Python, or libraries locally.

---

## 🚀 How to Start the Project

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

## 📋 Useful Notes

- After editing frontend files, you might need to manually restart `npm run dev`.
- After editing backend files, you might need to manually restart `python app.py`.
- Environment variables are loaded from `.env` files.
- No hot reloading is configured inside Docker containers — manual restarts are expected.
- You should have a `.env` file locally based on the provided `.env.example`.

---

## 🐳 Docker Setup

This project uses:
- Node.js 20 (Alpine) inside the frontend container.
- Python 3.11 (Slim) inside the backend container.
- Docker volumes to synchronize local file changes without rebuilding.
- Docker Compose to orchestrate containers.

---

## 📆 Project Structure

```
AIS_presentation_starter_code/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js (optional later)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.vue
│   │   │   ├── SuccessPage.vue
├── .env.example
├── README.md
```

---

Ready to develop, test, and build your AIS Presentation project!
