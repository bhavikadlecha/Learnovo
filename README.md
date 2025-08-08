# Learnovo Web App

A full-stack web application for personalized learning management, built with Django (backend) and React (frontend).

---

## Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Backend Setup (Django)](#backend-setup-django)
- [Frontend Setup (React)](#frontend-setup-react)
- [Running the App](#running-the-app)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)
- [Useful Links](#useful-links)

---

## Project Overview
Learnovo is a platform for managing learning goals, tracking progress, and accessing curated resources. It features user authentication, personalized learning plans, progress tracking, and more.

---

## Tech Stack
- **Backend:** Django 5.2.3, Django REST Framework, PostgreSQL
- **Frontend:** React 19, React Router
- **Other:** CORS, JWT/Session Auth

---

## Prerequisites
- **Python:** 3.8+
- **Node.js:** 16+
- **npm:** 7+
- **PostgreSQL:** 12+

---

## Backend Setup (Django)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure PostgreSQL database:**
   - Ensure PostgreSQL is running.
   - Create a database named `learnovo_db` and a user `postgres` with password `1234` (or update `backend/learnovo_backend/settings.py` with your credentials).
   - Example (psql):
     ```sql
     CREATE DATABASE learnovo_db;
     CREATE USER postgres WITH PASSWORD '1234';
     GRANT ALL PRIVILEGES ON DATABASE learnovo_db TO postgres;
     ```

5. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (admin):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the backend server:**
   ```bash
   python manage.py runserver
   ```
   - The API will be available at `http://localhost:8000/`

---

## Frontend Setup (React)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend server:**
   ```bash
   npm start
   ```
   - The app will open at `http://localhost:3000/`

---

## Running the App
- **Backend:** http://localhost:8000/
- **Frontend:** http://localhost:3000/
- **API Base Path:** http://localhost:8000/api/

---

## API Endpoints
- **User Auth:** `/api/users/register/`, `/api/users/login/`, `/api/users/logout/`, `/api/users/profile/`
- **Learning:** `/api/learning/subjects/`, `/api/learning/topics/`, `/api/learning/goals/`, `/api/learning/resources/`, `/api/learning/progress/`, etc.
- See `backend/learning/urls.py` and `backend/users/urls.py` for full details.

---

## Troubleshooting
- **CORS Issues:** Ensure both servers are running and CORS is enabled in Django settings.
- **Database Errors:** Check PostgreSQL is running and credentials match `settings.py`.
- **Port Conflicts:** Change the default ports in `manage.py runserver` or `npm start` if needed.
- **Dependency Issues:** Ensure you are using compatible versions of Python, Node, npm, and PostgreSQL.

---

## Useful Links
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## License
This project is for educational purposes. 