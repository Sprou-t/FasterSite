/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic image optimization settings
  images: {
    minimumCacheTTL: 31536000,  // 1 year cache for images
    formats: ['image/webp', 'image/avif'],
    qualities: [50, 65, 75, 80, 90, 95],
  },

  // Basic optimizations
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;