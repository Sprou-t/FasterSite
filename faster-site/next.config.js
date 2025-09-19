/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        ppr: true,           // Now enabled with canary version
        inlineCss: true,
        reactCompiler: true, // Now enabled with canary version
    },
    // Basic image optimization settings
    images: {
        minimumCacheTTL: process.env.NODE_ENV === 'development' ? 0 : 31536000,  // No cache in dev, 1 year in prod
        formats: ['image/webp', 'image/avif'],
        qualities: [50, 65, 75, 80, 90, 95],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'faster-site.s3.ap-southeast-1.amazonaws.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '*.s3.*.amazonaws.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },

    // Basic optimizations
    poweredByHeader: false,
    compress: true,
};

module.exports = nextConfig;