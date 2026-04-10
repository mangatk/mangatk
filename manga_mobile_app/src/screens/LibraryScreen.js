import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LibraryScreen() {
  const { colors } = useContext(ThemeContext);
  const [library, setLibrary] = useState({});
  const [tabs, setTabs] = useState(['الافتراضي']);
  const [activeTab, setActiveTab] = useState('الافتراضي');
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadLibrary();
  }, [isFocused]);

  const loadLibrary = async () => {
    try {
      const savedLib = await AsyncStorage.getItem('library_data');
      const savedTabs = await AsyncStorage.getItem('user_tabs');
      
      if (savedLib) setLibrary(JSON.parse(savedLib));
      if (savedTabs) {
        setTabs(JSON.parse(savedTabs));
      } else {
        // تأكيد وجود القسم الافتراضي إذا لم توجد تابات
        setTabs(['الافتراضي']);
      }
    } catch (error) {
      console.error("خطأ في تحميل المكتبة:", error);
    }
  };

  const removeMangaFromTab = (mangaId, mangaTitle) => {
    Alert.alert(
      "إزالة مانهوا",
      `هل تريد إزالة "${mangaTitle}" من قسم "${activeTab}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إزالة",
          style: "destructive",
          onPress: async () => {
            let newLib = { ...library };
            newLib[activeTab] = newLib[activeTab].filter(item => item.id !== mangaId);
            setLibrary(newLib);
            await AsyncStorage.setItem('library_data', JSON.stringify(newLib));
          }
        }
      ]
    );
  };

  const deleteTab = () => {
    if (activeTab === 'الافتراضي') {
      Alert.alert("تنبيه", "لا يمكن حذف القسم الافتراضي.");
      return;
    }

    const mangaCount = library[activeTab]?.length || 0;
    const message = mangaCount > 0 
      ? `هذا القسم يحتوي على ${mangaCount} مانهوا، هل تريد حذف القسم وكل ما فيه؟`
      : `هل أنت متأكد من حذف قسم "${activeTab}"؟`;

    Alert.alert(
      "حذف القسم",
      message,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف الكل",
          style: "destructive",
          onPress: async () => {
            let newTabs = tabs.filter(t => t !== activeTab);
            let newLib = { ...library };
            delete newLib[activeTab];

            setTabs(newTabs);
            setLibrary(newLib);
            setActiveTab('الافتراضي');

            await AsyncStorage.setItem('user_tabs', JSON.stringify(newTabs));
            await AsyncStorage.setItem('library_data', JSON.stringify(newLib));
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* شريط الأقسام */}
      <View style={[styles.headerTabRow, { borderBottomColor: colors.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tabs}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === item && { borderBottomColor: colors.primary }]}
              onPress={() => setActiveTab(item)}
            >
              <Text style={[styles.tabText, { color: activeTab === item ? colors.primary : colors.subText }]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
        {activeTab !== 'الافتراضي' && (
          <TouchableOpacity onPress={deleteTab} style={styles.deleteTabBtn}>
            <MaterialCommunityIcons name="delete-outline" color={colors.primary} size={24} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={library[activeTab] || []}
        numColumns={3}
        keyExtractor={(item, index) => String(item.id || index)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('Details', { mangaId: item.id, mangaTitle: item.title })}
            onLongPress={() => removeMangaFromTab(item.id, item.title)}
          >
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: item.imageUrl || item.image }} // محاولة قراءة كلا المسميين
                style={[styles.image, { borderColor: colors.border }]} 
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={[styles.removeBadge, { backgroundColor: colors.card }]} 
                onPress={() => removeMangaFromTab(item.id, item.title)}
              >
                <MaterialCommunityIcons name="close-circle" color={colors.primary} size={22} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="library-variant" size={80} color={colors.subText} style={{opacity: 0.5}} />
            <Text style={[styles.emptyText, { color: colors.subText }]}>هذا القسم فارغ حالياً</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTabRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, marginBottom: 5 },
  tabItem: { paddingHorizontal: 20, height: 50, justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontWeight: 'bold', fontSize: 14 },
  deleteTabBtn: { paddingHorizontal: 15, justifyContent: 'center' },
  listContent: { padding: 5 },
  card: { width: (width - 40) / 3, margin: 5, marginBottom: 15 },
  imageWrapper: { position: 'relative', width: '100%', height: 160 },
  image: { width: '100%', height: '100%', borderRadius: 10, borderWidth: 1 },
  removeBadge: { position: 'absolute', top: -8, right: -8, borderRadius: 12, elevation: 5 },
  cardTitle: { fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', marginTop: 15, fontSize: 16 }
});