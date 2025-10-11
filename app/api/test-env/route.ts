import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    AWS_REGION: !!process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET: !!process.env.AWS_S3_BUCKET,
    NODE_ENV: process.env.NODE_ENV,
    // Show actual values for debugging (remove in production)
    AWS_REGION_VALUE: process.env.AWS_REGION,
    AWS_S3_BUCKET_VALUE: process.env.AWS_S3_BUCKET,
  };

  return NextResponse.json(envVars);
}