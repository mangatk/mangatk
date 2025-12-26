// 'use client';

// import { useState } from 'react';
// import { categories } from '@/data/mockManga';
// import { SearchBar } from './SearchBar';
// import { FaFilter, FaSortAmountDown, FaLayerGroup } from 'react-icons/fa';

// // 1. تعريف شكل البيانات التي يرسلها هذا المكون للأب
// interface FilterData {
//   status?: string;
//   categories?: string[];
//   query?: string;
// }

// // 2. تعريف الخصائص (Props) التي يستقبلها المكون
// interface FilterSectionProps {
//   onFilter: (filters: FilterData) => void;
//   onSort: (sortType: string) => void;
// }

// export function FilterSection({ onFilter, onSort }: FilterSectionProps) {
//   const [status, setStatus] = useState<string>('All');
//   const [order, setOrder] = useState<string>('Name');

//   // تعريف أن هذه المصفوفة ستحتوي على نصوص (Strings) فقط
//   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
//   const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

//   const handleFilter = () => {
//     onFilter({ status, categories: selectedCategories });
//     setShowCategoryDropdown(false);
//   };

//   const handleCategoryToggle = (cat: string) => {
//     setSelectedCategories(prev => 
//       prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
//     );
//   };

//   const statuses = ['All', 'Completed', 'Ongoing'];
//   const orders = ['Name', 'Latest Chapter', 'Most Popular', 'Rating'];

//   return (
//     <section className="py-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 relative z-40">
//       <div className="container mx-auto px-4">
//         <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 gap-4">

//           {/* Search Bar */}
//           <div className="w-full md:w-auto flex-1 max-w-lg relative z-30">
//              <SearchBar onSearch={(q: string) => onFilter({ query: q })} />
//           </div>

//           <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto relative z-20">

//             {/* Status Dropdown */}
//             <div className="relative">
//               <select 
//                 value={status} 
//                 onChange={(e) => setStatus(e.target.value)}
//                 className="appearance-none pl-4 pr-8 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-900 dark:text-gray-100"
//               >
//                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
//               </select>
//               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
//                 <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
//               </div>
//             </div>

//             {/* Categories Dropdown */}
//             <div className="relative">
//               <button 
//                 onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
//                 className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-medium transition-all ${
//                   showCategoryDropdown || selectedCategories.length > 0
//                   ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
//                   : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 text-gray-700 dark:text-gray-200'
//                 }`}
//               >
//                 <FaLayerGroup />
//                 <span>Categories</span>
//                 {selectedCategories.length > 0 && (
//                   <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 rounded-full">{selectedCategories.length}</span>
//                 )}
//               </button>

//               {/* القائمة المنسدلة */}
//               {showCategoryDropdown && (
//                 <>
//                   <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)}></div>
//                   <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl z-50 p-2 max-h-80 overflow-y-auto custom-scrollbar">
//                     <div className="mb-2 px-2 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Select Categories</div>
//                     <div className="grid grid-cols-1 gap-1">
//                       {categories.map(cat => (
//                         <label key={cat} className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
//                           <input
//                             type="checkbox"
//                             checked={selectedCategories.includes(cat)}
//                             onChange={() => handleCategoryToggle(cat)}
//                             className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
//                           />
//                           <span className="text-sm text-gray-700 dark:text-gray-200">{cat}</span>
//                         </label>
//                       ))}
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>

//             {/* Sort Dropdown */}
//             <div className="relative">
//                <select 
//                 value={order} 
//                 onChange={(e) => onSort(e.target.value)}
//                 className="appearance-none pl-4 pr-8 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-gray-900 dark:text-gray-100"
//               >
//                 {orders.map(o => <option key={o} value={o}>{o}</option>)}
//                </select>
//                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
//                  <FaSortAmountDown className="text-xs" />
//                </div>
//             </div>

//             {/* Filter Button */}
//             <button 
//               onClick={handleFilter} 
//               className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/30"
//               title="Apply Filters"
//             >
//               <FaFilter />
//             </button>
//           </div>

//        </div>
//       </div>
//     </section>
//   );
// }
'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { FaFilter, FaSortAmountDown, FaLayerGroup } from 'react-icons/fa';
import { getGenres } from '@/services/api'; // استيراد دالة جلب الأنواع

interface FilterData {
  status?: string;
  categories?: string[]; // في هذا السياق، الـ Categories هي الـ Genres
  query?: string;
  sortBy?: string;
}

interface FilterSectionProps {
  onFilter: (filters: FilterData) => void;
  onSort: (sortType: string) => void;
}

export function FilterSection({ onFilter, onSort }: FilterSectionProps) {
  const [status, setStatus] = useState<string>('All');
  const [order, setOrder] = useState<string>('Name');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // حالة لتخزين الأنواع القادمة من السيرفر
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  // جلب الأنواع عند تحميل الصفحة
  useEffect(() => {
    async function fetchGenres() {
      try {
        const genres = await getGenres();
        setAvailableGenres(genres);
      } catch (error) {
        console.error("Failed to load genres", error);
      }
    }
    fetchGenres();
  }, []);

  const handleFilter = () => {
    onFilter({ status, categories: selectedGenres, sortBy: order });
    setShowCategoryDropdown(false);
  };

  const handleCategoryToggle = (cat: string) => {
    setSelectedGenres(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const statuses = ['All', 'Completed', 'Ongoing'];
  const orders = ['Name', 'Latest Chapter', 'Most Popular', 'Rating'];

  return (
    <section className="py-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 relative z-40">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">

          <div className="w-full md:w-auto flex-1 max-w-lg relative z-30">
            <SearchBar onSearch={(q: string) => onFilter({ query: q })} />
          </div>

          <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto relative z-20">

            {/* Status Dropdown */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="pl-4 pr-8 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Genres Dropdown (Dynamic) */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-sm font-medium ${showCategoryDropdown || selectedGenres.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
              >
                <FaLayerGroup />
                <span>الأنواع</span>
                {selectedGenres.length > 0 && <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 rounded-full">{selectedGenres.length}</span>}
              </button>

              {showCategoryDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl z-50 p-2 max-h-80 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 gap-1">
                      {availableGenres.length > 0 ? availableGenres.map(cat => (
                        <label key={cat} className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(cat)}
                            onChange={() => handleCategoryToggle(cat)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 mr-3"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{cat}</span>
                        </label>
                      )) : <div className="p-2 text-center text-sm text-gray-500">جاري التحميل...</div>}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sort Dropdown */}
            <select
              value={order}
              onChange={(e) => {
                setOrder(e.target.value);
                onSort(e.target.value); // Trigger sort immediately
              }}
              className="pl-4 pr-8 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100"
            >
              {orders.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            <button onClick={handleFilter} className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-lg">
              <FaFilter />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
