import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MenuPracownik from '../components/MenuPracownik';

export default function HistoriaPracownik({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);

  const historia = [
    { id: 1, data: '25 luty, 10.34', pojazd: 'NO XXXXX', kierowca: 'XXXX', trasa: 'Od: A, Do: B', miesiac: 'Luty 2026' },
    { id: 2, data: '14 luty, 14.21', pojazd: 'NO XXXXX', kierowca: 'XXXX', trasa: 'Od: A, Do: B' },
    { id: 3, data: '28 sty, 12.49', pojazd: 'NO XXXXX', kierowca: 'XXXX', trasa: 'Od: A, Do: B', miesiac: 'Styczeń 2026' },
    { id: 4, data: '22 sty, 8.29', pojazd: 'NO XXXXX', kierowca: 'XXXX', trasa: 'Od: A, Do: B' },
    { id: 5, data: '18 sty, 15.04', pojazd: 'NO XXXXX', kierowca: 'XXXX', trasa: 'Od: A, Do: B' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/MichelinLogo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Pressable onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={45} color="white" />
        </Pressable>
      </View>

      <Text style={styles.title}>Historia przejazdów</Text>

      <View style={styles.listContainer}>
        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
          {historia.map((item, index) => (
            <View key={item.id}>
              {item.miesiac && <Text style={styles.monthHeader}>{item.miesiac}</Text>}
              <View style={[styles.historyItem, index === historia.length - 1 && styles.lastHistoryItem]}>
                <Text style={styles.historyText}>{item.data}</Text>
                <Text style={styles.historyText}>Pojazd: {item.pojazd}, Kierowca: {item.kierowca}</Text>
                <Text style={styles.historyText}>{item.trasa}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
  logoImage: {
    width: 220,
    height: 60,
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
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
  },
});