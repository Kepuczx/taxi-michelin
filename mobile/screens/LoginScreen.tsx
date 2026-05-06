import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, ImageBackground, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const backgroundImage = require('../assets/LoginBackground.jpg');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [scale, setScale] = useState(1);
  const [moveUp, setMoveUp] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setScale(0.8);
      setMoveUp(-40);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setScale(1);
      setMoveUp(0);
    });
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // 🔥 SPRAWDŹ CZY UŻYTKOWNIK JEST JUŻ ZALOGOWANY
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      
      if (token && role === 'admin') {
        navigation.replace('AdminPanel');
      } else if (token && role === 'driver') {
        navigation.replace('MainKierowca');
      } else if (token && role === 'employee') {
        navigation.replace('ZamowieniePracownik');
      }
    };
    checkLoggedIn();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Błąd", "Wpisz email i hasło");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });

      const data = await response.json();

      if (response.ok) {
        // 🔥 ZAPISUJEMY WSZYSTKIE DANE (w tym authToken dla kompatybilności)
        await AsyncStorage.setItem('userToken', data.access_token);
        await AsyncStorage.setItem('authToken', data.access_token); // 🔥 DODANE!
        await AsyncStorage.setItem('userRole', data.role);
        await AsyncStorage.setItem('userEmail', email);
        
        // ZAPISUJEMY ID I IMIĘ/NAZWISKO
        if (data.user && data.user.id) {
          await AsyncStorage.setItem('userId', data.user.id.toString());
          await AsyncStorage.setItem('userName', `${data.user.firstName} ${data.user.lastName}`);
        }
        
        console.log('✅ Zalogowano jako:', data.role);
        console.log('✅ UserId:', data.user?.id);
        console.log('✅ Token zapisany jako userToken i authToken');
        
        // PRZEKIEROWANIE NA PODSTAWIE ROLI
        if (data.role === 'admin') {
          navigation.replace('AdminPanel');
        } else if (data.role === 'driver') {
          navigation.replace('MainKierowca');
        } else if (data.role === 'employee') {
          navigation.replace('ZamowieniePracownik');
        } else {
          navigation.replace('ZamowieniePracownik');
        }
      } else {
        Alert.alert("Błąd logowania", data.message || "Nieprawidłowy email lub hasło");
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert("Błąd", "Nie można połączyć się z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.backgroundContainer}>
        <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover" />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.overlay, { transform: [{ scale: scale }, { translateY: moveUp }] }]}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>LOGOWANIE</Text>
              <Text style={styles.subtitle}>TRANSPORT FIRMOWY</Text>
            </View>
            <View style={styles.formContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: isEmailFocused ? '#d9e6f2' : '#FFFFFF' }]}
                placeholder="Email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
              <TextInput
                style={[styles.input, { backgroundColor: isPasswordFocused ? '#d9e6f2' : '#FFFFFF' }]}
                placeholder="Hasło"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  { backgroundColor: pressed ? '#2a4d9c' : '#0a1d56', opacity: loading ? 0.7 : 1 }
                ]}
              >
                <Text style={styles.buttonText}>{loading ? 'Logowanie...' : 'Zaloguj'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#fff' },
  backgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 },
  background: { width: '100%', height: '100%' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  overlay: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 54, fontWeight: '900', color: '#3b5998', fontStyle: 'italic', letterSpacing: 1 },
  subtitle: { fontSize: 40, fontWeight: 'bold', color: '#3b5998', letterSpacing: 3, textAlign: 'center', marginTop: 40, marginBottom: 20 },
  formContainer: { width: '100%', alignItems: 'center', gap: 15 },
  input: { width: '85%', height: 75, borderColor: '#3b5998', borderWidth: 1.5, borderRadius: 15, paddingHorizontal: 20, fontSize: 18, color: '#000' },
  button: { width: '85%', height: 75, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  buttonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
});