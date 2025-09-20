/** @type {import('next').NextConfig} */
const nextConfig = {
    // NextFaster experimental features - EXACT IMPLEMENTATION
    experimental: {
        ppr: true,              // Partial Prerendering for edge performance
        inlineCss: true,        // CSS inlining for faster loading (critical for Tailwind)
        reactCompiler: true,    // React Compiler optimizations
        optimizePackageImports: ['lucide-react', '@heroicons/react'], // Tree shake icon libraries
    },

    // NextFaster image optimization settings - OPTIMIZED FOR PERFORMANCE
    // for images that uses Next Image component
    images: {
        minimumCacheTTL: 31536000,  // 1 year cache for images (like NextFaster)
        formats: ['image/webp', 'image/avif'], // Modern formats for better compression
        qualities: [50, 60, 75, 80, 85, 90], // Optimized quality ladder for better compression
        deviceSizes: [320, 480, 640, 768, 1024, 1280, 1920], // Responsive breakpoints optimized for grid
        imageSizes: [64, 96, 128, 256, 320, 384, 480, 640], // Grid sizes optimized for your layout
        dangerouslyAllowSVG: false,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
        ],
    },

    // Add cache headers for better performance and bfcache compatibility
    async headers() {
        return [
            // Optimize images for bfcache
            {
                source: '/_next/image(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable', // 1 year cache like NextFaster
                    },
                ],
            },
            {
                source: '/images/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // JavaScript and CSS for bfcache optimization
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            // HTML pages for bfcache compatibility
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate', // Allow bfcache but revalidate
                    },
                ],
            },
        ];
    },

    // Basic optimizations (NextFaster pattern)
    poweredByHeader: false,
    compress: true,
    eslint: {
        ignoreDuringBuilds: true, // Temporarily ignore ESLint for build testing
    },
    typescript: {
        ignoreBuildErrors: true, // Temporarily ignore TypeScript for build testing
    },

    // Performance optimizations to reduce unused JavaScript
    webpack: (config, { dev, isServer }) => {
        // Production optimizations only
        if (!dev && !isServer) {
            // Enable aggressive tree shaking
            config.optimization.usedExports = true;
            config.optimization.sideEffects = false;

            // Split chunks more aggressively to reduce unused code
            config.optimization.splitChunks = {
                ...config.optimization.splitChunks,
                chunks: 'all',
                minSize: 20000,
                maxSize: 244000,
                cacheGroups: {
                    ...config.optimization.splitChunks.cacheGroups,
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10,
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: 5,
                        reuseExistingChunk: true,
                    },
                },
            };
        }
        return config;
    },
};

module.exports = nextConfig;