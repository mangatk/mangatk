import React from 'react';
import Link from 'next/link';
interface SectionTitleProps {
  title: string;
  description?: string;
  viewAllLink?: string;
}

export function SectionTitle({ title, description, viewAllLink }: SectionTitleProps) {
  return (
    <div className="flex justify-between items-end mb-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {viewAllLink && (
        <Link 
          href={viewAllLink}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl text-sm font-medium group"
        >
          <span>عرض الكل</span>
          <svg 
            className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}