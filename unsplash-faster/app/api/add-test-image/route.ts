import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, categories } from '@/lib/schema';

export async function POST() {
  try {
    // Get first category
    const existingCategories = await db.select().from(categories).limit(1);
    const categoryId = existingCategories[0]?.id || 1;

    // Insert local image
    const newImage = await db.insert(images).values({
      title: 'Local Test Image',
      description: 'Test image stored locally to verify caching behavior',
      imageUrl: '/images/test-image.jpg', // Local path
      originalUrl: '/images/test-image.jpg',
      categoryId: categoryId,
      width: 800,
      height: 600,
      fileSize: 50000,
      unsplashId: 'local-test-' + Date.now(),
      unsplashUserId: 'local',
      unsplashUserName: 'Local User',
      unsplashLikes: 42,
    }).returning();

    return NextResponse.json({
      success: true,
      image: newImage[0],
      message: 'Local image added successfully!'
    });

  } catch (error) {
    console.error('Error adding local image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add image'
    }, { status: 500 });
  }
}