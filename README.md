# FasterSite - Ultra-Fast Image Gallery

A high-performance image gallery built with Next.js 15, implementing advanced optimization techniques inspired by NextFaster and enhanced for image-heavy applications.

## 🚀 Performance Features

This project implements cutting-edge performance optimizations to deliver lightning-fast navigation and seamless user experience:

### **Core Next.js 15 Optimizations**
- ✅ **Partial Prerendering (PPR)** - Static shells served from edge with dynamic content streaming
- ✅ **React Compiler** - Automatic component optimization without manual memoization
- ✅ **CSS Inlining** - Eliminates render-blocking CSS for faster LCP

### **Advanced Caching Architecture**
- ✅ **Multi-layer caching** - Database (2h), Component (request-level), Edge (CDN), Browser
- ✅ **S3 URL caching** - 48-hour signed URL cache with automatic cleanup
- ✅ **Smart deduplication** - Prevents re-downloading the same resources

### **Intelligent Image Loading**
- ✅ **Position-aware prefetching** - Prefetches images around current position, not just first N images
- ✅ **Strategic loading** - First 6 images get priority, first 12 get higher quality
- ✅ **Intersection Observer** - Dynamic rootMargin based on screen size and grid layout
- ✅ **Conditional loading** - Eager/lazy loading based on viewport position

### **Smart Prefetching System**
- ✅ **Mouse proximity prefetching** - Triggers when cursor gets within 150px of links
- ✅ **Back navigation optimization** - Prefetches gallery images when viewing image details
- ✅ **Gallery cache warming** - Proactively loads next page and other categories
- ✅ **API-driven prefetching** - Dedicated endpoints for efficient resource prefetching

### **Enhanced User Experience**
- ✅ **Scroll restoration** - Returns to exact gallery position after viewing image details
- ✅ **Seamless navigation** - Instant route transitions with onMouseDown optimization
- ✅ **Position memory** - Remembers where you were in the gallery across navigation

## 🔬 Research & Implementation

Our optimization approach was heavily inspired by **NextFaster**, but enhanced specifically for image gallery applications:

**📖 See detailed analysis:** [NextFaster Research Findings](docs/research/nextfaster-findings.md)

### **What We Implemented from NextFaster:**
- Custom cache wrapper combining Next.js cache with React cache
- Smart prefetching with intersection observers and mouse events
- Image optimization with conditional loading strategies
- PPR + React Compiler for edge performance

### **Our Enhancements Beyond NextFaster:**
- **Position-aware prefetching** - NextFaster prefetches first N images; we prefetch around current position
- **Scroll restoration** - NextFaster doesn't handle gallery scroll position; we restore exact position
- **Gallery-specific optimizations** - Enhanced for image-heavy applications vs NextFaster's product catalog
- **Smart external vs internal detection** - Reduces redundant prefetching for internal navigation

## 🏗️ Architecture

### **Database Schema**
```typescript
Categories: id, slug, name, created_at
Images: id, title, description, s3_key, s3_url, category_id, width, height, file_size
```

### **Key Components**
- `OptimizedLink` - Smart prefetching with mouse proximity detection
- `BackNavigationPreloader` - Position-aware gallery prefetching
- `GalleryCacheWarmer` - Proactive next page and category warming
- `GalleryScrollRestoration` - Seamless position memory

### **API Routes**
- `/api/prefetch-images` - Paginated image prefetching with category support
- `/api/search` - Full-text search with PostgreSQL tsquery

## 📊 Performance Results

### **Build Output**
```
Route (app)                             Size  First Load JS  Revalidate
┌ ◐ /                                 3.08 kB         127 kB
├ ◐ /image/[id]                       1.95 kB         126 kB          2h
└ ◐ /search                           3.44 kB         128 kB

◐ (Partial Prerender) - Static HTML with dynamic server-streamed content
```

### **Key Metrics**
- **Static shells** served from edge (~20-50ms vs 200-500ms)
- **Position-aware prefetching** - 15 images around current position
- **Cache hit rates** - High across multiple layers
- **Scroll restoration** - Returns to exact pixel position

## 🛠️ Tech Stack

- **Framework:** Next.js 15.6.0-canary (PPR + React Compiler)
- **Database:** PostgreSQL with Drizzle ORM
- **Storage:** AWS S3 with pre-signed URLs
- **Styling:** Tailwind CSS with CSS inlining
- **Language:** TypeScript

## 🚀 Getting Started

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd faster-site
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.local
   # Add your DATABASE_URL and S3 credentials
   ```

3. **Database setup:**
   ```bash
   npm run db:push      # Create tables
   npm run db:seed      # Seed with sample data
   ```

4. **Development:**
   ```bash
   npm run dev          # Start development server
   ```

## 📈 Performance Testing

### **Browser DevTools Testing**
1. **Network Tab** - Watch staggered image prefetching and cache hits
2. **Console Logs** - Rich debugging with position-aware prefetching logs
3. **Performance Tab** - Measure navigation speed improvements

### **Key Test Scenarios**
- **Cold start** - New user experience with PPR static shells
- **Gallery browsing** - Intersection observer and prefetching in action
- **Back navigation** - Position restoration and cached image loading
- **External links** - Direct image page access with gallery prefetching

### **Console Logs to Watch**
```
📍 Current image at position 38/59
🎯 Prefetching 15 images around position (32-47)
🚀 Cache hit for image.jpg (47h remaining)
🔄 Restoring scroll to position 38 (image ID: 175)
```

## 🔧 Configuration

### **Image Optimization**
- **Cache TTL:** 1 year for production, 0 for development
- **Formats:** WebP, AVIF with fallbacks
- **Quality:** 80 for priority images, 65 for prefetched
- **Loading:** Strategic eager/lazy based on position

### **Prefetching Settings**
- **Proximity threshold:** 150px for regular links, 200px for back buttons
- **Prefetch radius:** ±7 images around current position (15 total)
- **Cache warming:** Next page + 3 other categories after 2-5 seconds

## 📖 Documentation

- [NextFaster Research Findings](docs/research/nextfaster-findings.md) - Detailed analysis of NextFaster's techniques
- [Performance Implementation Guide](docs/performance.md) - **Complete code examples and implementation details**
- [Database Schema](docs/database.md) - Complete schema documentation

## 🤝 Contributing

This project demonstrates advanced Next.js performance optimization techniques. Contributions that enhance performance or add new optimization strategies are welcome.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Built with performance in mind** 🚀 **Inspired by NextFaster** ⚡ **Enhanced for image galleries** 🖼️
