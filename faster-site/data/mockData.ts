import { Category, Image } from '@/lib/schema';

// Mock categories
export const mockCategories: Category[] = [
  { id: 1, slug: 'nature', name: 'Nature', createdAt: new Date() },
  { id: 2, slug: 'architecture', name: 'Architecture', createdAt: new Date() },
  { id: 3, slug: 'technology', name: 'Technology', createdAt: new Date() },
  { id: 4, slug: 'business', name: 'Business', createdAt: new Date() },
  { id: 5, slug: 'art', name: 'Art', createdAt: new Date() },
];

// Template for your images - YOU WILL REPLACE THIS with actual data
export const imageTemplate = {
  filename: 'example.jpg',    // The actual filename you provide
  title: 'Beautiful Example', // Title you provide
  description: 'A beautiful example image showcasing...', // Description you provide
  category: 'nature',         // Category slug you choose
  width: 1200,               // Image width
  height: 800,               // Image height
};

// Mock images - This will be populated with your actual images
// For now, it creates 100 mock entries by duplicating your 5 images
export function generateMockImages(userImages: typeof imageTemplate[]): Image[] {
  const images: Image[] = [];
  let idCounter = 1;

  // Generate 100 images by repeating your 5 images
  for (let i = 0; i < 100; i++) {
    const baseImageIndex = i % userImages.length;
    const baseImage = userImages[baseImageIndex];
    const hash = `mock${idCounter.toString().padStart(3, '0')}`;

    // Use the actual filename from your base images
    const imageUrl = `/images/${baseImage.filename}`;

    images.push({
      id: idCounter++,
      title: `${baseImage.title} ${Math.floor(i / userImages.length) + 1}`,
      description: baseImage.description,
      s3Key: `images/${baseImage.filename}`,
      s3Url: imageUrl,
      categoryId: mockCategories.find(cat => cat.slug === baseImage.category)?.id || 1,
      width: baseImage.width,
      height: baseImage.height,
      fileSize: 150000, // ~150KB average
      contentHash: hash,
      createdAt: new Date(),
      unsplashId: null,
      unsplashUserId: null,
      unsplashLikes: 0,
    });
  }

  return images;
}

// Auto-generated metadata for your 5 images
export const userProvidedImages: typeof imageTemplate[] = [
  {
    filename: 'mock001.jpg', // Your first image
    title: 'Misty Mountain Peak',
    description: 'A dramatic mountain peak shrouded in morning mist, creating an ethereal landscape that captures the raw beauty of nature.',
    category: 'nature',
    width: 1200,
    height: 800,
  },
  {
    filename: 'mock002.jpg', // Your second image
    title: 'Modern Glass Architecture',
    description: 'Contemporary glass building with clean lines and geometric patterns, showcasing innovative architectural design and urban aesthetics.',
    category: 'architecture',
    width: 1600,
    height: 900,
  },
  {
    filename: 'mock003.png', // Your third image
    title: 'Digital Innovation Hub',
    description: 'A sleek technology workspace featuring cutting-edge devices and modern interfaces, representing the future of digital innovation.',
    category: 'technology',
    width: 1400,
    height: 900,
  },
  {
    filename: 'mock004.png', // Your fourth image (corrected extension)
    title: 'Executive Business Meeting',
    description: 'Professional business environment with a focus on collaboration, strategic planning, and corporate leadership dynamics.',
    category: 'business',
    width: 1300,
    height: 850,
  },
  {
    filename: 'mock005.jpg', // Your fifth image (corrected extension)
    title: 'Abstract Digital Art',
    description: 'A vibrant digital composition featuring bold colors and flowing forms, blending contemporary art with modern design principles.',
    category: 'art',
    width: 1100,
    height: 1100,
  },
];

export const mockImages = generateMockImages(userProvidedImages);