import { NextRequest, NextResponse } from 'next/server';
import { getImage, getImages, getCategories } from '@/lib/queries';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const imageId = searchParams.get('id');
        const category = searchParams.get('category');
        const related = searchParams.get('related') === 'true';
        const type = searchParams.get('type'); // 'categories' for getting category list
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        console.log(`📡 Prefetch API called - imageId: ${imageId}, category: ${category}, related: ${related}, type: ${type}, page: ${page}`);

        // If requesting categories list
        if (type === 'categories') {
            console.log(`📂 Getting categories list for cache warming`);
            const categories = await getCategories();
            return NextResponse.json({
                categories,
                prefetched: true,
                timestamp: Date.now()
            });
        }

        // If specific image ID is requested
        if (imageId) {
            const image = await getImage(parseInt(imageId));
            if (!image) {
                return NextResponse.json({ error: 'Image not found' }, { status: 404 });
            }

            let relatedImages = [];

            // If related images are requested, get 3 images from same category
            if (related && image.categoryId) {
                console.log(`🔗 Getting related images for category ${image.categoryId}`);
                const allCategoryImages = await getImages(); // Get all images
                relatedImages = allCategoryImages
                    .filter(img => img.categoryId === image.categoryId && img.id !== image.id)
                    .slice(0, 3); // Get first 3 related images
            }

            console.log(`✅ Prefetch response: 1 main image + ${relatedImages.length} related`);

            return NextResponse.json({
                image,
                related: relatedImages,
                prefetched: true,
                timestamp: Date.now()
            });
        }

        // If category is requested, get images from that category with pagination
        if (category) {
            console.log(`📂 Getting prefetch images for category: ${category}, page: ${page}`);
            const categoryImages = await getImages(category);

            // Calculate pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedImages = categoryImages.slice(startIndex, endIndex);

            console.log(`✅ Category prefetch: ${paginatedImages.length} images (page ${page})`);

            return NextResponse.json({
                images: paginatedImages,
                category,
                page,
                totalImages: categoryImages.length,
                totalPages: Math.ceil(categoryImages.length / limit),
                prefetched: true,
                timestamp: Date.now()
            });
        }

        // Default: return images with pagination for general prefetching
        console.log(`🌟 Getting default prefetch images, page: ${page}`);
        const allImages = await getImages();

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedImages = allImages.slice(startIndex, endIndex);

        console.log(`✅ Default prefetch: ${paginatedImages.length} images (page ${page})`);

        return NextResponse.json({
            images: paginatedImages,
            page,
            totalImages: allImages.length,
            totalPages: Math.ceil(allImages.length / limit),
            prefetched: true,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Prefetch API error:', error);
        return NextResponse.json({
            error: 'Prefetch failed',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        }, { status: 500 });
    }
}

// Add OPTIONS for CORS if needed
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}