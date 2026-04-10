import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserAchievements } from '../services/api'; 
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// تعريف ألوان الندرة كما في الموقع
const RARITY_COLORS = {
  legendary: ['#FFD700', '#FFA500'], // ذهبي
  epic: ['#A020F0', '#EE82EE'],      // بنفسجي
  rare: ['#0000FF', '#00BFFF'],      // أزرق
  common: ['#808080', '#A9A9A9'],    // رمادي
};

export default function AchievementsScreen() {
  const { colors, isDark } = useContext(ThemeContext);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const fetchAchievements = async () => {
    try {
      const data = await getUserAchievements();
      setAchievements(data || []); 
    } catch (e) {
      console.error("Error in screen:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchAchievements();
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAchievements();
  };

  const renderAchievement = ({ item }) => {
    // التأكد من جلب البيانات سواء كانت داخل كائن achievement أو مباشرة
    const info = item.achievement || item;
    const isUnlocked = item.is_unlocked;
    const rarity = info.rarity || 'common';
    const mainColor = RARITY_COLORS[rarity][0];

    return (
      <View style={[
        styles.card, 
        { 
          backgroundColor: colors.card,
          borderColor: isUnlocked ? mainColor : colors.border,
          borderWidth: isUnlocked ? 2 : 1,
          opacity: isUnlocked ? 1 : 0.7
        }
      ]}>
        {/* أيقونة الإنجاز أو القفل */}
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isUnlocked ? mainColor : '#333' }
        ]}>
          <MaterialCommunityIcons 
            name={isUnlocked ? (info.icon || "trophy") : "lock"} 
            color={isUnlocked ? "#fff" : "#888"} 
            size={30} 
          />
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>
              {info.title || info.name || "إنجاز غامض"}
            </Text>
            {isUnlocked && (
              <MaterialCommunityIcons name="check-decagram" color="#4CAF50" size={18} />
            )}
          </View>
          
          <Text style={[styles.description, { color: colors.subText }]} numberOfLines={2}>
            {info.description || "قم بإنهاء المهام لفتح هذا الإنجاز"}
          </Text>

          {isUnlocked && item.earned_at && (
            <Text style={[styles.date, { color: mainColor }]}>
              تم الفتح: {new Date(item.earned_at).toLocaleDateString('ar-YE')}
            </Text>
          )}

          {!isUnlocked && (
            <View style={styles.lockedBadge}>
              <Text style={styles.lockedText}>مغلق</Text>
            </View>
          )}
        </View>

        {/* شريط جانبي صغير للندرة */}
        <View style={[styles.rarityBar, { backgroundColor: mainColor }]} />
      </View>
    );
  };

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>إنجازاتك</Text>
      <FlatList 
        data={achievements}
        keyExtractor={item => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        renderItem={renderAchievement}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.centered}>
             <MaterialCommunityIcons name="trophy-broken" size={80} color={colors.subText} />
             <Text style={{color: colors.subText, textAlign: 'center', marginTop: 10}}>
                لا توجد بيانات حالياً. ابدأ القراءة لفتح الإنجازات!
             </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'right' },
  card: { 
    flexDirection: 'row-reverse', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 15, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15
  },
  infoContainer: { flex: 1, alignItems: 'flex-end' },
  titleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  description: { fontSize: 14, textAlign: 'right', lineHeight: 20 },
  date: { fontSize: 11, marginTop: 8, fontWeight: 'bold' },
  lockedBadge: { 
    marginTop: 8, 
    backgroundColor: '#333', 
    paddingHorizontal: 10, 
    paddingVertical: 2, 
    borderRadius: 10 
  },
  lockedText: { color: '#fff', fontSize: 10 },
  rarityBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5
  }
});