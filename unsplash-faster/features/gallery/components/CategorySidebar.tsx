'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Category {
  id: number
  name: string
  slug: string
  imageCount: number
}

interface CategorySidebarProps {
  categories: Category[]
  totalImages: number
}

export function CategorySidebar({ categories, totalImages }: CategorySidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category')

  const handleCategoryClick = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (categorySlug) {
      params.set('category', categorySlug)
    } else {
      params.delete('category')
    }

    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>

      <nav className="space-y-2">
        {/* All Images */}
        <button
          onClick={() => handleCategoryClick(null)}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
            !selectedCategory
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">All Images</span>
            <span className="text-sm text-gray-500">{totalImages}</span>
          </div>
        </button>

        {/* Individual Categories */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.slug)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              selectedCategory === category.slug
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{category.name}</span>
              <span className="text-sm text-gray-500">{category.imageCount}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* Category Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Statistics</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total Categories:</span>
            <span className="font-medium">{categories.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Images:</span>
            <span className="font-medium">{totalImages}</span>
          </div>
        </div>
      </div>
    </div>
  )
}