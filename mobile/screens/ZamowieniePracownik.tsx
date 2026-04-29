import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, Keyboard, Dimensions, Animated, PanResponder, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import MapView, { PROVIDER_DEFAULT, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

import MapViewDirections from 'react-native-maps-directions';
import { GOOGLE_MAPS_API_KEY, API_URL } from './config';

export default function ZamowieniePracownik({ navigation }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [firstName, setFirstName] = useState<string>('Pracownik');
  const mapRef = useRef<MapView>(null);
  
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

  const [passengerCount, setPassengerCount] = useState<number>(1);

  // --- BOTTOM SHEET LOGIC ---
  const screenHeight = Dimensions.get('window').height;
  const MAX_HEIGHT = screenHeight * 0.85; 
  const MIN_HEIGHT = 100;                 
  const MID_HEIGHT = 450; 

  const animatedHeight = useRef(new Animated.Value(MID_HEIGHT)).current;
  const currentHeight = useRef(MID_HEIGHT);

  useEffect(() => {
    const listener = animatedHeight.addListener(({ value }) => {
      currentHeight.current = value;
    });
    return () => animatedHeight.removeListener(listener);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Keyboard.dismiss(); 
        animatedHeight.setOffset(currentHeight.current);
        animatedHeight.setValue(0);
      },
      onPanResponderMove: (e, gestureState) => {
        animatedHeight.setValue(-gestureState.dy);
      },
      onPanResponderRelease: () => {
        animatedHeight.flattenOffset();
        
        let targetHeight = MID_HEIGHT;
        if (currentHeight.current > MID_HEIGHT + 50) targetHeight = MAX_HEIGHT;
        else if (currentHeight.current < MID_HEIGHT - 50) targetHeight = MIN_HEIGHT;
        
        if (targetHeight > MAX_HEIGHT) targetHeight = MAX_HEIGHT;
        if (targetHeight < MIN_HEIGHT) targetHeight = MIN_HEIGHT;

        Animated.spring(animatedHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          friction: 8,
          tension: 50
        }).start();
      }
    })
  ).current;

  const TextLogo = () => (
    <View style={{ backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 }}>
      <Text style={{ color: '#0a1d56', fontWeight: '900', fontSize: 20, fontStyle: 'italic', letterSpacing: 1 }}>MICHELIN</Text>
    </View>
  );

  useEffect(() => {
    const fetchUserData = async () => {
      const name = await AsyncStorage.getItem('userName');
      if (name) setFirstName(name.split(' ')[0]);
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    })();
  }, []);

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Odmowa', 'Aplikacja potrzebuje GPS do działania.');
        setLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const newCoords = { latitude: location.coords.latitude, longitude: location.coords.longitude };

      const [addressObj] = await Location.reverseGeocodeAsync(newCoords);
      const myAddr = addressObj 
        ? `${addressObj.street || ''} ${addressObj.name || ''}, ${addressObj.city || ''}`.trim().replace(/^,/, '')
        : "Moja lokalizacja";
      
      setPickup({ address: myAddr, coords: newCoords });
      pickupRef.current?.setAddressText(myAddr); 
      setRegion({ ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      
      if (mapRef.current) {
        mapRef.current.animateToRegion({ ...newCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 1000);
      }
    } catch (err) {
      Alert.alert('Błąd', 'Nie udało się pobrać lokalizacji.');
    } finally {
      setLoadingLocation(false);
    }
  };

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
      destinationRef.current?.setAddressText(fullAddress); 
    } catch (err) {
      setDestination({ address: "Wybrany punkt", coords });
      destinationRef.current?.setAddressText("Wybrany punkt");
    }
  };

  const handleOrderTrip = async () => {
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
        passengerCount: passengerCount,
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
      Alert.alert("Błąd", "Nie udało się zamówić kursu.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Wylogowanie', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Wyloguj', style: 'destructive', onPress: async () => { await AsyncStorage.clear(); navigation.replace('Login'); } },
    ]);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextLogo />
        <View style={styles.headerButtons}>
          <Text style={{ color: 'white', marginRight: 15, fontWeight: 'bold' }}>Witaj, {firstName}!</Text>
          <Pressable onPress={toggleMenu} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color="white" />
          </Pressable>
        </View>
      </View>

      {isMenuOpen && <Pressable style={styles.overlay} onPress={closeMenu} />}
      <View style={[styles.sideMenu, isMenuOpen && styles.sideMenuOpen]}>
        <Pressable style={styles.closeMenuBtn} onPress={closeMenu}>
          <Ionicons name="close" size={28} color="#333" />
        </Pressable>
        <View style={styles.menuHeader}>
          <Text style={styles.menuHeaderText}>Twój Profil</Text>
        </View>

        <Pressable style={styles.menuItem} onPress={() => { console.log('Rezerwacja auta - w budowie'); closeMenu(); }}>
          <Text style={styles.menuItemText}>Rezerwacja auta</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => { console.log('Zamów TAXI - w budowie'); closeMenu(); }}>
          <Text style={styles.menuItemText}>Zamów TAXI</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => { console.log('Status przejazdu - w budowie'); closeMenu(); }}>
          <Text style={styles.menuItemText}>Status przejazdu</Text>
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => { console.log('Zgłoś usterkę - w budowie'); closeMenu(); }}>
          <Text style={styles.menuItemText}>Zgłoś usterkę</Text>
        </Pressable>

        <View style={styles.menuBottom}>
          <Pressable style={styles.menuItem} onPress={() => { closeMenu(); navigation.navigate('HistoriaPracownik'); }}>
            <Text style={styles.menuItemText}>Historia przejazdów</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.logoutText}>Wyloguj się</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.mapBackground}
          provider={PROVIDER_DEFAULT}
          region={region}
          showsUserLocation={true}
          onPress={onMapPress}
        >          
          {pickup.coords.latitude !== 0 && (
            <Marker coordinate={pickup.coords} title="Skąd" pinColor="blue" />
          )}
          
          {destination.coords.latitude !== 0 && (
            <>
              <Marker coordinate={destination.coords} title="Dokąd" pinColor="red" />

              {pickup.coords.latitude !== 0 && (
                <MapViewDirections
                  origin={pickup.coords}
                  destination={destination.coords}
                  apikey={GOOGLE_MAPS_API_KEY}
                  strokeWidth={5}
                  strokeColor="#0a1d56"
                  optimizeWaypoints={true}
                  onReady={(result) => {
                    mapRef.current?.fitToCoordinates(result.coordinates, {
                      edgePadding: { right: 50, bottom: 420, left: 50, top: 50 },
                    });
                  }}
                />
              )}
            </>
          )}
        </MapView>
      </View>

      <Animated.View style={[styles.bottomSheet, { height: animatedHeight }]}>
        
        <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
          <View style={styles.dragPill} />
          <Text style={styles.formTitle}>Zaplanuj trasę</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          
          <Text style={styles.inputLabel}>MIEJSCE ODBIORU</Text>
          <View style={styles.inputRow}>
            <View style={[styles.inputWrapper, { flex: 1, zIndex: 10 }]}>
              <Ionicons name="location" size={20} color="#0a1d56" style={styles.inputIcon} />
              <GooglePlacesAutocomplete
                ref={pickupRef}
                placeholder='Wpisz adres lub nazwę miejsca...'
                fetchDetails={true}
                keyboardShouldPersistTaps="handled"
                onPress={(data, details = null) => {
                  if (details) {
                    const coords = { latitude: details.geometry.location.lat, longitude: details.geometry.location.lng };
                    setPickup({ address: data.description, coords });
                    setRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
                  }
                }}
                query={{ 
                  key: GOOGLE_MAPS_API_KEY, language: 'pl', types: 'address', components: 'country:pl',
                  location: '53.7784,20.4801', radius: '20000', strictbounds: true,
                }}
                styles={autocompleteStyles}
                textInputProps={{ placeholderTextColor: '#999', onFocus: () => { Animated.spring(animatedHeight, { toValue: MAX_HEIGHT, useNativeDriver: false }).start(); } }}
              />
            </View>
            
            <Pressable style={styles.locationBtn} onPress={getCurrentLocation} disabled={loadingLocation}>
              {loadingLocation ? <ActivityIndicator size="small" color="#0a1d56" /> : <Ionicons name="locate" size={22} color="#0a1d56" />}
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>MIEJSCE DOCELOWE</Text>
          <View style={[styles.inputWrapper, { zIndex: 5 }]}>
            <Ionicons name="flag" size={20} color="#dc3545" style={styles.inputIcon} />
            <GooglePlacesAutocomplete
              ref={destinationRef}
              placeholder='Wpisz adres lub nazwę miejsca...'
              fetchDetails={true}
              keyboardShouldPersistTaps="handled"
              onPress={(data, details = null) => {
                if (details) {
                  const coords = { latitude: details.geometry.location.lat, longitude: details.geometry.location.lng };
                  setDestination({ address: data.description, coords });
                }
              }}
              query={{ 
                key: GOOGLE_MAPS_API_KEY, language: 'pl', types: 'address', components: 'country:pl',
                location: '53.7784,20.4801', radius: '20000', strictbounds: true,
              }}
              styles={autocompleteStyles}
              textInputProps={{ placeholderTextColor: '#999', onFocus: () => { Animated.spring(animatedHeight, { toValue: MAX_HEIGHT, useNativeDriver: false }).start(); } }}
            />
          </View>

          {/* HINT PRZENIESIONY BEZPOŚREDNIO POD POLE DOCELOWE */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintTitle}>🎯 LUB ZAZNACZ NA MAPIE</Text>
            <Text style={styles.hintText}>Kliknij w dowolne miejsce na mapie, aby ustawić cel podróży</Text>
          </View>

          <Text style={styles.inputLabel}>LICZBA PASAŻERÓW</Text>
          <View style={styles.passengerContainer}>
            <Pressable 
              style={[styles.counterBtn, passengerCount <= 1 && styles.counterBtnDisabled]} 
              onPress={() => setPassengerCount(p => Math.max(1, p - 1))}
            >
              <Ionicons name="remove" size={24} color="white" />
            </Pressable>
            <Text style={styles.passengerCountText}>{passengerCount}</Text>
            <Pressable 
              style={[styles.counterBtn, passengerCount >= 8 && styles.counterBtnDisabled]} 
              onPress={() => setPassengerCount(p => Math.min(8, p + 1))}
            >
              <Ionicons name="add" size={24} color="white" />
            </Pressable>
          </View>

          <Pressable 
            style={[styles.orderButton, (!destination.coords.latitude || !pickup.coords.latitude || loading) && { opacity: 0.7 }]} 
            onPress={handleOrderTrip}
            disabled={loading || !destination.coords.latitude || !pickup.coords.latitude}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.orderButtonText}>ZAMÓW PRZEJAZD</Text>}
          </Pressable>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: {
    backgroundColor: '#0a1d56', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3,
  },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { padding: 0 },
  mapContainer: { flex: 1, backgroundColor: '#e0e0e0' },
  mapBackground: { ...StyleSheet.absoluteFillObject },
  
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1500 },
  sideMenu: {
    position: 'absolute', top: 0, right: '-100%', bottom: 0, width: 280,
    backgroundColor: '#fff', zIndex: 2000, paddingTop: 60, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 15,
  },
  sideMenuOpen: { right: 0 },
  closeMenuBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  menuHeader: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15, marginBottom: 10 },
  menuHeaderText: { fontSize: 20, fontWeight: 'bold', color: '#0a1d56' },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f4f6f9' },
  menuItemText: { fontSize: 16, color: '#333', fontWeight: '500' },
  menuBottom: { marginTop: 'auto', marginBottom: 40, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  logoutText: { fontSize: 16, color: '#dc3545', fontWeight: 'bold' },

  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#f4f6f9',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.2, shadowOffset: { width: 0, height: -5 },
    shadowRadius: 10, elevation: 20, zIndex: 1000,
  },
  dragHandleArea: {
    paddingTop: 15, paddingBottom: 10,
    alignItems: 'center', backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderBottomWidth: 1, borderBottomColor: '#ddd',
  },
  dragPill: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, marginBottom: 10 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#0a1d56' },
  
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, marginTop: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', zIndex: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-start', zIndex: 10 },
  inputIcon: { marginRight: 10, marginTop: 12 }, 
  
  locationBtn: {
    width: 45, height: 45, marginLeft: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 3, elevation: 2,
  },

  hintContainer: { marginTop: 5, marginBottom: 5, padding: 15, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  hintTitle: { color: '#0a1d56', fontWeight: 'bold', fontSize: 13 },
  hintText: { fontSize: 12, color: '#666', marginTop: 3 },

  passengerContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    paddingHorizontal: 15, paddingVertical: 5, marginTop: 5, marginBottom: 15
  },
  counterBtn: {
    backgroundColor: '#0a1d56', width: 35, height: 35, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center'
  },
  counterBtnDisabled: { opacity: 0.5 },
  passengerCountText: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  orderButton: { backgroundColor: '#0a1d56', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  orderButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

const autocompleteStyles = {
  container: { flex: 1, zIndex: 1000 },
  textInput: {
    height: 45, color: '#333', fontSize: 14,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    backgroundColor: '#ffffff', paddingHorizontal: 15,
  },
  listView: {
    position: 'relative' as const, 
    backgroundColor: 'white', borderRadius: 8,
    elevation: 3, marginTop: 5, maxHeight: 150, zIndex: 5000,
  },
  row: { backgroundColor: '#FFFFFF', padding: 13, minHeight: 44, flexDirection: 'row' as const },
  separator: { height: 1, backgroundColor: '#eee' },
};