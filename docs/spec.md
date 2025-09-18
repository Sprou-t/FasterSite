# FasterSite - Optimized Image Gallery Specification

## Overview
A high-performance image gallery website with two main pages:
1. **Homepage**: Grid of images with category sidebar filtering
2. **Individual Image Page**: Detailed view of selected image

## Core Features

### Pages Structure
- **Homepage (`/`)**: Image grid + category sidebar
- **Category Pages (`/?category=nature`)**: Filtered homepage view
- **Image Detail (`/image/[id]`)**: Individual image with metadata

### Performance Optimizations (NextFaster-inspired)
- **Database Caching**: 2-hour cache with React + Next.js unstable_cache wrapper
- **Image Caching**: Long-term caching (1 year) with content-based hashing
- **Smart Prefetching**: Hover-based prefetching (NO viewport prefetching)
- **Next.js 15 Features**: PPR, CSS inlining, React Compiler
- **Image Loading**: Strategic eager/lazy loading based on position

### Technical Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Database**: NeonDB (PostgreSQL) + Drizzle ORM
- **Image Storage**: AWS S3
- **Hosting**: Vercel
- **Data Source**: Unsplash API (post-deployment)

## Development Phases

### Phase 1: Mock Data Development
- Build app with placeholder images and hardcoded data
- Implement all performance optimizations
- Test locally with mock content

### Phase 2: Deployment & Infrastructure
- Deploy to Vercel
- Set up NeonDB database
- Configure AWS S3 bucket
- Set up domain and SSL

### Phase 3: Unsplash Integration
- Implement Unsplash API integration
- Create data ingestion script (Unsplash → S3 → NeonDB)
- Populate database with real content

## Image Strategy

### Content-Based Hashing
```javascript
// Generate unique URLs for cache busting
const hash = generateHash(imageBuffer);
const s3Key = `images/${hash}.jpg`;
const imageUrl = `https://s3-bucket.com/images/${hash}.jpg`;
```

### Caching Strategy
- **S3 Images**: 1-year cache with content hashing
- **Database Queries**: 2-hour cache with Next.js unstable_cache
- **Route Prefetching**: Hover-triggered only

### Prefetching Rules
- **NO viewport prefetching** (cost optimization)
- **Hover prefetching**: When cursor approaches link
- **Distance threshold**: TBD (100px-200px from link)

## Data Model

### Categories Table
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Images Table
```sql
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  s3_key VARCHAR(500) NOT NULL,
  s3_url VARCHAR(1000) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  content_hash VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  -- Unsplash fields (added in Phase 3)
  unsplash_id VARCHAR(50),
  unsplash_user_id VARCHAR(50),
  unsplash_likes INTEGER DEFAULT 0
);
```

## Mock Data Requirements
- **Image Location**: TBD by user
- **Categories**: TBD by user
- **Image Metadata**: TBD by user
- **Format Requirements**: TBD by user
