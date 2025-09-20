import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { images, categories } from '@/lib/schema';

export async function POST() {
  try {
    // Get first category
    const existingCategories = await db.select().from(categories).limit(1);
    const categoryId = existingCategories[0]?.id || 1;

    // Insert local PNG image
    const newImage = await db.insert(images).values({
      title: 'Local PNG Test Image',
      description: 'PNG test image stored locally to verify caching behavior',
      imageUrl: '/images/test-image.png', // Local PNG path
      originalUrl: '/images/test-image.png',
      categoryId: categoryId,
      width: 800,
      height: 600,
      fileSize: 100000, // PNG typically larger
      unsplashId: 'local-png-test-' + Date.now(),
      unsplashUserId: 'local',
      unsplashUserName: 'Local PNG User',
      unsplashLikes: 99,
    }).returning();

    return NextResponse.json({
      success: true,
      image: newImage[0],
      message: 'Local PNG image added successfully!'
    });

  } catch (error) {
    console.error('Error adding local PNG image:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add PNG image'
    }, { status: 500 });
  }
}