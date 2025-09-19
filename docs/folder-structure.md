# FasterSite Folder Structure

This document explains the feature-based folder structure implemented in FasterSite, designed for scalability, maintainability, and clear separation of concerns.

## 📁 Overview

FasterSite uses a **feature-based architecture** where related components, logic, and utilities are grouped together by feature rather than by file type. This approach makes it easier to:

- **Find related code** - Everything for a feature is in one place
- **Scale the application** - Add new features without cluttering the root
- **Maintain boundaries** - Clear separation between different functionalities
- **Collaborate effectively** - Teams can work on features independently

## 🏗️ Complete Folder Structure

```
faster-site/
├── app/                          # Next.js App Router (pages, layouts, API routes)
│   ├── api/                      # API endpoints
│   │   ├── prefetch-images/      # Image prefetching API
│   │   └── search/               # Search API
│   ├── image/[id]/               # Dynamic image detail pages
│   │   └── page.tsx             # Image detail page component
│   ├── search/                   # Search feature pages
│   │   ├── loading.tsx          # Search loading UI
│   │   └── page.tsx             # Search results page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout component
│   ├── loading.tsx              # Global loading UI
│   └── page.tsx                 # Home page (gallery)
├── components/                   # Global reusable components
│   └── custom/                   # Custom-built components
│       ├── OptimizedLink.tsx    # Smart prefetching link component
│       └── ViewFullSizeButton.tsx # Image view button
├── features/                     # Feature-based organization
│   ├── gallery/                 # Image gallery feature
│   │   ├── components/          # Gallery-specific UI components
│   │   │   ├── CategorySidebar.tsx  # Category navigation sidebar
│   │   │   ├── ImageCard.tsx        # Individual image card
│   │   │   └── ImageGrid.tsx        # Grid layout for images
│   │   ├── lib/                 # Gallery business logic
│   │   └── utils/               # Gallery utility functions
│   ├── performance/             # Performance optimization feature
│   │   ├── components/          # Performance-related components
│   │   │   ├── BackNavigationPreloader.tsx    # Back navigation optimization
│   │   │   ├── GalleryCacheWarmer.tsx         # Proactive cache warming
│   │   │   └── GalleryScrollRestoration.tsx   # Scroll position memory
│   │   ├── lib/                 # Performance optimization logic
│   │   │   └── cache.ts         # Advanced caching utilities
│   │   └── utils/               # Performance utility functions
│   └── search/                  # Search functionality feature
│       ├── components/          # Search-specific UI components
│       │   └── SearchBar.tsx    # Search input component
│       ├── lib/                 # Search business logic
│       └── utils/               # Search utility functions
├── lib/                         # External service integrations
│   ├── db.ts                    # Database connection and configuration
│   ├── queries.ts               # Database queries with caching
│   ├── s3.ts                    # AWS S3 service integration
│   └── schema.ts                # Database schema definitions
├── data/                        # Static and mock data
│   └── mockData.ts              # Sample data for development/testing
├── utils/                       # Global utility functions
├── schemas/                     # Shared validation schemas
├── docs/                        # Documentation
│   ├── research/                # Research and analysis documents
│   │   └── nextfaster-findings.md  # NextFaster analysis
│   ├── folder-structure.md      # This document
│   └── performance.md           # Performance implementation guide
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

## 🎯 Feature Organization Strategy

### **1. Gallery Feature** (`features/gallery/`)

**Purpose:** Everything related to browsing and displaying images

**Components:**
- `CategorySidebar.tsx` - Category navigation and filtering
- `ImageCard.tsx` - Individual image display with smart loading
- `ImageGrid.tsx` - Responsive grid layout for images

**Why grouped together:** These components work together to create the gallery browsing experience. They share common concerns like image loading, responsive layout, and user interaction patterns.

### **2. Performance Feature** (`features/performance/`)

**Purpose:** Advanced performance optimizations that make FasterSite unique

**Components:**
- `BackNavigationPreloader.tsx` - Position-aware gallery prefetching
- `GalleryCacheWarmer.tsx` - Proactive next page and category warming
- `GalleryScrollRestoration.tsx` - Seamless scroll position memory

**Lib:**
- `cache.ts` - Multi-layer caching wrapper (NextFaster pattern)

**Why separate feature:** Performance optimizations are a key differentiator for this project. Grouping them makes it easy to understand, maintain, and showcase the performance techniques.

### **3. Search Feature** (`features/search/`)

**Purpose:** Search functionality across images and categories

**Components:**
- `SearchBar.tsx` - Search input with real-time suggestions

**Why separate feature:** Search has its own UI patterns, API endpoints, and business logic. Can be extended with features like filters, advanced search, search history, etc.

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
├── ImageCard.tsx
├── ImageGrid.tsx
├── CategorySidebar.tsx
├── SearchBar.tsx
├── BackNavigationPreloader.tsx
├── GalleryCacheWarmer.tsx
└── GalleryScrollRestoration.tsx

lib/
├── cache.ts
├── queries.ts
├── db.ts
└── schema.ts
```

### **After (Feature-Based)**
```
features/
├── gallery/components/
│   ├── ImageCard.tsx
│   ├── ImageGrid.tsx
│   └── CategorySidebar.tsx
├── search/components/
│   └── SearchBar.tsx
└── performance/
    ├── components/
    │   ├── BackNavigationPreloader.tsx
    │   ├── GalleryCacheWarmer.tsx
    │   └── GalleryScrollRestoration.tsx
    └── lib/
        └── cache.ts

components/custom/
└── OptimizedLink.tsx

lib/
├── queries.ts
├── db.ts
└── schema.ts
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