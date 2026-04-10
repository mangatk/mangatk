import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, TextInput, Modal, RefreshControl } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { getMangaList, searchManga, getGenres } from '../services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // حالة التحديث عند السحب
  const [searchQuery, setSearchQuery] = useState('');
  
  const [categories, setCategories] = useState([{ id: 'all', name: 'All', slug: '' }]);
  const [activeCategory, setActiveCategory] = useState(''); 
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // دالة التحديث عند السحب لأسفل
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, []);

  const fetchInitialData = async () => {
    // لا نظهر الـ loader العادي إذا كان التحديث عبر السحب
    if (!refreshing) setLoading(true); 
    try {
      const genresData = await getGenres();
      if (genresData && genresData.length > 0) {
        setCategories([{ id: 'all', name: 'All', slug: '' }, ...genresData]);
      }
      const mangaData = await getMangaList(1, '');
      setMangas(mangaData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMangaByCategory();
  }, [activeCategory]);

  const loadMangaByCategory = async (sortType = '') => {
    setLoading(true);
    try {
      const data = await getMangaList(1, activeCategory, sortType);
      setMangas(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      try {
        const res = await searchManga(text);
        setMangas(res);
      } catch (e) { console.error(e); }
    } else {
      loadMangaByCategory();
    }
  };

  const handleSort = (type) => {
    setShowSortMenu(false);
    if (type === 'newest') loadMangaByCategory('created_at');
    if (type === 'oldest') loadMangaByCategory('-created_at');
    if (type === 'alpha') {
      const sortedData = [...mangas].sort((a, b) => a.title.localeCompare(b.title));
      setMangas(sortedData);
    }
  };

  if (loading && mangas.length === 0) return (
    <View style={[styles.loader, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setShowSortMenu(true)} style={styles.menuIcon}>
          <MaterialCommunityIcons name="dots-vertical" color={colors.text} size={28} />
        </TouchableOpacity>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" color={colors.subText} size={20} />
          <TextInput 
            style={[styles.input, { color: colors.text }]} 
            placeholder="Search..." 
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <View style={{ height: 50, marginBottom: 5 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => setActiveCategory(item.slug)}
              style={[
                styles.categoryBtn, 
                { 
                  backgroundColor: activeCategory === item.slug ? colors.primary : colors.card,
                  borderColor: colors.border
                }
              ]}
            >
              <Text style={[styles.categoryText, { color: activeCategory === item.slug ? '#fff' : colors.text }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={mangas}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        // إضافة خاصية التحديث عند السحب هنا
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.card, { backgroundColor: colors.card }]} 
            onPress={() => navigation.navigate('Details', { mangaId: item.id, mangaTitle: item.title })}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.overlay}>
               <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showSortMenu} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowSortMenu(false)}>
          <View style={[styles.sortMenu, { backgroundColor: colors.card }]}>
            <Text style={[styles.menuHeader, {color: colors.subText}]}>Sort by:</Text>
            <TouchableOpacity style={styles.menuOption} onPress={() => handleSort('newest')}>
              <Text style={[styles.menuOptionText, {color: colors.text}]}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={() => handleSort('oldest')}>
              <Text style={[styles.menuOptionText, {color: colors.text}]}>Oldest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={() => handleSort('alpha')}>
              <Text style={[styles.menuOptionText, {color: colors.text}]}>A-Z</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ... الستايلات كما هي بدون تغيير ...
const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  menuIcon: { padding: 10, marginTop: 5 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', marginVertical: 15, marginRight: 15, marginLeft: 5, borderRadius: 12, height: 45, borderWidth: 1, paddingHorizontal: 10 },
  input: { flex: 1, textAlign: 'right', paddingRight: 10 },
  categoryBtn: { paddingHorizontal: 20, height: 35, borderRadius: 20, justifyContent: 'center', marginHorizontal: 5, borderWidth: 1 },
  categoryText: { fontWeight: 'bold', fontSize: 13 },
  card: { width: width / 2 - 20, height: 260, margin: 10, borderRadius: 15, overflow: 'hidden', elevation: 5 },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.6)', padding: 10 },
  title: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sortMenu: { position: 'absolute', top: 60, left: 20, width: 150, padding: 10, borderRadius: 10, elevation: 10 },
  menuHeader: { fontSize: 12, marginBottom: 10, textAlign: 'right' },
  menuOption: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#444' },
  menuOptionText: { fontSize: 16, textAlign: 'right' }
});