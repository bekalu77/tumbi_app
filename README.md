# Tumbi Construction Marketplace

This project is a web application for a construction marketplace called Tumbi.

## Project Architecture

This project has been updated to a modern, serverless architecture:

- **Frontend:** A React-based single-page application, deployed to **Vercel**.
- **Backend:** A serverless API built with Hono and running on **Cloudflare Workers**.
- **Database:** A serverless PostgreSQL database hosted on **Neon**.
- **Media Storage:** Media uploads are handled by **Cloudflare R2**.

## Deployment

This project is now configured for a clean, two-step deployment process.

### 1. Backend Deployment (Cloudflare)

First, deploy your backend API to Cloudflare Workers.

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Deploy:**

    ```bash
    npm run deploy
    ```
    *This will build and deploy your worker. After the first deploy, you must configure your secrets in the Cloudflare dashboard.*

4.  **Configure Secrets in Cloudflare:**
    *   Go to **Workers & Pages** > `tumbi-backend` > **Settings** > **Variables**.
    *   Add your `DATABASE_URL` and `JWT_SECRET`.
    *   Under **R2 Bucket Bindings**, ensure your `R2_BUCKET` is bound to the `tumbiapp` bucket.

### 2. Frontend Deployment (Vercel)

Once the backend is live, deploy your frontend to Vercel.

1.  **Push to GitHub:** Ensure all your latest code is pushed to your GitHub repository.

2.  **Configure Vercel:**
    *   Connect your GitHub repository to a new Vercel project.
    *   Vercel will automatically detect your Vite project and configure the build settings. **You do not need to change anything.**

3.  **Add Environment Variable:**
    *   In your Vercel project settings, go to **Settings > Environment Variables**.
    *   Add the following variable:
        *   **Name:** `VITE_API_URL`
        *   **Value:** The URL of your live Cloudflare Worker (e.g., `https://tumbi-backend.<your-name>.workers.dev`).

4.  **Trigger a Redeploy:** Vercel will automatically build and deploy the latest version from your `main` branch.

Your site will now be live and fully functional.

## Local Development

- **Backend:** `cd backend`, run `npm install`, and then `npm run dev`.
- **Frontend:** From the root directory, run `npm install`, and then `npm run dev`.
