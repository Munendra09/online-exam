# Software Requirements Specification (SRS) - LTA Exam Portal

## 1. Introduction
### 1.1 Purpose
The purpose of this document is to provide a complete overview of the LTA Exam Portal. It details the functional and non-functional requirements, technical architecture, and deployment strategies of this system.

### 1.2 Scope
LTA Exam Portal is a comprehensive online examination system allowing students to take tests and administrators to manage exams, users, and track performance.

## 2. Technical Stack (DevOps & Architecture)
- **Frontend**: Next.js (React), Tailwind CSS, Recharts, Lucide React
- **Backend**: Node.js, Express.js, Sequelize (ORM)
- **Database**: MySQL 8.0
- **Authentication**: JWT, bcryptjs, OTP-based email verification
- **Deployment & DevOps**: Docker, Docker Compose

## 3. System Features & Functional Requirements
### 3.1 User Management
- **Student Registration & Login**: Users can sign up and authenticate via JWT tokens.
- **OTP Verification**: Configurable OTP mode (client/server-email based) for secure verifications.
- **Role-Based Access Control**: Differentiates between Students and Administrators.

### 3.2 Examination Module
- Dynamic test assignments.
- Secure test-taking environment (preventing cheating/tab switching).
- Automated grading and result generation.

### 3.3 Admin Dashboard
- Manage users (Students, Instructors).
- Upload exams, questions (CSV parsing supported in backend).
- Analytics and visualizations using Recharts on the frontend.

## 4. Non-Functional Requirements
- **Performance**: High availability, supported by stateless Node.js containers and Next.js static/server rendering.
- **Security**: Passwords encrypted using bcrypt (10 rounds). API endpoints secured via JWT. CORS and Helmet applied on the backend for extra web security.
- **Scalability**: The Dockerized microservices architecture allows independent scaling of frontend, backend, and database components.

## 5. DevOps Implementation
This project is configured as a complete DevOps pipeline:
- **Containerization**: Separate `Dockerfile`s for Next.js frontend and Node.js backend using Alpine Linux images to keep size small.
- **Orchestration**: `docker-compose.yml` ties the frontend, backend, and MySQL database together into a unified network.
- **Environment Management**: A centralized `.env.local` handles configurations, ensuring secrets (like DB passwords and JWT keys) are securely injected into containers at runtime.
- **Automation**: Custom shell and PowerShell scripts (`run.sh` / `run.ps1`) to automate the build and deployment process locally or on a server.
