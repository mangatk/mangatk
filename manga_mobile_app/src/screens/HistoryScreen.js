import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { ThemeContext } from '../context/ThemeContext';

export default function HistoryScreen({ navigation }) {
    const { colors } = useContext(ThemeContext);
    const [history, setHistory] = useState([]);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) getHistory();
    }, [isFocused]);

    const getHistory = async () => {
        const data = await AsyncStorage.getItem('reading_history');
        if (data) setHistory(JSON.parse(data));
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={history}
                keyExtractor={(item) => item.mangaId.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                        style={[styles.card, { backgroundColor: colors.card }]}
                        onPress={() => navigation.navigate('Details', { mangaId: item.mangaId, mangaTitle: item.mangaTitle })}
                    >
                        <Image source={{ uri: item.imageUrl }} style={styles.img} />
                        <View style={styles.info}>
                            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.mangaTitle}</Text>
                            <View style={styles.chaptersList}>
                                {item.chapters.slice(0, 5).map((ch, idx) => (
                                    <View key={idx} style={styles.chBadge}>
                                        <Text style={styles.chText}>فصل {ch}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<View style={{flex: 1, alignItems: 'center', marginTop: 100}}><Text style={{color: colors.subText}}>سجل القراءة فارغ حالياً</Text></View>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    card: { flexDirection: 'row-reverse', padding: 12, borderRadius: 15, marginBottom: 12, alignItems: 'center', elevation: 3 },
    img: { width: 65, height: 90, borderRadius: 10 },
    info: { flex: 1, marginRight: 15, alignItems: 'flex-end' },
    name: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
    chaptersList: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 5 },
    chBadge: { backgroundColor: 'rgba(255,0,0,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
    chText: { color: '#FF0000', fontSize: 11, fontWeight: 'bold' }
});