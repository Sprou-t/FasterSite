import Link from 'next/link';
import type { Category } from '@/lib/schema';

interface CategorySidebarProps {
  categories: Category[];
  currentCategory?: string;
  className?: string;
}

export function CategorySidebar({
  categories,
  currentCategory,
  className = ''
}: CategorySidebarProps) {
  return (
      <aside className={`w-64 bg-white border-r border-gray-200 ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
        <nav className="space-y-2">
          {/* All Images Link */}
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              !currentCategory
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All Images
          </Link>

          {/* Category Links */}
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/?category=${category.slug}`}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                currentCategory === category.slug
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}