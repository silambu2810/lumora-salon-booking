# Lumora — Salon & Beauty Booking Platform

Lumora is a full-stack salon and beauty booking platform with a **FastAPI backend**, **React web application**, and **Expo/React Native mobile application**.

## Project Overview

The platform is designed to support salon discovery, service browsing, customer authentication, appointment booking, availability management, reviews, and role-based administration.

### Applications

* **Backend:** FastAPI + SQLAlchemy + PostgreSQL
* **Web:** React + Vite
* **Mobile:** Expo + React Native
* **Database migrations:** Alembic
* **Authentication:** JWT bearer tokens
* **Password security:** `pwdlib`

## Main Features

### Customer

* Customer registration and login
* Email verification / OTP functionality
* Browse salons
* View salon services
* Check service availability
* Create bookings
* View booking history
* Booking confirmation
* Submit and view reviews

### Salon / Staff Management

* Salon management
* Service management
* Service categories
* Staff management
* Staff booking management
* Working hours
* Staff leave management
* Availability management

### Administration

* Admin authentication
* Salon management
* Service management
* Customer management
* Staff management
* Booking management
* Review management
* Dashboard statistics

## Technology Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Alembic
* Pydantic
* Pydantic Settings
* JWT (`python-jose`)
* `pwdlib`

### Web

* React
* React Router
* Axios
* Vite
* Lucide React
* Oxlint

### Mobile

* Expo
* React Native
* React Navigation
* Async Storage
* React Native Web

## Project Structure

```text
lumora-salon-booking/
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── core/
│   │   ├── dependencies/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── scripts/
│   │   └── services/
│   ├── tests
│   ├── .env.example
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── assets/
│       └── pages/
│
├── mobile/
│   ├── assets/
│   └── src/
│       ├── api/
│       ├── context/
│       └── screens/
│
├── package.json
└── package-lock.json
```

## Backend Setup

### 1. Create and activate the virtual environment

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
python -m pip install -r requirements.txt
```

### 3. Configure environment variables

Copy the example file:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your local PostgreSQL connection and application secrets.

Example:

```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/lumora_db
SECRET_KEY=YOUR_SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Lumora
```

**Never commit `.env` or real credentials to Git.**

### 4. Run database migrations

```powershell
alembic upgrade head
```

### 5. Start the API

```powershell
uvicorn app.main:app --reload
```

The API will normally be available at:

```text
http://127.0.0.1:8000
```

### API documentation

FastAPI provides interactive documentation at:

```text
http://127.0.0.1:8000/docs
```

and an alternative documentation interface at:

```text
http://127.0.0.1:8000/redoc
```

Health check:

```text
GET /health
```

## Web Application Setup

From the project root:

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at:

```text
http://localhost:5173
```

### Web production build

```powershell
npm run build
```

### Lint

```powershell
npm run lint
```

## Mobile Application Setup

From the project root:

```powershell
cd mobile
npm install
npm start
```

Expo provides the development environment for the mobile application.

Available scripts:

```text
npm start
npm run android
npm run ios
npm run web
```

## Authentication

The backend provides authentication endpoints under `/auth`.

Current authentication functionality includes:

* Customer registration
* User login
* JWT access tokens
* Role information in authenticated sessions
* Password hashing
* Email verification / OTP functionality

Authenticated API requests use bearer-token authentication.

Example:

```http
Authorization: Bearer <access_token>
```

## Database

Lumora uses PostgreSQL for persistent application data.

SQLAlchemy is used as the ORM and Alembic manages database schema migrations.

To apply migrations:

```powershell
cd backend
alembic upgrade head
```

## Security

The repository intentionally excludes local environment files and generated/dependency directories.

Do not commit:

* `.env`
* passwords
* JWT secret keys
* SMTP passwords
* API credentials
* `node_modules`
* Python virtual environments
* generated Expo/build files

Use `backend/.env.example` as the configuration template.

## Development Checks

### Backend dependency validation

```powershell
backend\.venv\Scripts\python.exe -m pip check
```

### Web linting

```powershell
cd frontend
npm run lint
```

### Web production build

```powershell
npm run build
```

## API Architecture

The FastAPI application separates functionality into:

* **Routers** — HTTP/API endpoints
* **Schemas** — request and response validation
* **Services** — business logic
* **Models** — database entities
* **Core** — configuration, database, and security
* **Dependencies** — authentication and shared request dependencies

This structure keeps API routing, business logic, validation, and persistence concerns separated.

## Repository

GitHub:

https://github.com/silambu2810/lumora-salon-booking

## Status

The repository contains the backend, web frontend, and mobile application source code.

Production deployment URLs should be added here once the applications are deployed and verified.
