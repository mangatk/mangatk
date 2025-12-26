'use client';
import { useEffect, useState } from 'react';
import { Achievement, RARITY_COLORS } from '@/data/achievements';
import confetti from 'canvas-confetti';
import { FaTimes, FaStar } from 'react-icons/fa';


export function AchievementToast({ achievement, onClose }: { achievement: Achievement | null, onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      // تأثير صوتي بسيط (اختياري)
      const audio = new Audio('/sounds/achievement.mp3'); // تأكد من وجود ملف صوتي
      audio.volume = 0.5;
      audio.play().catch(() => {}); // تجاهل الخطأ إذا لم يكن هناك ملف

      // إطلاق قصاصات الزينة (Confetti)
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: achievement.rarity === 'legendary' ? ['#FFD700', '#FFA500'] : undefined
      });
    } else {
      setVisible(false);
    }
  }, [achievement]);

  if (!achievement || !visible) return null;

  const bgGradient = RARITY_COLORS[achievement.rarity];
  const glowColor = achievement.rarity === 'legendary' ? 'shadow-yellow-500/50' : 
                    achievement.rarity === 'epic' ? 'shadow-purple-500/50' : 
                    achievement.rarity === 'rare' ? 'shadow-blue-500/50' : 'shadow-gray-500/50';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="relative transform animate-in zoom-in-50 slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()} // منع الإغلاق عند النقر على البطاقة
      >
        {/* أشعة خلفية تدور (فقط للنادر والأسطوري) */}
        {(achievement.rarity === 'legendary' || achievement.rarity === 'epic') && (
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-30 pointer-events-none rounded-full blur-3xl"></div>
        )}

        {/* جسم البطاقة */}
        <div className={`w-[90vw] max-w-md bg-gray-900 border-2 border-white/10 rounded-3xl p-8 text-center shadow-2xl ${glowColor} relative overflow-hidden`}>
          
          {/* شريط علوي ملون حسب الندرة */}
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${bgGradient}`} />

          {/* الأيقونة العائمة */}
          <div className="mx-auto mb-6 relative">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center text-5xl text-white shadow-lg mx-auto relative z-10 animate-bounce`}>
              <achievement.icon />
            </div>
            {/* هالة خلف الأيقونة */}
            <div className={`absolute inset-0 bg-gradient-to-r ${bgGradient} blur-2xl opacity-60 z-0`}></div>
          </div>

          {/* النصوص */}
          <h2 className="text-yellow-400 font-black tracking-widest text-sm uppercase mb-2 animate-pulse">
            {achievement.rarity === 'legendary' ? '✨ إنجاز أسطوري! ✨' : 
             achievement.rarity === 'epic' ? '⚡ إنجاز ملحمي! ⚡' : 'إنجاز جديد تم فتحه!'}
          </h2>
          
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4 drop-shadow-md">
            {achievement.title}
          </h1>
          
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            {achievement.description}
          </p>

          {/* زر "تجهيز اللقب" الفوري */}
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => {
                 // سنقوم هنا بحفظ اللقب وتفعيله فوراً
                 localStorage.setItem('equipped_title', achievement.id);
                 alert(`تم وضع اللقب "${achievement.title}" تحت اسمك!`);
                 onClose();
              }}
              className={`px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${bgGradient} hover:scale-105 transition-transform shadow-lg`}
            >
              وضع كلقب
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 transition-colors"
            >
              إغلاق
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}