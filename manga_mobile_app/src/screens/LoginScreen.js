import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// نستخدم المكتبة الأساسية لأنها تعمل في الـ APK
import Auth0 from 'react-native-auth0';

const auth0 = new Auth0({ 
  domain: 'dev-n8idcwmwk1ubft3j.us.auth0.com', 
  clientId: 'KXS1SZxHS6usQWA50MiKIhRUPWchTnMx' 
});

export default function LoginScreen({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // هذه الدالة هي التي تفتح متصفح النظام المدمج
      const credentials = await auth0.webAuth.authorize({
        scope: 'openid profile email',
        audience: 'https://mangatk',
        connection: 'google-oauth2',
      });

      // جلب بيانات المستخدم
      const user = await auth0.auth.userInfo({ token: credentials.accessToken });

      const userData = {
        name: user.givenName || user.name,
        email: user.email,
        picture: user.picture,
        token: credentials.accessToken
      };

      await AsyncStorage.setItem('user_token', credentials.accessToken);
      await AsyncStorage.setItem('user_info', JSON.stringify(userData));

      Alert.alert("نجاح", `أهلاً بك يا ${userData.name}`);
      navigation.navigate('Main');
    } catch (error) {
      console.log("Auth Error:", error);
      Alert.alert("خطأ", "لم يتم اكتمال تسجيل الدخول. تأكد من إعدادات Callback URL في Auth0");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MaterialCommunityIcons name="google-play" color={colors.primary} size={100} />
      <Text style={[styles.title, { color: colors.text }]}>MangaTK</Text>
      
      <TouchableOpacity 
        style={[styles.googleBtn, { backgroundColor: colors.primary }]} 
        onPress={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.btnContent}>
            <Text style={styles.btnText}>الدخول بواسطة Google</Text>
            <MaterialCommunityIcons name="google" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 40 },
  googleBtn: { width: '100%', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 10 }
});