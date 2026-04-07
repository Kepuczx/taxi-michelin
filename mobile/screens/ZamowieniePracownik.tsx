import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MenuPracownik from '../components/MenuPracownik';

export default function ZamowieniePracownik({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);

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
  logoImage: {
    width: 220,
    height: 60,
    backgroundColor: '#fff',
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