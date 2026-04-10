import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Dimensions, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { getMangaDetails } from '../services/api';
import { ThemeContext } from '../context/ThemeContext';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function DetailsScreen({ route, navigation }) {
    const { mangaId } = route.params;
    const { colors, isDark } = useContext(ThemeContext);
    const isFocused = useIsFocused();

    const [manga, setManga] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    const [userTabs, setUserTabs] = useState(['الافتراضي']);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [lastChapter, setLastChapter] = useState(null);
    const [readChapters, setReadChapters] = useState([]);
    const [downloadingChapters, setDownloadingChapters] = useState({});

    useEffect(() => {
        if (isFocused) {
            loadMangaDetails();
            checkInitialStatus();
        }
    }, [isFocused, mangaId]);

    const checkInitialStatus = async () => {
        try {
            const favorites = await AsyncStorage.getItem('favorites');
            if (favorites) {
                const favList = JSON.parse(favorites);
                setIsFavorite(favList.some(item => item.id === mangaId));
            }
            const savedTabs = await AsyncStorage.getItem('user_tabs');
            if (savedTabs) setUserTabs(JSON.parse(savedTabs));

            const history = await AsyncStorage.getItem(`last_read_${mangaId}`);
            if (history) setLastChapter(JSON.parse(history));

            const historyData = await AsyncStorage.getItem('reading_history');
            if (historyData) {
                const fullHistory = JSON.parse(historyData);
                const currentMangaHistory = fullHistory.find(item => item.mangaId === mangaId);
                if (currentMangaHistory) setReadChapters(currentMangaHistory.chapters || []);
            }
        } catch (e) { console.error(e); }
    };

    const loadMangaDetails = async () => {
        try {
            const data = await getMangaDetails(mangaId);
            if (data.chapters) {
                data.chapters.sort((a, b) => parseFloat(a.chapter_number) - parseFloat(b.chapter_number));
            }
            setManga(data);
        } catch (error) {
            console.error(error);
        } finally { setLoading(false); }
    };

    // دالة اختيار المجلد الرئيسي (تظهر مرة واحدة أو عند الحاجة)
    const getBaseFolder = async () => {
        let path = await AsyncStorage.getItem('main_manga_folder');
        if (!path) {
            Alert.alert("إعداد التخزين", "يرجى اختيار مجلد لحفظ المانجا المحملة.");
            // ملاحظة: في Expo Go قد لا يظهر اختيار المجلد كاملاً، يفضل استخدام مسار التطبيق الافتراضي كبديل
            path = FileSystem.documentDirectory + 'MangaTK/';
            await FileSystem.makeDirectoryAsync(path, { intermediates: true });
            await AsyncStorage.setItem('main_manga_folder', path);
        }
        return path;
    };

    const downloadChapter = async (chapter) => {
        const chNum = chapter.chapter_number || chapter.number;
        const mangaName = manga.title.replace(/[^a-zA-Z0-9]/g, "_");
        const baseFolder = await getBaseFolder();
        const folderPath = `${baseFolder}${mangaName}/Ch_${chNum}/`;

        try {
            setDownloadingChapters(prev => ({ ...prev, [chapter.id]: true }));
            
            // إنشاء مجلد المانهوا ومجلد الفصل
            await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });

            const { getChapterDetails } = require('../services/api');
            const chDetails = await getChapterDetails(chapter.id);

            for (let i = 0; i < chDetails.pages.length; i++) {
                const fileUri = `${folderPath}${i}.jpg`;
                await FileSystem.downloadAsync(chDetails.pages[i], fileUri);
            }

            // حفظ المسار المحلي للفصل
            await AsyncStorage.setItem(`offline_${mangaId}_${chNum}`, folderPath);
            Alert.alert("نجاح", `تم تحميل الفصل ${chNum} في ذاكرة الهاتف`);
        } catch (error) {
            console.error(error);
            Alert.alert("خطأ", "فشل التحميل، تأكد من اتصال الإنترنت وصلاحيات التخزين");
        } finally {
            setDownloadingChapters(prev => ({ ...prev, [chapter.id]: false }));
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadMangaDetails().then(() => setRefreshing(false));
    }, []);

    const toggleFavorite = async () => {
        if (!manga) return;
        let favorites = await AsyncStorage.getItem('favorites');
        let favList = favorites ? JSON.parse(favorites) : [];
        if (isFavorite) {
            favList = favList.filter(item => item.id !== mangaId);
        } else {
            favList.push({ id: mangaId, title: manga.title, imageUrl: manga.imageUrl });
        }
        await AsyncStorage.setItem('favorites', JSON.stringify(favList));
        setIsFavorite(!isFavorite);
    };

    const addToLibrary = async (tabName) => {
        let library = await AsyncStorage.getItem('library_data');
        let libData = library ? JSON.parse(library) : {};
        if (!libData[tabName]) libData[tabName] = [];
        if (!libData[tabName].some(item => item.id === mangaId)) {
            libData[tabName].push({ id: mangaId, title: manga.title, imageUrl: manga.imageUrl });
            await AsyncStorage.setItem('library_data', JSON.stringify(libData));
            Alert.alert("نجاح", `أضيفت إلى ${tabName}`);
        }
        setModalVisible(false);
    };

    const createNewTab = async () => {
        if (newTabName.trim() === '') return;
        const updatedTabs = [...userTabs, newTabName];
        setUserTabs(updatedTabs);
        await AsyncStorage.setItem('user_tabs', JSON.stringify(updatedTabs));
        setNewTabName('');
    };

    const isNew = (dateString) => {
        if (!dateString) return false;
        const diff = (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24);
        return diff <= 3;
    };

    if (loading) return <View style={[styles.loader, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView 
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                <View style={styles.headerContainer}>
                    <Image source={{ uri: manga?.imageUrl }} style={styles.mainImage} />
                    <View style={styles.sideInfo}>
                        <Text style={[styles.mangaTitle, { color: colors.text }]}>{manga?.title}</Text>
                        <Text style={[styles.status, { color: colors.primary }]}>{manga?.status}</Text>
                        <Text style={{ color: colors.subText, textAlign: 'right' }}>المؤلف: {manga?.author || 'غير معروف'}</Text>
                        <View style={styles.rowBtn}>
                            <TouchableOpacity style={[styles.iconBtn, { borderColor: colors.primary }]} onPress={toggleFavorite}>
                                <MaterialCommunityIcons name={isFavorite ? "heart" : "heart-outline"} color={colors.primary} size={24} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primary, borderWidth: 0 }]} onPress={() => setModalVisible(true)}>
                                <MaterialCommunityIcons name="plus" color="#fff" size={24} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.paddingSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>القصة</Text>
                    <Text style={[styles.description, { color: colors.subText }]} numberOfLines={showFullDesc ? 0 : 3}>{manga?.description || "لا يوجد وصف متاح."}</Text>
                    <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)} style={{ alignItems: 'center', padding: 5 }}>
                        <MaterialCommunityIcons name={showFullDesc ? "chevron-up" : "chevron-down"} color={colors.primary} size={24} />
                    </TouchableOpacity>

                    <View style={styles.genresWrapper}>
                        {manga?.genres?.map((g, i) => (
                            <View key={i} style={[styles.genreTag, { borderColor: colors.primary, backgroundColor: colors.card }]}>
                                <Text style={{ color: colors.primary, fontSize: 11 }}>{typeof g === 'object' ? g.name : g}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.paddingSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>الفصول ({manga?.chapters?.length})</Text>
                    {manga?.chapters?.map((ch) => {
                        const isRead = readChapters.includes(ch.chapter_number || ch.number);
                        const isDownloading = downloadingChapters[ch.id];
                        return (
                            <View key={ch.id} style={[styles.chapterItem, { backgroundColor: isRead ? (isDark ? '#252525' : '#f0f0f0') : colors.card }]}>
                                <TouchableOpacity
                                    style={{ flex: 1, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}
                                    onPress={() => navigation.navigate('Reader', {
                                        chapterId: ch.id,
                                        mangaId: mangaId,
                                        mangaTitle: manga.title,
                                        imageUrl: manga.imageUrl,
                                        chapterNumber: ch.chapter_number || ch.number,
                                        allChapters: manga.chapters
                                    })}
                                >
                                    <View style={{flexDirection: 'row-reverse', alignItems: 'center'}}>
                                        <Text style={{ color: isRead ? colors.subText : colors.text, fontWeight: isRead ? 'normal' : 'bold' }}>فصل {ch.chapter_number || ch.number}</Text>
                                        {isNew(ch.created_at) && <View style={styles.newBadge}><Text style={styles.newText}>جديد</Text></View>}
                                    </View>
                                    <MaterialCommunityIcons name={isRead ? "check-circle" : "play-circle-outline"} color={isRead ? "#4CAF50" : colors.subText} size={22} />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => downloadChapter(ch)} disabled={isDownloading} style={{ paddingHorizontal: 10 }}>
                                    {isDownloading ? <ActivityIndicator size="small" color={colors.primary} /> : <MaterialCommunityIcons name="download-outline" color={colors.primary} size={24} />}
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <TouchableOpacity
                style={[styles.resumeBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                    const targetCh = lastChapter ? manga.chapters.find(c => c.id === lastChapter.id) : manga.chapters[0];
                    if (targetCh) {
                        navigation.navigate('Reader', { chapterId: targetCh.id, mangaId: mangaId, mangaTitle: manga.title, imageUrl: manga.imageUrl, chapterNumber: targetCh.chapter_number || targetCh.number, allChapters: manga.chapters });
                    }
                }}
            >
                <MaterialCommunityIcons name={lastChapter ? "history" : "play"} color="#fff" size={24} />
                <Text style={styles.resumeText}>{lastChapter ? `استئناف فصل ${lastChapter.number}` : "بدء القراءة"}</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة للمكتبة</Text>
                        {userTabs.map((tab, i) => (
                            <TouchableOpacity key={i} style={[styles.modalOption, { borderBottomColor: colors.border }]} onPress={() => addToLibrary(tab)}>
                                <Text style={{ color: colors.text, textAlign: 'right' }}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                        <View style={styles.createTabBox}>
                            <TextInput style={[styles.input, { color: colors.text, backgroundColor: colors.background }]} placeholder="قسم جديد..." placeholderTextColor={colors.subText} value={newTabName} onChangeText={setNewTabName} textAlign="right" />
                            <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={createNewTab}><MaterialCommunityIcons name="plus" color="#fff" size={24} /></TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 15 }}><Text style={{ color: colors.primary, textAlign: 'center', fontWeight: 'bold' }}>إغلاق</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    loader: { flex: 1, justifyContent: 'center' },
    headerContainer: { flexDirection: 'row-reverse', padding: 20, paddingTop: 40 },
    mainImage: { width: 140, height: 210, borderRadius: 15 },
    sideInfo: { flex: 1, marginRight: 20, justifyContent: 'center' },
    mangaTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
    status: { fontWeight: 'bold', marginBottom: 5, textAlign: 'right' },
    rowBtn: { flexDirection: 'row-reverse', gap: 15, marginTop: 20 },
    iconBtn: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    paddingSection: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
    description: { lineHeight: 22, textAlign: 'right' },
    genresWrapper: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 15 },
    genreTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    chapterItem: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 12, marginBottom: 10, elevation: 2 },
    newBadge: { backgroundColor: '#FF0000', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginRight: 10 },
    newText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    resumeBtn: { position: 'absolute', bottom: 30, left: 20, width: 160, height: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 30, elevation: 5 },
    resumeText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 14 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    modalOption: { padding: 15, borderBottomWidth: 0.5 },
    createTabBox: { flexDirection: 'row-reverse', marginTop: 20, gap: 10 },
    input: { flex: 1, height: 45, borderRadius: 10, paddingHorizontal: 15 },
    addBtn: { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }
});