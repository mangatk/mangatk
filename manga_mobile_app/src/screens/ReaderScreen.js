import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, FlatList, Image, StyleSheet, ActivityIndicator, Dimensions, Text, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getChapterDetails } from '../services/api';
import { ThemeContext } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function ReaderScreen({ route, navigation }) {
    const { chapterId, mangaId, mangaTitle, imageUrl, chapterNumber, allChapters } = route.params;
    const { colors } = useContext(ThemeContext);
    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showHeader, setShowHeader] = useState(true);
    const [progress, setProgress] = useState(0);
    const flatListRef = useRef(null);

    useEffect(() => { loadChapter(); }, [chapterId]);

    const loadChapter = async () => {
        setLoading(true);
        try {
            // 1. فحص هل الفصل متوفر أوفلاين في ذاكرة الهاتف
            const offlinePath = await AsyncStorage.getItem(`offline_${mangaId}_${chapterNumber}`);
            
            if (offlinePath) {
                // قراءة الصور من المجلد المحلي
                const files = await FileSystem.readDirectoryAsync(offlinePath);
                // تصفية وترتيب الملفات (بافتراض أنها تسمى 0.jpg, 1.jpg...)
                const sortedFiles = files
                    .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(file => `${offlinePath}${file}`);
                
                setChapter({ pages: sortedFiles, chapter_number: chapterNumber });
            } else {
                // 2. إذا لم يكن متوفراً، جلب البيانات من السيرفر (أونلاين)
                const data = await getChapterDetails(chapterId);
                setChapter(data);
            }
            
            // استرجاع موقع القراءة بدقة
            const savedScroll = await AsyncStorage.getItem(`scroll_pos_${chapterId}`);
            if (savedScroll && flatListRef.current) {
                setTimeout(() => {
                    flatListRef.current.scrollToOffset({ offset: parseFloat(savedScroll), animated: false });
                }, 500);
            }

            updateReadingHistory(mangaId, mangaTitle, imageUrl, chapterNumber, chapterId);

        } catch (e) { 
            console.error(e);
            Alert.alert("خطأ", "فشل تحميل الفصل، تأكد من اتصال الإنترنت");
        } 
        finally { setLoading(false); }
    };

    const updateReadingHistory = async (mId, mTitle, img, chNum, chId) => {
        try {
            await AsyncStorage.setItem(`last_read_${mId}`, JSON.stringify({ id: chId, number: chNum }));
            const historyData = await AsyncStorage.getItem('reading_history');
            let history = historyData ? JSON.parse(historyData) : [];
            const existingIndex = history.findIndex(item => item.mangaId === mId);
            if (existingIndex > -1) {
                if (!history[existingIndex].chapters.includes(chNum)) history[existingIndex].chapters.unshift(chNum);
                const movedItem = history.splice(existingIndex, 1)[0];
                history.unshift(movedItem);
            } else {
                history.unshift({ mangaId: mId, mangaTitle: mTitle, imageUrl: img, chapters: [chNum] });
            }
            await AsyncStorage.setItem('reading_history', JSON.stringify(history.slice(0, 50)));
        } catch (e) { console.log(e); }
    };

    const handleScroll = async (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const contentHeight = event.nativeEvent.contentSize.height;
        const scrollProgress = (offsetY / (contentHeight - height)) * 100;
        setProgress(scrollProgress);
        
        // حفظ مكان التوقف تلقائياً
        await AsyncStorage.setItem(`scroll_pos_${chapterId}`, offsetY.toString());
        
        if (offsetY > contentHeight - height - 100) setShowHeader(true);
    };

    const navigateChapter = (direction) => {
        const currentIndex = allChapters.findIndex(c => c.id === chapterId);
        const nextIndex = currentIndex + (direction === 'next' ? 1 : -1);
        if (allChapters[nextIndex]) {
            navigation.replace('Reader', { 
                ...route.params, 
                chapterId: allChapters[nextIndex].id, 
                chapterNumber: allChapters[nextIndex].chapter_number || allChapters[nextIndex].number 
            });
        } else {
            alert(direction === 'next' ? "وصلت لآخر فصل متاح" : "هذا هو أول فصل");
        }
    };

    if (loading) return <View style={[styles.loader, {backgroundColor: '#000'}]}><ActivityIndicator size="large" color="#FF0000" /></View>;

    return (
        <View style={styles.container}>
            <StatusBar hidden={!showHeader} />
            
            {showHeader && (
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}><MaterialCommunityIcons name="arrow-right" color="#fff" size={30} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>فصل {chapterNumber}</Text>
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={chapter?.pages}
                keyExtractor={(_, index) => index.toString()}
                onScroll={handleScroll}
                onScrollBeginDrag={() => setShowHeader(false)}
                renderItem={({ item }) => (
                    <TouchableOpacity activeOpacity={1} onPress={() => setShowHeader(!showHeader)}>
                        <Image source={{ uri: item }} style={styles.page} resizeMode="contain" />
                    </TouchableOpacity>
                )}
            />

            <View style={[styles.progressBar, { width: `${progress}%` }]} />

            {showHeader && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.navBtn} onPress={() => navigateChapter('prev')}>
                        <MaterialCommunityIcons name="skip-previous" color="#fff" size={30} />
                    </TouchableOpacity>
                    
                    <View style={styles.chapterBadge}><Text style={{color: '#fff', fontWeight: 'bold'}}>فصل {chapterNumber}</Text></View>

                    <TouchableOpacity style={styles.navBtn} onPress={() => navigateChapter('next')}>
                        <MaterialCommunityIcons name="skip-next" color="#fff" size={30} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { position: 'absolute', top: 0, width: '100%', height: 80, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30 },
    headerTitle: { color: '#fff', fontSize: 18, marginRight: 20, fontWeight: 'bold' },
    page: { width: width, height: width * 1.5, backgroundColor: '#000' },
    progressBar: { position: 'absolute', bottom: 70, height: 3, backgroundColor: '#FF0000', zIndex: 11 },
    footer: { position: 'absolute', bottom: 0, width: '100%', height: 70, backgroundColor: 'rgba(0,0,0,0.9)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, zIndex: 10 },
    navBtn: { padding: 10 },
    chapterBadge: { backgroundColor: '#FF0000', paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20 }
});