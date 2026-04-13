import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { PROVIDER_DEFAULT, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

import MenuPracownik from '../components/MenuPracownik';
import { API_URL } from './config';
import MapViewDirections from 'react-native-maps-directions';

// PODSTAW TWÓJ KLUCZ GOOGLE API
const GOOGLE_MAPS_API_KEY = 'AIzaSyB4jErR8YFq22gziSEFfw8W60v-qsYUoY8';

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
      if (status !== 'granted') {
        Alert.alert('Odmowa', 'Aplikacja potrzebuje GPS do działania.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Odwrócone geokodowanie (opcjonalnie można tu użyć API Google dla nazwy adresu)
      setPickup(prev => ({ ...prev, coords: newCoords }));
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
>          
          {/* Znaczniki (Markery) */}
          <Marker coordinate={pickup.coords} title="Skąd" pinColor="blue" />
          
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
      <View style={styles.searchPanel}>
        <View style={styles.inputWrapper}>
          <Ionicons name="location" size={20} color="#0a1d56" style={styles.inputIcon} />
          <GooglePlacesAutocomplete
            placeholder='Skąd?'
            fetchDetails={true}
            onPress={(data, details = null) => {
              const coords = {
                latitude: details?.geometry.location.lat || 0,
                longitude: details?.geometry.location.lng || 0,
              };
              setPickup({ address: data.description, coords });
              setRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
            }}
            query={{ key: GOOGLE_MAPS_API_KEY, language: 'pl' }}
            styles={autocompleteStyles}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="flag" size={20} color="#dc3545" style={styles.inputIcon} />
          <GooglePlacesAutocomplete
            placeholder='Dokąd?'
            fetchDetails={true}
            onPress={(data, details = null) => {
              const coords = {
                latitude: details?.geometry.location.lat || 0,
                longitude: details?.geometry.location.lng || 0,
              };
              setDestination({ address: data.description, coords });
              // Centrowanie na celu
              setRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
            }}
            query={{ key: GOOGLE_MAPS_API_KEY, language: 'pl' }}
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
    top: 110, // Pod headerem
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 200,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 300,
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
  container: { flex: 1 },
  textInput: {
    height: 45,
    color: '#5d5d5d',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  listView: {
    position: 'absolute',
    top: 45,
    backgroundColor: 'white',
    zIndex: 1000,
    elevation: 10,
  }
};