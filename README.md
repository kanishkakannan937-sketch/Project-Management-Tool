
# Project Management Tool

A web-based project management application built as part of my CodeAlpha internship task.

## Features

- User registration and login
- Create and manage projects
- Add members to projects
- Create and assign tasks
- Update task status
- Add comments to tasks
- Delete tasks and projects

## Tech Stack

**Frontend:** HTML, CSS, JavaScript  
**Backend:** Node.js, Express.js  
**Database:** MongoDB

## Project Structure

```text
Project-Management-Tool/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   └── style.css
└── .gitignore
```

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/kanishkakannan937-sketch/Project-Management-Tool.git
cd Project-Management-Tool
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder and add your own MongoDB connection string and required environment variables.

**Do not upload your `.env` file or database credentials to GitHub.**

### 3. Start the backend

```bash
node server.js
```

The backend runs locally on port `5002` (if configured as in this project).

### 4. Open the frontend

Open `frontend/login.html` using VS Code Live Server.

Make sure the backend is running before using the application.

## Author

Kanishka Kannan

GitHub: [kanishkakannan937-sketch](https://github.com/kanishkakannan937-sketch)