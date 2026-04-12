import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuPracownik from '../components/MenuPracownik';
import * as Location from 'expo-location';
import MapView, { PROVIDER_DEFAULT, Region } from 'react-native-maps';

export default function ZamowieniePracownik({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);

  // 🔥 Dodajemy stan dla regionu mapy (początkowo pusty lub Olsztyn jako fallback)
  const [region, setRegion] = useState<Region>({
    latitude: 53.7784,
    longitude: 20.4801,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // 🔥 POBIERANIE LOKALIZACJI PO WEJŚCIU NA EKRAN
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Odmowa', 'Aplikacja potrzebuje dostępu do lokalizacji.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005, // Duże przybliżenie na ulicę
        longitudeDelta: 0.005,
      });
    })();
  }, []);

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
        <View style={styles.headerButtons}>
          <Pressable onPress={() => setMenuVisible(true)} style={styles.menuButton}>
            <Ionicons name="menu" size={45} color="white" />
          </Pressable>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Wyloguj</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.mapBackground}
          provider={PROVIDER_DEFAULT}
          // 🔥 ZMIANA: Zastąpiono initialRegion stanem region, aby mapa reagowała na GPS
          region={region} 
          onRegionChangeComplete={setRegion} // 🔥 ZMIANA: Pozwala mapie zapamiętać nową pozycję przy przesuwaniu palcem
          showsUserLocation={true} // Pokaże niebieską kropkę z Twoją pozycją
          showsMyLocationButton={true} // 🔥 ZMIANA: Dodaje przycisk "celownika" do centrowania na użytkowniku
        >
          {/* Tu dla kierowcy zostawisz swoje <View style={styles.bottomSheet}> */}
        </MapView>
      </View>

      <View style={styles.fixedOrderTaxiPanel}>
        <Pressable style={styles.orderTaxiPanelContainer}>
          <Pressable style={styles.searchBarContainer}>
            <Text style={styles.searchText}>Dokąd?</Text>
          </Pressable>
        </Pressable>
      </View>

      <MenuPracownik 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        navigation={navigation} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    zIndex: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 180,
    height: 50,
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 0,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    zIndex: 1,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject, // 🔥 ZMIANA: Rozciąga mapę idealnie na cały pojemnik
  },
  fixedOrderTaxiPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  orderTaxiPanelContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 20,
  },
  searchBarContainer: {
    borderWidth: 2,
    borderColor: '#415a99',
    borderRadius: 10,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  searchText: {
    fontSize: 19,
    color: '#415a99',
    fontWeight: '600',
    textAlign: 'center',
  },
});