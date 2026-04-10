import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

export default function TranslatorScreen() {
  const { colors, isDark } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handlePickImage = () => {
    Alert.alert("اختيار صورة", "هنا يتم فتح معرض الصور لاختيار صفحة المانهوا.");
    // مستقبلاً سنستخدم expo-image-picker هنا
    setSelectedImage('https://via.placeholder.com/300x500'); 
  };

  const handleStartTranslation = () => {
    if (!selectedImage) {
      Alert.alert("تنبيه", "يرجى اختيار صورة أولاً");
      return;
    }
    setLoading(true);
    // محاكاة لعملية الترجمة عبر المودل
    setTimeout(() => {
      setLoading(false);
      Alert.alert("نجاح", "تمت ترجمة الصفحة بنجاح عبر مودل AI الخاص بك.");
    }, 3000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="translate" color={colors.primary} size={60} />
        <Text style={[styles.title, { color: colors.text }]}>مترجم المانهوا الذكي</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>قم برفع صفحات المانهوا وسيقوم مودل AI بترجمتها فوراً</Text>
      </View>

      <View style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        ) : (
          <TouchableOpacity style={styles.selectBtn} onPress={handlePickImage}>
            <MaterialCommunityIcons name="image-plus" color={colors.subText} size={50} />
            <Text style={{ color: colors.subText, marginTop: 10 }}>اضغط لاختيار صورة</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.translateBtn, { backgroundColor: colors.primary }]} 
        onPress={handleStartTranslation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>بدء الترجمة الآلية</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.note, { color: colors.subText }]}>
        * سيتم حفظ الصفحات المترجمة تلقائياً في مكتبتك.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  subtitle: { textAlign: 'center', marginTop: 5, fontSize: 14 },
  uploadBox: { width: '100%', height: 350, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  selectBtn: { alignItems: 'center' },
  translateBtn: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  note: { textAlign: 'center', marginTop: 20, fontSize: 12 }
});