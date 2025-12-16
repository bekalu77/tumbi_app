# Tumbi Construction Marketplace

This project is a web application for a construction marketplace called Tumbi.

## Project Architecture

This project has been updated to a modern, scalable architecture:

- **Frontend:** A React-based single-page application.
- **Backend:** A Node.js and Express server written in TypeScript.
- **Database:** A serverless PostgreSQL database hosted on **Neon**.
- **Media Storage:** Media uploads are handled by **Cloudflare R2**, providing a scalable and cost-effective solution for object storage.

## Project Setup

Follow these steps to get the project running locally.

### Prerequisites

- Node.js (v18 or later recommended)
- npm
- A Neon account (for the database)
- A Cloudflare account (for R2 media storage)

### 1. Backend Setup

The backend connects to Neon for data and Cloudflare R2 for media.

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure R2 Credentials:**

    In the `backend` directory, create a new file named `r2-config.ts`. This file will store your Cloudflare R2 credentials. **In a production environment, you should use environment variables instead.**

    - In your Cloudflare dashboard, create an R2 bucket.
    - Create an R2 API Token with "Object Read & Write" permissions for that bucket.
    - Copy your **Account ID**, **Access Key ID**, and **Secret Access Key** into the file below, along with your bucket's name and public URL.

    ```typescript
    // backend/r2-config.ts
    import { S3Client } from '@aws-sdk/client-s3';

    const accountId = 'YOUR_CLOUDFLARE_ACCOUNT_ID';
    const accessKeyId = 'YOUR_R2_ACCESS_KEY_ID';
    const secretAccessKey = 'YOUR_R2_SECRET_ACCESS_KEY';

    export const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });

    export const R2_BUCKET_NAME = 'YOUR_R2_BUCKET_NAME'; // e.g., 'tumbiapp'
    export const R2_PUBLIC_URL = 'YOUR_R2_PUBLIC_URL'; // e.g., 'https://pub-your-hash.r2.dev'
    ```

4.  **Set up the database schema:**

    This one-time command will connect to your Neon database, clear any existing tables, and create the required schema.

    ```bash
    npm run db:setup
    ```

5.  **Start the backend server:**

    ```bash
    npm run dev
    ```

    The server will start on `http://localhost:3001`. The `dev` script will first run the database setup and then start the server.

### 2. Frontend Setup

Once the backend is running, you can start the frontend.

1.  **Open a new terminal** and navigate to the project root directory.

2.  **Install frontend dependencies:**

    ```bash
    npm install
    ```

3.  **Start the frontend development server:**

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:5173`.
