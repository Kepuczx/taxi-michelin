import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, ImageBackground, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MenuPracownik({ navigation }: any) {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);

  const menuItems = ['Rezerwacja auta', 'Zamów TAXI', 'Status przejazdu', 'Zgłoś usterkę', 'Historia przejazdów'];

  const handleMenuItemPress = (item: string) => {
    setSideMenuVisible(false);

    if (item === 'Historia przejazdów') {
      navigation.navigate('HistoriaPracownik');
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
        <Pressable onPress={() => setSideMenuVisible(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={45} color="white" />
        </Pressable>
      </View>

      <View style={styles.mapContainer}>
        <ImageBackground
          source={require('../assets/TempBackground.jpg')}
          style={styles.mapBackground}
          resizeMode="cover"
        />
      </View>

      <View style={styles.fixedOrderTaxiPanel}>
        <Pressable style={styles.orderTaxiPanelContainer}>
          <Pressable style={styles.searchBarContainer}>
            <Text style={styles.searchText}>Dokąd?</Text>
          </Pressable>
        </Pressable>
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
  mapContainer: {
    flex: 1,
    zIndex: 1,
  },
  mapBackground: {
    flex: 1,
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
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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