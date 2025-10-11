import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lookup } from 'mime-types';

// Initialize S3 client (server-side only)
let s3Client: S3Client | null = null;
let BUCKET_NAME: string | null = null;

function initializeS3() {
  if (typeof window !== 'undefined') {
    throw new Error('S3 operations can only be performed on the server side');
  }

  if (!s3Client) {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_S3_BUCKET;

    console.log('AWS Environment Check:', {
      hasRegion: !!region,
      hasAccessKeyId: !!accessKeyId,
      hasSecretAccessKey: !!secretAccessKey,
      hasBucketName: !!bucketName,
      region: region || 'undefined',
      bucketName: bucketName || 'undefined'
    });

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(`Missing required AWS environment variables. Found: region=${!!region}, accessKeyId=${!!accessKeyId}, secretAccessKey=${!!secretAccessKey}, bucketName=${!!bucketName}`);
    }

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    BUCKET_NAME = bucketName;
    console.log('S3 Client initialized successfully');
  }

  return { s3Client: s3Client!, bucketName: BUCKET_NAME! };
}

/**
 * Generate a unique file key for S3 storage
 */
export function generateFileKey(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/${timestamp}_${sanitizedName}`;
}

/**
 * Upload a file to S3
 */
export async function uploadFileToS3(
  fileBuffer: Buffer,
  key: string,
  contentType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { s3Client, bucketName } = initializeS3();
    
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('S3 upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Generate a signed URL for file download
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url?: string; error?: string }> {
  try {
    const { s3Client, bucketName } = initializeS3();
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { url };
  } catch (error) {
    console.error('S3 signed URL error:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to generate download URL' 
    };
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { s3Client, bucketName } = initializeS3();
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(filename: string): string {
  return lookup(filename) || 'application/octet-stream';
}

