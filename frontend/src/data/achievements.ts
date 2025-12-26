import { FaBookOpen, FaClock, FaHeart, FaComment, FaFire, FaCrown, FaGhost, FaBolt, FaCoffee } from 'react-icons/fa';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'reading' | 'time' | 'social' | 'collection' | 'secret';
  threshold: number;
  secret?: boolean;
  rarity: AchievementRarity; // 🟢 جديد: درجة الندرة
}

// ألوان الندرة لاستخدامها في التصميم
export const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600',
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // --- القراءة ---
  { id: 'read_1', title: 'بداية الرحلة', description: 'قرأت أول فصل لك', icon: FaBookOpen, category: 'reading', threshold: 1, rarity: 'common' },
  { id: 'read_10', title: 'دودة كتب', description: 'قرأت 10 فصول', icon: FaBookOpen, category: 'reading', threshold: 10, rarity: 'common' },
  { id: 'read_50', title: 'قارئ نهم', description: 'قرأت 50 فصلاً', icon: FaBookOpen, category: 'reading', threshold: 50, rarity: 'rare' },
  { id: 'read_100', title: 'أوتاكو حقيقي', description: 'قرأت 100 فصل', icon: FaFire, category: 'reading', threshold: 100, rarity: 'epic' },
  { id: 'read_1000', title: 'ملك القراصنة', description: 'قرأت 1000 فصل! أنت أسطورة!', icon: FaCrown, category: 'reading', threshold: 1000, rarity: 'legendary' },

  // --- الوقت ---
  { id: 'time_1m', title: 'نظرة سريعة', description: 'قضيت دقيقة واحدة', icon: FaClock, category: 'time', threshold: 60, rarity: 'common' },
  { id: 'time_1h', title: 'تركيز عالي', description: 'ساعة من القراءة', icon: FaCoffee, category: 'time', threshold: 3600, rarity: 'rare' },
  { id: 'time_24h', title: 'مدمن مانجا', description: 'يوم كامل في الموقع', icon: FaClock, category: 'time', threshold: 86400, rarity: 'epic' },

  // --- المفضلة والاجتماعية ---
  { id: 'fav_10', title: 'جامع التحف', description: '10 مانجات في المفضلة', icon: FaHeart, category: 'collection', threshold: 10, rarity: 'rare' },
  { id: 'com_100', title: 'المؤثر', description: '100 تعليق', icon: FaBolt, category: 'social', threshold: 100, rarity: 'epic' },

  // --- أسرار ---
  { id: 'secret_night', title: 'ساهر الليل', description: 'قراءة بعد 3 فجراً', icon: FaGhost, category: 'secret', threshold: 1, secret: true, rarity: 'epic' },
];
export const getAchievementById = (id: string) => ALL_ACHIEVEMENTS.find(a => a.id === id);