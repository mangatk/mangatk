import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { registerUser } from '../services/api'; 

export default function SignupScreen({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert("تنبيه", "يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      await registerUser(name, email, password);
      Alert.alert("نجاح", "تم إنشاء الحساب في السيرفر بنجاح! يمكنك الآن تسجيل الدخول.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("خطأ", e.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MaterialCommunityIcons name="account-plus" color={colors.primary} size={80} />
      <Text style={[styles.title, { color: colors.text }]}>إنشاء حساب جديد</Text>
      
      <TextInput 
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="الاسم الكامل"
        placeholderTextColor={colors.subText}
        value={name}
        onChangeText={setName}
        textAlign="right"
      />
      
      <TextInput 
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="البريد الإلكتروني"
        placeholderTextColor={colors.subText}
        value={email}
        onChangeText={setEmail}
        textAlign="right"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <View style={[styles.passwordContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => setShowPassword(!showPassword)} 
          style={styles.eyeIcon}
        >
          <MaterialCommunityIcons 
            name={showPassword ? "eye-off" : "eye"} 
            color={colors.subText} 
            size={24} 
          />
        </TouchableOpacity>
        
        <TextInput 
          style={[styles.passwordInput, { color: colors.text }]}
          placeholder="كلمة المرور"
          placeholderTextColor={colors.subText}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          textAlign="right"
        />
      </View>

      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: colors.primary }]} 
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>تأكيد التسجيل</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
        <Text style={{ color: colors.subText }}>لديك حساب بالفعل؟ سجل دخولك</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30 },
  input: { 
    width: '100%', 
    height: 55, 
    borderRadius: 12, 
    borderWidth: 1, 
    paddingHorizontal: 15, 
    marginBottom: 15, 
    textAlign: 'right' 
  },
  passwordContainer: { 
    width: '100%', 
    height: 55, 
    borderRadius: 12, 
    borderWidth: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  passwordInput: { 
    flex: 1, 
    height: '100%', 
    paddingHorizontal: 15, 
    textAlign: 'right' 
  },
  eyeIcon: { 
    paddingHorizontal: 15 
  },
  btn: { 
    width: '100%', 
    height: 55, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10 
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});