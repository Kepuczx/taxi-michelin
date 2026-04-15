import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { PROVIDER_DEFAULT, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

import MenuPracownik from '../components/MenuPracownik';
import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY, API_URL } from './config';


export default function ZamowieniePracownik({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Region mapy
  const [region, setRegion] = useState<Region>({
    latitude: 53.7784,
    longitude: 20.4801,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Stany dla lokalizacji trasy
  const [pickup, setPickup] = useState({
    address: 'Pobieranie lokalizacji...',
    coords: { latitude: 53.7784, longitude: 20.4801 }
  });

  const [destination, setDestination] = useState({
    address: '',
    coords: { latitude: 0, longitude: 0 }
  });

  // 1. Inicjalizacja lokalizacji GPS
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };

      // 🔥 DODAJ TO: Pobieramy adres Twojej aktualnej pozycji
      const [address] = await Location.reverseGeocodeAsync(newCoords);
      const myAddr = address ? `${address.street || 'Moja lokalizacja'} ${address.name || ''}` : "Moja lokalizacja";

      setPickup({ address: myAddr, coords: newCoords }); // Ustawiamy punkt startowy
      
      setRegion({
        ...newCoords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  // 2. Obsługa wysyłania zamówienia do backendu
  const handleOrderTrip = async () => {
    if (!destination.address) {
      Alert.alert("Błąd", "Wybierz miejsce docelowe (Dokąd?)");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const clientId = await AsyncStorage.getItem('userId'); // Pobieramy zapisane ID

      const tripData = {
        clientId: clientId ? parseInt(clientId) : null,
        pickupLat: pickup.coords.latitude,
        pickupLng: pickup.coords.longitude,
        pickupAddress: pickup.address,
        dropoffLat: destination.coords.latitude,
        dropoffLng: destination.coords.longitude,
        dropoffAddress: destination.address,
        passengerCount: 1, // Można rozbudować o wybór
        notes: "Zamówienie z aplikacji mobilnej"
      };

      const response = await axios.post(`${API_URL}/trips/request`, tripData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 201) {
        Alert.alert("Sukces", "Kurs został zamówiony! Czekaj na przypisanie kierowcy.");
        navigation.navigate('HistoriaPracownik');
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Błąd", "Nie udało się zamówić kursu.");
    } finally {
      setLoading(false);
    }
  };
  // Funkcja obsługująca kliknięcie w dowolny punkt na mapie
  const onMapPress = async (e: any) => {
    const coords = e.nativeEvent.coordinate;
    
    // Opcjonalnie: pobieramy nazwę ulicy dla klikniętego punktu (za darmo z Expo)
    try {
      const [address] = await Location.reverseGeocodeAsync(coords);
      const fullAddress = address 
        ? `${address.street || ''} ${address.name || ''}, ${address.city || ''}`.trim().replace(/^,/, '')
        : "Wybrany punkt na mapie";
      
      setDestination({
        address: fullAddress || "Wybrany punkt",
        coords: coords
      });
    } catch (err) {
      setDestination({ address: "Punkt na mapie", coords });
    }
  };

  return (
    

    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/MichelinLogo.png')} style={styles.logoImage} resizeMode="contain" />
        <View style={styles.headerButtons}>
          <Pressable onPress={() => setMenuVisible(true)}><Ionicons name="menu" size={40} color="white" /></Pressable>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.mapBackground}
          provider={PROVIDER_DEFAULT}
          region={region}
          showsUserLocation={true}
          // 🔥 TA LINIA DODAJE MOŻLIWOŚĆ KLIKANIA:
          onPress={onMapPress}
>          
          {/* Znaczniki (Markery) */}
          <Marker coordinate={pickup.coords} title="Skąd" pinColor="blue" />
          <Marker coordinate={pickup.coords} title="Twoja lokalizacja" pinColor="blue" />
  {destination.address !== '' && (
    <Marker coordinate={destination.coords} title="Cel" pinColor="red" />
  )}
          
          {destination.address !== '' && (
            <>
              <Marker coordinate={destination.coords} title="Dokąd" pinColor="red" />

              {/* RYSOWANIE TRASY */}
              <MapViewDirections
                origin={pickup.coords}
                destination={destination.coords}
                apikey={GOOGLE_MAPS_API_KEY}
                strokeWidth={4}
                strokeColor="#0a1d56"
                optimizeWaypoints={true}
                onReady={(result) => {
                  // Automatyczne dopasowanie widoku mapy do całej trasy
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: { right: 50, bottom: 300, left: 50, top: 100 },
                  });
                  
                  // Opcjonalnie: zapisz dystans i czas, aby wysłać je do bazy
                  console.log(`Dystans: ${result.distance} km`);
                  console.log(`Czas: ${result.duration} min`);
                }}
              />
            </>
          )}
        </MapView>
      </View>

      {/* PANEL WYSZUKIWANIA */}
      {/* Dodano zIndex do kontenera, aby był ponad mapą */}
      <View style={[styles.searchPanel, { zIndex: 999 }]}> 
        <View style={[styles.inputWrapper, { zIndex: 2 }]}>
          <Ionicons name="location" size={20} color="#0a1d56" style={styles.inputIcon} />
          <GooglePlacesAutocomplete
  placeholder='Skąd?'
  fetchDetails={true}
  keyboardShouldPersistTaps="handled"
  // 🔥 DODAJ TO, ABY ZOBACZYĆ BŁĄD W KONSOLI:
  onFail={(error) => console.error("BŁĄD GOOGLE PLACES:", error)}
  onPress={(data, details = null) => {
    // Twoja logika...
  }}
  query={{ 
    key: GOOGLE_MAPS_API_KEY, 
    language: 'pl',
    types: 'address' // ogranicza do konkretnych adresów
  }}
  styles={autocompleteStyles}
/>
        </View>

        <View style={[styles.inputWrapper, { zIndex: 1 }]}>
          <Ionicons name="flag" size={20} color="#dc3545" style={styles.inputIcon} />
          <GooglePlacesAutocomplete
  placeholder='Skąd?'
  fetchDetails={true}
  keyboardShouldPersistTaps="handled"
  // 🔥 DODAJ TO, ABY ZOBACZYĆ BŁĄD W KONSOLI:
  onFail={(error) => console.error("BŁĄD GOOGLE PLACES:", error)}
  onPress={(data, details = null) => {
    // Twoja logika...
  }}
  query={{ 
    key: GOOGLE_MAPS_API_KEY, 
    language: 'pl',
    types: 'address' // ogranicza do konkretnych adresów
  }}
  styles={autocompleteStyles}
/>
        </View>

        <Pressable 
          style={[styles.orderButton, loading && { opacity: 0.7 }]} 
          onPress={handleOrderTrip}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>ZAMÓW KURS</Text>}
        </Pressable>
      </View>

      <MenuPracownik visible={menuVisible} onClose={() => setMenuVisible(false)} navigation={navigation} />
    </View>
  );
}




const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#0a1d56',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  logoImage: { width: 150, height: 40, backgroundColor: '#fff' },
  headerButtons: { flexDirection: 'row' },
  mapContainer: { flex: 1 },
  mapBackground: { ...StyleSheet.absoluteFillObject },
  searchPanel: {
    position: 'absolute',
    top: 110,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 15,
    // 🔥 Zwiększamy elevation do 15+, aby na pewno było nad mapą
    elevation: 20, 
    zIndex: 1000,
    // 🔥 USUNĄĆ jeśli masz: overflow: 'hidden'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    // 🔥 Każdy wrapper musi mieć malejący zIndex, 
    // aby "Skąd" nie zasłaniało listy "Dokąd"
    zIndex: 10, 
  },
  inputIcon: { marginRight: 10 },
  orderButton: {
    backgroundColor: '#0a1d56',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  orderButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

// POPRAWIONE STYLE AUTOCOMPLETE
const autocompleteStyles = {
  container: {
    // 🔥 Zmiana na 0 pozwala liście swobodnie "wypaść" poza kontener
    flex: 0, 
    width: '100%',
    zIndex: 1000,
  },
  textInput: {
    height: 45,
    color: '#5d5d5d',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#ffffff', // Upewnij się, że tło jest białe
  },
  listView: {
    // 🔥 Pozycjonowanie absolutne względem pola tekstowego
    position: 'absolute' as const,
    top: 45, 
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 10, // Dla Androida
    zIndex: 5000,  // Bardzo wysoki priorytet
    maxHeight: 200, // Zabezpieczenie wysokości
  },
  row: {
    backgroundColor: '#FFFFFF',
    padding: 13,
    height: 44,
    flexDirection: 'row',
  },
  separator: {
    height: 0.5,
    backgroundColor: '#c8c7cc',
  },
};