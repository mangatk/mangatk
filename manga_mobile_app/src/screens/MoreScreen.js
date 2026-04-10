import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Switch, Dimensions, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
// استيراد الدالة لجلب التحديثات الحقيقية
import { getLatestUpdates } from '../services/api';

const { width } = Dimensions.get('window');

export default function MoreScreen() {
  const { isDark, colors, toggleTheme } = useContext(ThemeContext);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  
  // حالات التحديثات والجرس (عمل حقيقي بدون نظام Push)
  const [showUpdates, setShowUpdates] = useState(false);
  const [newChapters, setNewChapters] = useState([]);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  const navigation = useNavigation();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadUserData();
      loadFavorites();
      checkNewChapters(); // فحص السيرفر فور الدخول للصفحة
    }
  }, [isFocused]);

  const loadUserData = async () => {
    const userInfo = await AsyncStorage.getItem('user_info');
    const savedImage = await AsyncStorage.getItem('profile_image');
    if (userInfo) setUser(JSON.parse(userInfo));
    if (savedImage) setProfileImage(savedImage);
  };

  const loadFavorites = async () => {
    const savedFavs = await AsyncStorage.getItem('favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    else setFavorites([]);
  };

  // دالة فحص التحديثات الحقيقية من السيرفر
  const checkNewChapters = async () => {
    try {
      // طلب البيانات من API موقعك
      const updates = await getLatestUpdates(); 
      
      if (updates && updates.length > 0) {
        setNewChapters(updates);
        setHasNewUpdates(true); // تفعيل النقطة الحمراء لأن السيرفر لديه جديد
      } else {
        setNewChapters([]);
        setHasNewUpdates(false);
      }
    } catch (e) {
      console.log("فشل جلب التحديثات من السيرفر:", e);
      setHasNewUpdates(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setProfileImage(uri);
      await AsyncStorage.setItem('profile_image', uri);
    }
  };

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد؟ سيتم حذف البيانات المحلية.", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: async () => {
        await AsyncStorage.multiRemove(['user_token', 'user_info', 'favorites', 'reading_history', 'library_data', 'profile_image']);
        setUser(null); setProfileImage(null); setFavorites([]);
        Alert.alert("تم", "تم تسجيل الخروج بنجاح");
      }}
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* زر الجرس وزر تسجيل الخروج */}
      <View style={styles.topHeader}>
        <TouchableOpacity 
           onPress={() => { 
             setShowUpdates(true); 
             setHasNewUpdates(false); // إخفاء النقطة الحمراء بعد المشاهدة
           }} 
           style={styles.bellContainer}
        >
          <View>
            <MaterialCommunityIcons 
              name={hasNewUpdates ? "bell-badge" : "bell-outline"} 
              color={hasNewUpdates ? colors.primary : colors.text} 
              size={28} 
            />
            {/* إظهار نقطة صغيرة إضافية إذا كان هناك جديد لزيادة الانتباه */}
            {hasNewUpdates && <View style={styles.notifBadge} />}
          </View>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity style={styles.logoutTopBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" color="#FF5252" size={28} />
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={user ? pickImage : null} style={styles.avatarContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImg} />
          ) : (
            <MaterialCommunityIcons name="account-circle" color={colors.primary} size={90} />
          )}
          {user && (
            <View style={styles.editIcon}>
              <MaterialCommunityIcons name="camera" color="#fff" size={16} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.userName, { color: colors.text }]}>{user ? user.name : "زائر MangaTK"}</Text>
        {user && <Text style={{color: colors.subText, fontSize: 12}}>{user.email}</Text>}
        {!user && (
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('Login')}>
            <Text style={{color: '#fff', fontWeight: 'bold'}}>تسجيل الدخول / إنشاء حساب</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('History')}>
          <View style={styles.menuRight}>
            <MaterialCommunityIcons name="history" color="#2196F3" size={26} />
            <Text style={[styles.menuText, { color: colors.text }]}>سجل القراءة</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => setShowFavorites(!showFavorites)}>
          <View style={styles.menuRight}>
            <MaterialCommunityIcons name="heart" color={colors.primary} size={26} />
            <Text style={[styles.menuText, { color: colors.text }]}>قائمة المفضلة ({favorites.length})</Text>
          </View>
        </TouchableOpacity>

        {showFavorites && (
          <View style={styles.favListContainer}>
            <FlatList
              data={favorites}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.favCard} onPress={() => navigation.navigate('Details', { mangaId: item.id })}>
                  <Image source={{ uri: item.imageUrl }} style={[styles.favImage, { borderColor: colors.border }]} />
                  <Text style={[styles.favTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{color: colors.subText, textAlign: 'center', width: width-40}}>لا توجد مفضلة</Text>}
            />
          </View>
        )}

        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => navigation.navigate('Achievements')}>
          <View style={styles.menuRight}>
            <MaterialCommunityIcons name="trophy" color="#FFD700" size={26} />
            <Text style={[styles.menuText, { color: colors.text }]}>الإنجازات والجوائز</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <View style={styles.menuRight}>
            <MaterialCommunityIcons name="theme-light-dark" color={colors.text} size={26} />
            <Text style={[styles.menuText, { color: colors.text }]}>الوضع الليلي</Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: "#767577", true: colors.primary }} />
        </View>
      </View>

      <Modal visible={showUpdates} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>التحديثات الأخيرة</Text>
            <FlatList
              data={newChapters}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.updateItem}>
                  <Text style={[styles.updateTitle, { color: colors.text }]}>{item.manga_title || item.title}</Text>
                  <Text style={{ color: colors.primary }}>فصل جديد: {item.chapter_number || item.chapter}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={{color: colors.subText, textAlign: 'center', marginTop: 20}}>لا توجد فصول جديدة حالياً</Text>}
            />
            <TouchableOpacity onPress={() => setShowUpdates(false)} style={styles.closeBtn}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50 },
  bellContainer: { padding: 5, position: 'relative' },
  notifBadge: { position: 'absolute', top: 5, right: 5, width: 10, height: 10, backgroundColor: 'red', borderRadius: 5, borderWidth: 1, borderColor: 'white' },
  logoutTopBtn: { zIndex: 10 },
  profileSection: { alignItems: 'center', paddingVertical: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 8 },
  avatarContainer: { position: 'relative', marginBottom: 10 },
  profileImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#fff' },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4CAF50', padding: 5, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 20, fontWeight: 'bold' },
  loginBtn: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 25, marginTop: 15 },
  menuSection: { paddingHorizontal: 20, marginTop: 15 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 0.5 },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, marginLeft: 15, textAlign: 'right' },
  favListContainer: { paddingVertical: 15, height: 180 },
  favCard: { width: 100, marginRight: 15, alignItems: 'center' },
  favImage: { width: 90, height: 130, borderRadius: 10, borderWidth: 1 },
  favTitle: { fontSize: 11, marginTop: 5, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  updateItem: { paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#ccc', alignItems: 'flex-end' },
  updateTitle: { fontWeight: 'bold', fontSize: 15 },
  closeBtn: { backgroundColor: '#FF5252', padding: 15, borderRadius: 15, marginTop: 20, alignItems: 'center' }
});