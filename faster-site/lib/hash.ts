import { createHash } from 'crypto';

// Generate content-based hash for cache busting
export function generateImageHash(content: string | Buffer): string {
  return createHash('md5').update(content).digest('hex').substring(0, 8);
}

// Generate unique image URL with hash
export function generateImageUrl(filename: string, hash: string): string {
  const ext = filename.split('.').pop();
  return `/images/${hash}.${ext}`;
}