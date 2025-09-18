# FasterSite - Optimized Image Gallery

A high-performance image gallery built with Next.js 15, featuring NextFaster optimization techniques.

## 🚀 Features

- **NextFaster Performance Techniques**:
  - Smart prefetching with 150px cursor distance detection
  - Long-term image caching (1 year) with content hashing
  - Strategic eager/lazy loading based on position
  - React + Next.js cache wrapper for deduplication

- **Optimized Image Loading**:
  - First 6 images get priority loading
  - First 12 images load eagerly, rest load lazily
  - Quality optimization (80% for above-fold, 65% for below-fold)
  - WebP/AVIF format support

- **Performance Features**:
  - Partial Prerendering (PPR) ready
  - CSS inlining optimization
  - Suspense boundaries for progressive loading
  - Static generation with ISR

## 📁 Project Structure

```
faster-site/
├── app/                    # Next.js App Router
│   ├── image/[id]/        # Individual image pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Homepage
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── CategorySidebar.tsx
│   ├── ImageCard.tsx
│   ├── ImageGrid.tsx
│   └── OptimizedLink.tsx # Smart prefetching component
├── lib/                  # Utilities and data layer
│   ├── cache.ts         # NextFaster cache wrapper
│   ├── db.ts           # Database connection
│   ├── hash.ts         # Content hashing utilities
│   ├── queries.ts      # Cached queries
│   └── schema.ts       # Database schema
└── data/               # Mock data
    └── mockData.ts     # Categories and images
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd faster-site
npm install
```

### 2. Place Your Images
Put your 5 images in `public/images/` with these exact names:
- `mock001.jpg` (or .jpeg, .png)
- `mock002.jpg`
- `mock003.png`
- `mock004.jpeg`
- `mock005.png`

### 3. Start Development
```bash
npm run dev
```

Visit http://localhost:3000 to see your optimized gallery!

## 🔧 Performance Optimizations Implemented

### 1. Smart Prefetching (`OptimizedLink.tsx`)
- Prefetches when cursor is within 150px of link
- Immediate prefetch on hover
- Mouse-down navigation for instant response
- Deduplication to prevent duplicate requests

### 2. Strategic Image Loading (`ImageCard.tsx`)
- First 6 images: `priority={true}` + `loading="eager"` + `quality={80}`
- Next 6 images: `loading="eager"` + `quality={80}`
- Remaining images: `loading="lazy"` + `quality={65}`

### 3. Caching Strategy (`cache.ts`, `queries.ts`)
- Database queries cached for 2 hours
- React cache wrapper prevents duplicate calls within request
- Mock data simulates real database with artificial delays

### 4. Layout Optimizations
- Suspense boundaries for progressive loading
- Loading skeletons to prevent layout shift
- CSS optimizations with GPU acceleration

## 📊 Mock Data Structure

The app generates 100 images by duplicating your 5 images across these categories:
- Nature (20 images)
- Architecture (20 images)
- Technology (20 images)
- Business (20 images)
- Art (20 images)

## 🚀 Next Steps (Phase 2 & 3)

1. **Deploy to Vercel**
2. **Set up NeonDB + Drizzle**
3. **Configure AWS S3**
4. **Integrate Unsplash API**
5. **Implement content hashing for S3**

## 🎯 Performance Targets

- **First Contentful Paint**: < 1.2s
- **Largest Contentful Paint**: < 2.5s
- **Interaction to Next Paint**: < 200ms
- **Cumulative Layout Shift**: < 0.1