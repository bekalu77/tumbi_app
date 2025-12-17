# Tumbi Construction Marketplace

This project is a web application for a construction marketplace called Tumbi.

## Project Architecture

This project has been updated to a modern, serverless architecture:

- **Frontend:** A React-based single-page application, deployable to **Vercel**.
- **Backend:** A serverless API built with Hono and running on **Cloudflare Workers**.
- **Database:** A serverless PostgreSQL database hosted on **Neon**.
- **Media Storage:** Media uploads are handled by **Cloudflare R2**.

## Deployment

This project is designed to be deployed on free tiers for a cost-effective MVP.

### 1. Backend Deployment (Cloudflare Workers)

Your backend is now a Cloudflare Worker, managed via the `wrangler` CLI.

1.  **Install Wrangler:** If you don't have it, install the Cloudflare Wrangler CLI globally:

    ```bash
    npm install -g wrangler
    ```

2.  **Login to Cloudflare:**

    ```bash
    wrangler login
    ```

3.  **Build the Worker:** Navigate to the `backend` directory and build your project. This compiles your TypeScript code into JavaScript.

    ```bash
    cd backend
    npm run build
    ```

4.  **Deploy the Worker:**

    ```bash
    npm run deploy
    ```

5.  **Configure Environment Variables & Bindings:**
    *   After your first deployment, go to the Cloudflare dashboard.
    *   Navigate to **Workers & Pages** and select your `tumbi-backend` worker.
    *   Go to **Settings > Variables**.
    *   Add your `DATABASE_URL` and `JWT_SECRET` as environment variables.
    *   Your R2 bucket, `tumbiapp`, will be automatically bound based on the `wrangler.toml` file.

### 2. Frontend Deployment (Vercel)

1.  **Create a Vercel Account:** Sign up for a free account at [Vercel.com](https://vercel.com).
2.  **Create a New Project:**
    *   Connect it to the same GitHub repository.
    *   Vercel will automatically detect your Vite-based React project.
3.  **Add Environment Variable:**
    *   In the project settings, add a new environment variable:
    *   **Name:** `VITE_API_URL`
    *   **Value:** The URL of your newly deployed Cloudflare Worker (e.g., `https://tumbi-backend.<your-subdomain>.workers.dev`).
4.  **Deploy:** Click the "Deploy" button.

## Local Development

### Prerequisites

- Node.js (v18 or later recommended)
- npm
- Wrangler CLI

### Backend

1.  Navigate to `cd backend`.
2.  Run `npm install`.
3.  Copy the `.env.example` file to a new `.env` file and fill in your credentials.
4.  Run `npm run dev` to start the local backend server using Wrangler. This will proxy requests to your local worker.

### Frontend

1.  In a separate terminal, navigate to the project root directory.
2.  Run `npm install`.
3.  Run `npm run dev` to start the frontend development server on `http://localhost:5173`.
