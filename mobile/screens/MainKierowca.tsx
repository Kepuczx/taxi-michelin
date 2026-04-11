import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MainKierowca({ navigation }: any) {
  const cars = [
    { id: 1, plates: 'NO XXXXX' },
    { id: 2, plates: 'NO XXXXX' },
    { id: 3, plates: 'NO XXXXX' },
    { id: 4, plates: 'NO XXXXX' },
    { id: 5, plates: 'NO XXXXX' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Wylogowanie',
      'Czy na pewno chcesz się wylogować?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            await AsyncStorage.removeItem('userEmail');
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/MichelinLogo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Wyloguj</Text>
        </Pressable>
      </View>
      
      <Text style={styles.title}>Wybierz samochód</Text>
      
      <View style={styles.listContainer}>
        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
          {cars.map((car, index) => (
            <View
              key={car.id}
              style={[
                styles.carItem,
                index === cars.length - 1 && styles.lastCarItem
              ]}
            >
              <Text style={styles.carText}>{car.plates}</Text>
              <Pressable 
                style={styles.selectButton} 
                onPress={() => navigation.navigate('ZleceniaKierowca')}
              >
                <Text style={styles.selectButtonText}>Wybierz</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#e6e6e6' 
  },
  header: {
    backgroundColor: '#0a1d56',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#FFD700',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoImage: { 
    width: 180, 
    height: 50,
    backgroundColor: '#fff',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#415a99', 
    fontStyle: 'italic', 
    textAlign: 'center', 
    marginTop: 30, 
    marginBottom: 20 
  },
  listContainer: { 
    backgroundColor: '#d9d9d9', 
    marginHorizontal: 20, 
    borderRadius: 15, 
    flex: 1, 
    marginBottom: 40, 
    paddingVertical: 10 
  },
  scrollContent: { 
    paddingBottom: 20 
  },
  carItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 15, 
    paddingHorizontal: 25, 
    borderBottomWidth: 1, 
    borderBottomColor: '#a9a9a9', 
  },
  lastCarItem: { 
    borderBottomWidth: 0 
  },
  carText: { 
    fontSize: 22, 
    color: '#000',
  },
  selectButton: { 
    backgroundColor: '#28a745', 
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  selectButtonText: { 
    color: '#fff', 
    fontSize: 16, 
  },
});