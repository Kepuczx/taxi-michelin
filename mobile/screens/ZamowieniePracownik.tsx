import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
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
  
  // Referencje do pół tekstowych, by móc wstawiać w nie tekst programowo
  const pickupRef = useRef<GooglePlacesAutocompleteRef>(null);
  const destinationRef = useRef<GooglePlacesAutocompleteRef>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 53.7784,
    longitude: 20.4801,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [pickup, setPickup] = useState({
    address: '',
    coords: { latitude: 0, longitude: 0 }
  });

  const [destination, setDestination] = useState({
    address: '',
    coords: { latitude: 0, longitude: 0 }
  });

  // 1. Inicjalizacja lokalizacji (Ustawia pole Skąd na bieżącą pozycję)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Odmowa', 'Aplikacja potrzebuje GPS do działania.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      try {
        const [addressObj] = await Location.reverseGeocodeAsync(newCoords);
        const myAddr = addressObj 
          ? `${addressObj.street || ''} ${addressObj.name || ''}, ${addressObj.city || ''}`.trim().replace(/^,/, '')
          : "Moja lokalizacja";
        
        setPickup({ address: myAddr, coords: newCoords });
        pickupRef.current?.setAddressText(myAddr); // Aktualizuje tekst w polu
      } catch (err) {
        setPickup({ address: "Moja lokalizacja", coords: newCoords });
        pickupRef.current?.setAddressText("Moja lokalizacja");
      }

      setRegion({
        ...newCoords,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  // Obsługa kliknięcia w mapę (Ustawia pole Dokąd)
  const onMapPress = async (e: any) => {

    Keyboard.dismiss();
    pickupRef.current?.blur();
    destinationRef.current?.blur();

    const coords = e.nativeEvent.coordinate;
    
    try {
      const [addressObj] = await Location.reverseGeocodeAsync(coords);
      const fullAddress = addressObj 
        ? `${addressObj.street || ''} ${addressObj.name || ''}, ${addressObj.city || ''}`.trim().replace(/^,/, '')
        : "Wybrany punkt na mapie";
      
      setDestination({ address: fullAddress, coords });
      destinationRef.current?.setAddressText(fullAddress); // Aktualizuje tekst w polu
    } catch (err) {
      setDestination({ address: "Wybrany punkt", coords });
      destinationRef.current?.setAddressText("Wybrany punkt");
    }
  };

  const handleOrderTrip = async () => {
    // Zabezpieczenie przed brakiem danych
    if (!pickup.coords.latitude || !destination.coords.latitude) {
      Alert.alert("Błąd", "Wybierz poprawne miejsce początkowe i docelowe.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const clientId = await AsyncStorage.getItem('userId');

      const tripData = {
        clientId: clientId ? parseInt(clientId) : null,
        pickupLat: pickup.coords.latitude,
        pickupLng: pickup.coords.longitude,
        pickupAddress: pickup.address,
        dropoffLat: destination.coords.latitude,
        dropoffLng: destination.coords.longitude,
        dropoffAddress: destination.address,
        passengerCount: 1,
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
          onPress={onMapPress} // Kliknięcie aktualizuje punkt DOKĄD
        >          
          {/* Marker SKĄD pojawia się, gdy mamy współrzędne */}
          {pickup.coords.latitude !== 0 && (
            <Marker coordinate={pickup.coords} title="Skąd" pinColor="blue" />
          )}
          
          {/* Marker DOKĄD pojawia się, gdy mamy współrzędne */}
          {destination.coords.latitude !== 0 && (
            <>
              <Marker coordinate={destination.coords} title="Dokąd" pinColor="red" />

              {/* RYSOWANIE TRASY */}
              {pickup.coords.latitude !== 0 && (
                <MapViewDirections
                  origin={pickup.coords}
                  destination={destination.coords}
                  apikey={GOOGLE_MAPS_API_KEY}
                  strokeWidth={4}
                  strokeColor="#0a1d56"
                  optimizeWaypoints={true}
                  onReady={(result) => {
                    mapRef.current?.fitToCoordinates(result.coordinates, {
                      edgePadding: { right: 50, bottom: 300, left: 50, top: 200 },
                    });
                  }}
                />
              )}
            </>
          )}
        </MapView>
      </View>

      {/* PANEL WYSZUKIWANIA */}
      <Pressable 
        style={[styles.searchPanel, { zIndex: 999 }]} 
        onPress={() => {
          Keyboard.dismiss();
          pickupRef.current?.blur();
          destinationRef.current?.blur();
        }}
      >
        
        {/* POLE SKĄD */}
        <View style={[styles.inputWrapper, { zIndex: 10, width: '90%' }]}>
          <Ionicons name="location" size={20} color="#0a1d56" style={styles.inputIcon} />
          <GooglePlacesAutocomplete
            ref={pickupRef}
            placeholder='Skąd?'
            fetchDetails={true}
            keyboardShouldPersistTaps="handled"
            onPress={(data, details = null) => {
              if (details) {
                const coords = { latitude: details.geometry.location.lat, longitude: details.geometry.location.lng };
                setPickup({ address: data.description, coords });
                setRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
              }
            }}
            // 🔥 AKTUALIZACJA QUERY DLA POLA "SKĄD":
            query={{ 
              key: GOOGLE_MAPS_API_KEY, 
              language: 'pl',
              components: 'country:pl',
              location: `${pickup.coords.latitude},${pickup.coords.longitude}`, 
              radius: '5000', 
            }}
            styles={autocompleteStyles}
            textInputProps={{
              placeholderTextColor: '#999',
            }}
          />
        </View>

        {/* POLE DOKĄD */}
        <View style={[styles.inputWrapper, { zIndex: 5, width: '90%' }]}>
          <Ionicons name="flag" size={20} color="#dc3545" style={styles.inputIcon} />
          <GooglePlacesAutocomplete
            ref={destinationRef}
            placeholder='Dokąd?'
            fetchDetails={true}
            keyboardShouldPersistTaps="handled"
            onPress={(data, details = null) => {
              if (details) {
                const coords = { latitude: details.geometry.location.lat, longitude: details.geometry.location.lng };
                setDestination({ address: data.description, coords });
              }
            }}
            // 🔥 KLUCZOWA ZMIANA TUTAJ:
            query={{ 
              key: GOOGLE_MAPS_API_KEY, 
              language: 'pl',
              components: 'country:pl', // Zostajemy w Polsce
              location: `${pickup.coords.latitude},${pickup.coords.longitude}`, // Twoje aktualne GPS
              radius: '5000', // Szukaj najpierw w promieniu 5km od Ciebie
            }}
            styles={autocompleteStyles}
          />
        </View>

        <Pressable 
          style={[styles.orderButton, (!destination.coords.latitude || loading) && { opacity: 0.7 }]} 
          onPress={handleOrderTrip}
          disabled={loading || !destination.coords.latitude}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>ZAMÓW KURS</Text>}
        </Pressable>
      </Pressable>

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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 1000,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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

const autocompleteStyles = {
  container: {
    flex: 0, 
    width: '100%',
    zIndex: 1000,
  },
  textInput: {
    height: 45,
    color: '#333',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
  listView: {
    position: 'absolute' as const,
    top: 45, 
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 5,
    elevation: 10, 
    zIndex: 5000,
    maxHeight: 200, 
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