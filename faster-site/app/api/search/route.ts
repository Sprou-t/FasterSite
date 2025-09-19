import { NextRequest, NextResponse } from 'next/server';
import { searchImages } from '@/lib/queries';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        console.log(`🔍 Search API called with query: "${query}"`);

        if (!query || query.trim().length === 0) {
            console.log('❌ No search query provided');
            return NextResponse.json({
                results: [],
                message: 'Search query required'
            }, { status: 400 });
        }

        // Rate limiting check (basic)
        if (query.length > 100) {
            console.log('❌ Search query too long');
            return NextResponse.json({
                results: [],
                message: 'Search query too long'
            }, { status: 400 });
        }

        console.log(`🔍 Executing search for: "${query}"`);
        const results = await searchImages(query);

        console.log(`✅ Search completed: ${results.length} results found`);

        return NextResponse.json({
            results,
            query,
            count: results.length
        });

    } catch (error) {
        console.error('❌ Search API error:', error);
        return NextResponse.json({
            results: [],
            message: 'Search failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
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