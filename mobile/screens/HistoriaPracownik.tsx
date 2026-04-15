import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ScrollView, 
  Image, 
  Alert, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import MenuPracownik from '../components/MenuPracownik';
import { API_URL } from './config';

// Definiujemy interfejs pojedynczego kursu z bazy danych
interface Trip {
  id: number;
  createdAt: string; // Zakładam, że backend zwraca datę utworzenia
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  driver?: {
    firstName: string;
    lastName: string;
  };
  vehicle?: {
    registration: string;
    brand: string;
  };
}

export default function HistoriaPracownik({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Funkcja pobierająca historię kursów z backendu
  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token || !userId) return;

      // 🔥 UWAGA: Upewnij się, że ten endpoint pasuje do Twojego backendu
      const response = await axios.get(`${API_URL}/trips/client/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Sortowanie od najnowszych
      const sortedTrips = response.data.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setTrips(sortedTrips);
    } catch (error) {
      console.error('Błąd pobierania historii:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać historii przejazdów.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  // Funkcja mapująca historię z grupowaniem po miesiącach
  const renderHistory = () => {
    if (trips.length === 0) {
      return (
        <Text style={{ textAlign: 'center', marginTop: 30, color: '#666', fontSize: 16 }}>
          Brak historii przejazdów.
        </Text>
      );
    }

    let currentMonth = '';

    return trips.map((trip, index) => {
      // Formatowanie daty
      const tripDate = new Date(trip.createdAt);
      const rawMonthYear = tripDate.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
      const formattedMonthYear = rawMonthYear.charAt(0).toUpperCase() + rawMonthYear.slice(1);
      
      const isNewMonth = formattedMonthYear !== currentMonth;
      if (isNewMonth) {
        currentMonth = formattedMonthYear;
      }

      const dateString = `${tripDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}, ${tripDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
      
      // Obsługa brakującego kierowcy/pojazdu (gdy np. kurs dopiero czeka)
      const driverInfo = trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Oczekuje...';
      const vehicleInfo = trip.vehicle ? trip.vehicle.registration : '-';
      
      // Mapowanie statusu na przyjazny tekst
      const statusText = trip.status === 'oczekujący' ? '⏳ W trakcie szukania' 
                       : trip.status === 'w toku' ? '🚗 W trakcie' 
                       : trip.status === 'zakończony' ? '✅ Zakończony' 
                       : trip.status;

      return (
        <View key={trip.id}>
          {isNewMonth && <Text style={styles.monthHeader}>{formattedMonthYear}</Text>}
          <View style={[styles.historyItem, index === trips.length - 1 && styles.lastHistoryItem]}>
            <Text style={[styles.historyText, { fontWeight: 'bold' }]}>
              {dateString}  •  {statusText}
            </Text>
            <Text style={styles.historyText}>Kierowca: {driverInfo} ({vehicleInfo})</Text>
            <Text style={styles.historyText} numberOfLines={1}>Od: {trip.pickupAddress}</Text>
            <Text style={styles.historyText} numberOfLines={1}>Do: {trip.dropoffAddress}</Text>
          </View>
        </View>
      );
    });
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
          {/* USUNIĘTO: stary przycisk Wyloguj */}
        </View>
      </View>

      <Text style={styles.title}>Historia przejazdów</Text>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#0a1d56" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView 
            bounces={true} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a1d56']} />
            }
          >
            {renderHistory()}
          </ScrollView>
        )}
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
    backgroundColor: '#e6e6e6',
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
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#415a99',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  listContainer: {
    backgroundColor: '#d9d9d9',
    marginHorizontal: 20,
    borderRadius: 15,
    flex: 1,
    marginBottom: 40,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  monthHeader: {
    fontSize: 20,
    color: '#000',
    marginHorizontal: 25,
    marginTop: 15,
    marginBottom: 5,
    fontWeight: '600',
  },
  historyItem: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#a9a9a9',
  },
  lastHistoryItem: {
    borderBottomWidth: 0,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});