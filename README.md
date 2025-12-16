# Tumbi Construction Marketplace

This project is a web application for a construction marketplace called Tumbi.

## Project Architecture

This project has been updated to a modern, scalable architecture:

- **Frontend:** A React-based single-page application, deployable to **Vercel**.
- **Backend:** A Node.js and Express server, deployable to **Render**.
- **Database:** A serverless PostgreSQL database hosted on **Neon**.
- **Media Storage:** Media uploads are handled by **Cloudflare R2**.

## Deployment

This project is designed to be deployed on free tiers for a cost-effective MVP.

### 1. Backend Deployment (Render)

1.  **Push to GitHub:** Ensure your project is pushed to a GitHub repository.
2.  **Create a Render Account:** Sign up for a free account at [Render.com](https://render.com).
3.  **Create a New Web Service:**
    *   Connect it to your GitHub repository.
    *   Set the **Root Directory** to `backend`.
    *   Render will automatically detect your `package.json` and use the `npm install` and `npm run build` commands.
4.  **Add Environment Variables:** In Render's "Environment" settings, add all the key-value pairs from your `backend/.env.example` file.

Render will automatically deploy your backend. Your service will be live at the URL Render provides.

### 2. Frontend Deployment (Vercel)

1.  **Create a Vercel Account:** Sign up for a free account at [Vercel.com](https://vercel.com).
2.  **Create a New Project:**
    *   Connect it to the same GitHub repository.
    *   Vercel will automatically detect that you have a Vite-based React project and configure the build settings correctly.
3.  **Deploy:** Click the "Deploy" button.

There is no need to set environment variables for the frontend, as it is already configured to communicate with your live backend on Render.

## Local Development

### Prerequisites

- Node.js (v18 or later recommended)
- npm

### Backend

1.  Navigate to `cd backend`.
2.  Run `npm install`.
3.  Copy the `.env.example` file to a new `.env` file and fill in your credentials for Neon and Cloudflare R2.
4.  Run `npm run dev` to start the local backend server on `http://localhost:3001`.

### Frontend

1.  In a separate terminal, navigate to the project root directory.
2.  Run `npm install`.
3.  Run `npm run dev` to start the frontend development server, which will be available at `http://localhost:5173`.
