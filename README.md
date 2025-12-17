# Tumbi Construction Marketplace

This project is a web application for a construction marketplace called Tumbi.

## Project Architecture

This project has been updated to a modern, serverless architecture:

- **Frontend:** A React-based single-page application, deployed to **Vercel**.
- **Backend:** A serverless API built with Hono and running on **Cloudflare Workers**.
- **Database:** A serverless PostgreSQL database hosted on **Neon**.
- **Media Storage:** Media uploads are handled by **Cloudflare R2**.

## Deployment

Your project is now configured for a streamlined, two-step deployment.

### 1. Backend Deployment (Cloudflare)

Your backend deployment is now automated. Your secrets are stored in the `backend/wrangler.toml` file, which is ignored by Git.

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Install Dependencies (if you haven't already):**

    ```bash
    npm install
    ```

3.  **Deploy:**

    ```bash
    npm run deploy
    ```
    *This single command will now build, upload, and set the secrets for your worker.*

### 2. Frontend Deployment (Vercel)

Once the backend is live, deploy your frontend.

1.  **Commit and Push to GitHub:** Make sure all your latest code is committed and pushed to your GitHub repository.

    ```bash
    git add .
    git commit -m "Prepare for frontend deployment"
    git push
    ```

2.  **Configure Vercel:**
    *   Connect your GitHub repository to a new Vercel project.
    *   Vercel will automatically detect your Vite project.

3.  **Add Environment Variable:**
    *   In your Vercel project settings, go to **Settings > Environment Variables**.
    *   Add: `VITE_API_URL` = The URL of your live Cloudflare Worker (e.g., `https://tumbi-backend.bekalu77.workers.dev`).

4.  **Deploy.**

Your site will now be live and fully functional.

## Local Development

- **Backend:** `cd backend`, run `npm install`, then `npm run dev`.
- **Frontend:** From the root directory, run `npm install`, then `npm run dev`.
