
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are not defined in environment variables.');
}

export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'tumbiapp';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-f4faac6ec4e94df08e2c56afbf983bf1.r2.dev';
