/** @type {import('next').NextConfig} */
const nextConfig = {
    // Basic image optimization settings
    images: {
        minimumCacheTTL: 31536000,  // 1 year cache for images
        formats: ['image/webp', 'image/avif'],
        qualities: [50, 65, 75, 80, 90, 95],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'faster-site.s3.ap-southeast-1.amazonaws.com',
                port: '',
                pathname: '/images/**',
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