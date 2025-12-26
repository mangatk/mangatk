// 'use client';
// import { useState } from 'react';
// import { categories } from '../data/mockManga';

// export function CategoryNav({ onCategorySelect }) {
//   const [selectedRating, setSelectedRating] = useState(null);

//   const ratings = [1, 2, 3, 4, 5];

//   return (
//     <section className="py-6 bg-gray-50 dark:bg-gray-800" data-aos="fade-up">
//       <div className="container mx-auto px-4">
//         <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
//           {/* Categories Scroll */}
//           <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
//             {categories.map(category => (
//               <button
//                 key={category}
//                 onClick={() => onCategorySelect(category)}
//                 className="whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
//                 aria-label={`Filter by ${category}`}
//               >
//                 {category}
//               </button>
//             ))}
//           </div>

//           {/* Rating Filter */}
//           {/* <div className="flex items-center space-x-2">
//             <span className="text-gray-600 dark:text-gray-300">Rating:</span>
//             <div className="flex space-x-1">
//               {ratings.map(rating => (
//                 <button
//                   key={rating}
//                   onClick={() => {
//                     setSelectedRating(rating === selectedRating ? null : rating);
//                     onCategorySelect(rating, 'rating');
//                   }}
//                   className={`w-8 h-8 rounded-full border flex items-center justify-center ${
//                     selectedRating === rating 
//                       ? 'bg-blue-600 text-white border-blue-600' 
//                       : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
//                   }`}
//                   aria-label={`Rating ${rating} stars`}
//                 >
//                   {rating}
//                 </button>
//               ))}
//             </div>
//           </div> */}
//         </div>
//       </div>
//     </section>
//   );
// }
'use client';
import { useState, useEffect } from 'react';
import { getCategories } from '@/services/api'; // استدعاء API

export function CategoryNav({ onCategorySelect }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCats() {
      try {
        const data = await getCategories();
        setCategories(data); // data should be array of slugs
      } catch (err) {
        console.error("Error fetching categories", err);
      }
    }
    fetchCats();
  }, []);

  return (
    <section className="py-6 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
          {categories.length > 0 ? categories.map(category => (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className="whitespace-nowrap px-4 py-2 bg-white dark:bg-gray-700 rounded-lg border hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors capitalize"
            >
              {category.replace(/-/g, ' ')}
            </button>
          )) : <div className="text-gray-500 text-sm">جاري تحميل التصنيفات...</div>}
        </div>
      </div>
    </section>
  );
}
