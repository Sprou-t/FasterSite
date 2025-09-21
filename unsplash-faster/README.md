# Unsplash Gallery with NextFaster Optimization

This is a high-performance image gallery application built with [Next.js](https://nextjs.org) and optimized using [NextFaster](https://github.com/vercel/next.js/tree/canary/examples/with-nextfaster) patterns for instant navigation and image loading.

## Key Features

- **Instant Navigation**: Route prefetching for zero JavaScript download time
- **Image Precaching**: Intelligent image prefetching based on viewport visibility
- **Optimized Performance**: NextFaster-inspired optimization techniques
- **Responsive Design**: Mobile-first responsive image gallery
- **Database Integration**: PostgreSQL with Drizzle ORM

## Architecture Documentation

📚 **[Complete Prefetching Architecture Guide](../docs/PREFETCHING_ARCHITECTURE.md)**
- Detailed explanation of the prefetching and caching system
- Step-by-step data flow from gallery to image page
- Performance benefits and implementation details

🔍 **[OptimizedLink Component Line-by-Line](../docs/OPTIMIZED_LINK_EXPLAINED.md)**
- Complete breakdown of the OptimizedLink component
- Function-by-function explanation with code examples
- Understanding intersection observers and caching logic

📁 **[Project Structure Guide](../docs/folder-structure.md)**
- Feature-based architecture organization
- Component and library organization patterns

🚀 **[Performance Optimization Techniques](../docs/optimization-techniques.md)**
- Multi-layer caching strategies
- Image loading and prefetching optimizations

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
