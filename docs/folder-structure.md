# FasterSite Folder Structure

This document explains the feature-based folder structure implemented in FasterSite (unsplash-faster), designed for scalability, maintainability, and clear separation of concerns.

## 📁 Overview

FasterSite uses a **feature-based architecture** where related components, logic, and utilities are grouped together by feature rather than by file type. This approach makes it easier to:

- **Find related code** - Everything for a feature is in one place
- **Scale the application** - Add new features without cluttering the root
- **Maintain boundaries** - Clear separation between different functionalities
- **Collaborate effectively** - Teams can work on features independently

## 🏗️ Complete Folder Structure

```
unsplash-faster/
├── app/                          # Next.js App Router (pages, layouts, API routes)
│   ├── api/                      # API endpoints
│   │   ├── add-png-image/        # PNG image addition API
│   │   ├── add-test-image/       # Test image API
│   │   └── prefetch-images/      # Image prefetching API
│   ├── image/[id]/               # Dynamic image detail pages
│   │   └── page.tsx             # Image detail page component
│   ├── search/                   # Search feature pages
│   │   └── page.tsx             # Search results page
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Home page (gallery with sidebar)
├── components/                   # Global reusable components
│   └── custom/                   # Custom-built components
│       └── OptimizedLink.tsx    # Smart prefetching link component
├── features/                     # Feature-based organization
│   ├── gallery/                 # Image gallery feature
│   │   └── components/          # Gallery-specific UI components
│   │       ├── CategorySidebar.tsx  # Category navigation sidebar
│   │       └── ImageGrid.tsx        # Grid layout for images
│   ├── performance/             # Performance optimization feature
│   │   └── lib/                 # Performance optimization logic
│   │       └── cache.ts         # Advanced caching utilities with NextFaster patterns
│   └── search/                  # Search functionality feature
│       └── components/          # Search-specific UI components
│           └── SearchBar.tsx    # Search input component
├── lib/                         # External service integrations & database
│   ├── db.ts                    # Database connection and configuration (Drizzle + Neon)
│   ├── queries.ts               # Database queries with caching
│   ├── schema.ts                # Database schema definitions
│   └── unsplash.ts              # Unsplash API integration
├── scripts/                     # Data ingestion and management scripts
│   ├── add-architecture-images.ts  # Script to add architecture category images
│   ├── add-categories.ts           # Script to add categories to database
│   ├── add-local-image.ts          # Script to add local images
│   └── ingest-images.ts            # Main image ingestion script
├── data/                        # Static and mock data (created as needed)
├── utils/                       # Global utility functions (created as needed)
├── schemas/                     # Shared validation schemas (created as needed)
├── docs/                        # Documentation
│   ├── research/                # Research and analysis documents
│   │   └── nextfaster-findings.md  # NextFaster analysis
│   ├── folder-structure.md      # This document
│   └── performance.md           # Performance implementation guide
├── drizzle/                     # Database migrations and schema
├── public/                      # Static assets
├── next.config.js              # Next.js configuration with NextFaster optimizations
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration (if present)
├── tsconfig.json               # TypeScript configuration
├── drizzle.config.ts           # Drizzle ORM configuration
└── README.md                   # Project documentation
```

## 🎯 Feature Organization Strategy

### **1. Gallery Feature** (`features/gallery/`)

**Purpose:** Everything related to browsing and displaying images

**Components:**
- `CategorySidebar.tsx` - Category navigation sidebar with image counts and URL-based filtering
- `ImageGrid.tsx` - Responsive grid layout with optimized image loading and lazy loading

**Why grouped together:** These components work together to create the gallery browsing experience. They share common concerns like image loading, responsive layout, category filtering, and user interaction patterns.

### **2. Performance Feature** (`features/performance/`)

**Purpose:** Advanced performance optimizations that make FasterSite unique

**Lib:**
- `cache.ts` - Multi-layer caching wrapper implementing NextFaster patterns with `unstable_cache`

**Why separate feature:** Performance optimizations are a key differentiator for this project. The caching utilities implement advanced patterns like 2-hour revalidation, dynamic cache keys, and optimized query patterns.

### **3. Search Feature** (`features/search/`)

**Purpose:** Search functionality across images with PostgreSQL full-text search

**Components:**
- `SearchBar.tsx` - Search input component for image search

