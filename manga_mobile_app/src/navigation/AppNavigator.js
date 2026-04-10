import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';

// 1. استيراد جميع الشاشات (تأكد أن الملفات موجودة في مجلد screens)
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import LibraryScreen from '../screens/LibraryScreen';
import MoreScreen from '../screens/MoreScreen';
import ReaderScreen from '../screens/ReaderScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HistoryScreen from '../screens/HistoryScreen'; // شاشة السجل
import AchievementsScreen from '../screens/AchievementsScreen'; // شاشة الإنجازات
import TranslatorScreen from '../screens/TranslatorScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { colors } = useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopWidth: 0, height: 65, paddingBottom: 10 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
      }}
    >
      <Tab.Screen name="Browse" component={HomeScreen} options={{ tabBarLabel: 'تصفح', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="compass" color={color} size={26} /> }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ tabBarLabel: 'المكتبة', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="library-shelves" color={color} size={26} /> }} />
      <Tab.Screen name="More" component={MoreScreen} options={{ tabBarLabel: 'المزيد', tabBarIcon: ({ color }) => <MaterialCommunityIcons name="dots-horizontal" color={color} size={26} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useContext(ThemeContext);
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background, elevation: 0 },
        headerTintColor: colors.text,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} options={{ headerTitle: 'MangaTK' }} />
      <Stack.Screen name="Details" component={DetailsScreen} options={({ route }) => ({ title: route.params?.mangaTitle || 'التفاصيل' })} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'تسجيل الدخول' }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: 'إنشاء حساب' }} />
      
      {/* 2. إضافة الشاشات التي كانت تسبب خطأ */}
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'سجل القراءة' }} />
      <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'الإنجازات' }} />
      <Stack.Screen name="Translator" component={TranslatorScreen} options={{ title: 'مترجم AI' }} />
    </Stack.Navigator>
  );
}