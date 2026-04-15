import React from 'react';
import { StyleSheet, Text, View, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MenuPracownik({ visible, onClose, navigation }: any) {
  
  const handleLogout = () => {
    Alert.alert(
      'Wylogowanie',
      'Czy na pewno chcesz się wylogować?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
            await AsyncStorage.removeItem('userEmail');
            onClose(); // Zamknij menu przed nawigacją
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const navigateTo = (screenName: string) => {
    onClose();
    navigation.navigate(screenName);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        {/* Niewidzialny przycisk na ciemnym tle, który zamyka menu po kliknięciu poza nim */}
        <Pressable style={styles.backgroundTap} onPress={onClose} />

        {/* Prawy panel menu */}
        <View style={styles.menuContainer}>
          
          {/* Nagłówek Menu */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuHeaderText}>Menu Pracownika</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={30} color="#333" />
            </Pressable>
          </View>

          {/* Opcje Menu */}
          <View style={styles.menuItems}>
            <Pressable style={styles.menuItem} onPress={() => navigateTo('ZamowieniePracownik')}>
              <Ionicons name="car-outline" size={24} color="#0a1d56" style={styles.icon} />
              <Text style={styles.menuItemText}>Zamów kurs</Text>
            </Pressable>

            <Pressable style={styles.menuItem} onPress={() => navigateTo('HistoriaPracownik')}>
              <Ionicons name="time-outline" size={24} color="#0a1d56" style={styles.icon} />
              <Text style={styles.menuItemText}>Historia przejazdów</Text>
            </Pressable>
          </View>

          {/* Przycisk Wyloguj na samym dole */}
          <View style={styles.menuFooter}>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#dc3545" style={styles.icon} />
              <Text style={styles.logoutButtonText}>Wyloguj się</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Przyciemnienie tła
    flexDirection: 'row',
  },
  backgroundTap: {
    flex: 1, // Zajmuje lewą stronę ekranu
  },
  menuContainer: {
    width: '75%', // Menu zajmuje 75% szerokości z prawej strony
    backgroundColor: '#ffffff',
    height: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15, // Cień na Androidzie
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    marginTop: 30, // Margines od góry (na notcha/pasek statusu)
    marginBottom: 20,
  },
  menuHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0a1d56',
  },
  closeButton: {
    padding: 5,
  },
  menuItems: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  icon: {
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 18,
    color: '#333',
  },
  menuFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginBottom: 20, // Odsunięcie od dolnej krawędzi ekranu
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545', // Czerwony kolor ostrzegawczy
  },
});