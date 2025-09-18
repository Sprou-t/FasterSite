// S3 integration for image storage
import { S3Client as AWSS3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateImageHash } from './hash';

export interface S3UploadResult {
  s3Key: string;
  s3Url: string;
  contentHash: string;
  fileSize: number;
}

export class S3Client {
  private s3: AWSS3Client;
  private bucketName: string;
  private region: string;

  constructor(config: {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.bucketName = config.bucketName;
    this.region = config.region;

    this.s3 = new AWSS3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async uploadImage(
    imageBuffer: ArrayBuffer,
    originalFilename: string,
    contentType: string = 'image/jpeg'
  ): Promise<S3UploadResult> {
    console.log(`☁️ Uploading image to S3: ${originalFilename}`);

    // Generate content hash for cache busting
    const contentHash = generateImageHash(Buffer.from(imageBuffer));
    const extension = originalFilename.split('.').pop() || 'jpg';
    const s3Key = `images/${contentHash}.${extension}`;

    // Create S3 URL
    const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: Buffer.from(imageBuffer),
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000', // 1 year cache
        Metadata: {
          'original-filename': originalFilename,
          'content-hash': contentHash,
        },
      });

      await this.s3.send(uploadCommand);

      console.log(`✅ Uploaded to S3: ${s3Key}`);

      return {
        s3Key,
        s3Url,
        contentHash,
        fileSize: imageBuffer.byteLength,
      };
    } catch (error) {
      console.error(`❌ S3 upload failed:`, error);
      throw error;
    }
  }

  // Generate secure pre-signed URL (recommended approach)
  async getSecureImageUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    return await getSignedUrl(this.s3, command, { expiresIn });
  }
}