**Why separate feature:** Search has its own UI patterns, API endpoints, and business logic. Uses PostgreSQL full-text search with hybrid ILIKE fallback for robust search capabilities.

## 📂 Folder Type Conventions

### **`components/`** - UI Components
- **Input:** Props and user interactions
- **Output:** Rendered UI elements
- **Responsibilities:** Presentation, user interaction, client-side state
- **Example:** `ImageCard.tsx` displays an image with loading states

### **`lib/`** - Business Logic
- **Input:** Data and parameters
- **Output:** Processed data or side effects
- **Responsibilities:** Business rules, data processing, external API calls
- **Example:** `cache.ts` handles multi-layer caching logic

### **`utils/`** - Pure Utility Functions
- **Input:** Simple parameters
- **Output:** Computed values
- **Responsibilities:** Pure functions, data transformation, helpers
- **Example:** Image resizing, URL formatting, date utilities

## 🔗 Import Path Conventions

### **Within Same Feature**
```typescript
// ✅ Relative imports within same feature
import { ImageCard } from './ImageCard';
import { ImageGrid } from './ImageGrid';
```

### **Cross-Feature Imports**
```typescript
// ✅ Absolute imports for cross-feature dependencies
import { OptimizedLink } from '@/components/custom/OptimizedLink';
import { GalleryCacheWarmer } from '@/features/performance/components/GalleryCacheWarmer';
```

### **External Services**
```typescript
// ✅ Absolute imports for shared services
import { getImages } from '@/lib/queries';
import { unstable_cache } from '@/features/performance/lib/cache';
```

## 🔄 Migration from Previous Structure

### **Before (Type-Based)**
```
components/
├── ImageGrid.tsx
├── CategorySidebar.tsx
├── SearchBar.tsx
└── OptimizedLink.tsx

lib/
├── cache.ts
├── queries.ts
├── db.ts
├── schema.ts
└── unsplash.ts
```

### **After (Feature-Based)**
```
features/
├── gallery/components/
│   ├── ImageGrid.tsx
│   └── CategorySidebar.tsx
├── search/components/
│   └── SearchBar.tsx
└── performance/lib/
    └── cache.ts

components/custom/
└── OptimizedLink.tsx

lib/
├── queries.ts      # Now imports cache from features/performance/lib/cache
├── db.ts
├── schema.ts
└── unsplash.ts
```

## 📈 Benefits of This Structure

### **1. Clear Feature Boundaries**
- Gallery components stay together
- Performance optimizations are easily identifiable
- Search functionality is self-contained

### **2. Scalability**
- Add new features without cluttering existing folders
- Easy to understand what each feature does
- Teams can work on features independently

### **3. Maintenance**
- Related code is co-located
- Easier to find dependencies
- Simpler to refactor feature-specific code

### **4. Performance Focus**
- Performance optimizations are highlighted as a separate feature
- Easy to showcase FasterSite's unique performance techniques
- Clear separation from regular UI components

## 🚀 Adding New Features

When adding a new feature, follow this structure:

```
features/
└── new-feature/
    ├── components/          # UI components specific to this feature
    │   ├── FeatureComponent.tsx
    │   └── FeatureWidget.tsx
    ├── lib/                 # Business logic for this feature
    │   ├── feature-api.ts
    │   └── feature-logic.ts
    ├── utils/               # Utility functions for this feature
    │   └── feature-utils.ts
    └── types/               # TypeScript types specific to this feature
        └── feature-types.ts
```

### **Guidelines:**
1. **Keep features self-contained** - Minimize dependencies between features
2. **Use absolute imports** - For cross-feature dependencies
3. **Group related functionality** - Components that work together should be in the same feature
4. **Consider business domains** - Features should align with business capabilities

## 🔧 Development Workflow

### **Working on Gallery Feature**
```bash
# All gallery-related files are in one place
features/gallery/
├── components/   # Edit UI components
├── lib/         # Add business logic
└── utils/       # Add utilities
```

### **Working on Performance Optimizations**
```bash
# All performance code is grouped together
features/performance/
├── components/   # Performance-related UI
├── lib/         # Caching and optimization logic
└── utils/       # Performance utilities
```

### **Adding Global Components**
```bash
# Reusable components go in components/
components/custom/
└── NewGlobalComponent.tsx
```

This structure makes FasterSite more maintainable, scalable, and easier to understand for new developers joining the project.