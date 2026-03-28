import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoriaKierowca({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = ['Lista zleceń', 'Mapa', 'Nawigacja', 'Pauza', 'Historia kursów'];

  const historiaKursow = [
    { id: 1, data: '05.01.2024r', godz: '14:15', trasa: 'A - B', pasazerow: '2 os.' },
    { id: 2, data: '04.01.2024r', godz: '09:30', trasa: 'C - B', pasazerow: '1 os.' },
    { id: 3, data: '04.01.2024r', godz: '08:00', trasa: 'A - C', pasazerow: '3 os.' },
    { id: 4, data: '03.01.2024r', godz: '16:45', trasa: 'C - A', pasazerow: '1 os.' },
    { id: 5, data: '02.01.2024r', godz: '11:12', trasa: 'B - A', pasazerow: '2 os.' },
    { id: 6, data: '02.01.2024r', godz: '07:05', trasa: 'A - B', pasazerow: '2 os.' },
    { id: 7, data: '01.01.2024r', godz: '10:00', trasa: 'C - B', pasazerow: '1 os.' },
  ];

  const handleMenuItemPress = (item: string) => {
    setMenuVisible(false);
    if (item === 'Lista zleceń') {
      navigation.navigate('MenuKierowca');
    } else if (item === 'Historia kursów') {
      navigation.navigate('HistoriaKierowca');
    }
  };

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

      <Text style={styles.title}>Historia kursów</Text>

      <View style={styles.listContainer}>
        <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
          {historiaKursow.map((item, index) => (
            <View key={item.id} style={[styles.historyItem, index === historiaKursow.length - 1 && styles.lastHistoryItem]}>
              <Text style={styles.historyTextBold}>Data: {item.data}, Godz: {item.godz}</Text>
              <Text style={styles.historyTextRegular}>Trasa: {item.trasa}, Pasażerów: {item.pasazerow}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.sideMenuContainer}>
            
            <View style={styles.profileBox}>
              <Ionicons name="person-circle-outline" size={50} color="#1a1a1a" />
              <Text style={styles.profileText}>Profil</Text>
            </View>

            <View style={styles.sectionSeparator}></View>

            <View style={styles.menuListSection}>
              {menuItems.map((item, index) => (
                <Pressable key={index} style={styles.menuItem} onPress={() => handleMenuItemPress(item)}>
                  <Text style={styles.menuItemText}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.bottomEmptyBox}></View>

          </Pressable>
        </Pressable>
      </Modal>
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
  logoImage: {
    width: 220, 
    height: 60,
  },
  menuButton: {
    padding: 0,
  },
  title: {
    fontSize: 34,
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
  historyItem: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#a9a9a9',
  },
  lastHistoryItem: {
    borderBottomWidth: 0,
  },
  historyTextBold: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  historyTextRegular: {
    fontSize: 18,
    color: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sideMenuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '55%',
    backgroundColor: '#0a1d56',
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
  },
  profileBox: {
    backgroundColor: '#cdd4e0',
    borderRadius: 10,
    marginHorizontal: 15,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  profileText: {
    fontSize: 22,
    color: '#1a1a1a',
  },
  sectionSeparator: {
    height: 3,
    backgroundColor: '#0a1d56',
    marginHorizontal: 15,
    marginVertical: 10,
  },
  menuListSection: {
    backgroundColor: '#cdd4e0',
    borderRadius: 10,
    marginHorizontal: 15,
    paddingVertical: 10,
  },
  menuItem: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 0,
    marginHorizontal: 30,
  },
  menuItemText: {
    fontSize: 22,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  bottomEmptyBox: {
    backgroundColor: '#cdd4e0',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 15,
    flex: 1,
  },
});