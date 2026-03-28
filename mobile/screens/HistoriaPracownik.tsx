import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HistoriaPracownik({ navigation }: any) {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);

  const menuItems = ['Rezerwacja auta', 'Zamów TAXI', 'Status przejazdu', 'Zgłoś usterkę', 'Historia przejazdów'];

  const handleMenuItemPress = (item: string) => {
    setSideMenuVisible(false);

    if (item === 'Historia przejazdów') {
      navigation.navigate('HistoriaPracownik');
    } else if (item === 'Zamów TAXI') {
      navigation.navigate('MenuPracownik');
    }
  };

  const historia = [
    { id: 1, data: '25 luty', godz: '10.34', pojazd: 'NO XXXXX', kierowca: 'XXXX', od: 'A', do: 'B', miesiac: 'Luty 2026' },
    { id: 2, data: '14 luty', godz: '14.21', pojazd: 'NO XXXXX', kierowca: 'XXXX', od: 'A', do: 'B' },
    { id: 3, data: '28 sty', godz: '12.49', pojazd: 'NO XXXXX', kierowca: 'XXXX', od: 'A', do: 'B', miesiac: 'Styczeń 2026' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/MichelinLogo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Pressable onPress={() => setSideMenuVisible(true)} style={styles.menuButton}>
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
                <Text style={styles.historyTextBold}>{item.data}, {item.godz}</Text>
                <Text style={styles.historyTextRegular}>Pojazd: {item.pojazd}, Kierowca: {item.kierowca}</Text>
                <Text style={styles.historyTextRegular}>Od: {item.od}, Do: {item.do}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={sideMenuVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setSideMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSideMenuVisible(false)}>
          <Pressable style={styles.sideMenuContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.profileBox}>
              <Ionicons name="person-circle-outline" size={50} color="#1a1a1a" />
              <Text style={styles.profileText}>Profil</Text>
            </View>

            <View style={styles.sectionSeparator} />

            <View style={styles.menuListSection}>
              {menuItems.map((item, index) => (
                <View key={index}>
                  <Pressable style={styles.menuItem} onPress={() => handleMenuItemPress(item)}>
                    {item === 'Historia przejazdów' ? (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.menuItemText}>Historia</Text>
                        <Text style={styles.menuItemText}>przejazdów</Text>
                      </View>
                    ) : (
                      <Text style={styles.menuItemText}>{item}</Text>
                    )}
                  </Pressable>
                  {index < menuItems.length - 1 && <View style={styles.itemSeparator} />}
                </View>
              ))}
            </View>
            <View style={styles.bottomEmptyBox} />
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
  monthHeader: {
    fontSize: 26,
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
  historyTextBold: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
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
    width: '60%',
    backgroundColor: '#0a1d56',
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 25,
  },
  profileBox: {
    backgroundColor: '#cdd4e0',
    borderRadius: 12,
    marginHorizontal: 15,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  profileText: {
    fontSize: 24,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  sectionSeparator: {
    height: 4,
    backgroundColor: '#0a1d56',
    marginVertical: 12,
  },
  menuListSection: {
    backgroundColor: '#cdd4e0',
    borderRadius: 12,
    marginHorizontal: 15,
    paddingVertical: 10,
  },
  menuItem: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemText: {
    fontSize: 22,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  itemSeparator: {
    height: 1.5,
    backgroundColor: '#1a1a1a',
    width: '80%',
    alignSelf: 'center',
  },
  bottomEmptyBox: {
    backgroundColor: '#cdd4e0',
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 15,
    flex: 1,
    marginBottom: 20,
  },
});