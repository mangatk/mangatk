import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';



export default function App() {
  return (
    // 1. التغليف بـ GestureHandlerRootView ضروري للإيماءات (مثل السحب لغلق الصفحة)
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* 2. يجب وضع ThemeProvider خارج الـ NavigationContainer لتتمكن من استخدامه في تخصيص الثيم */}
      <ThemeProvider>
        <NavigationContainer>
          {/* 3. شريط الحالة العلوي (الساعة والبطارية) */}
          <StatusBar style="light" backgroundColor="#121212" />
          
          {/* 4. استدعاء ملف التنقل الرئيسي */}
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
});