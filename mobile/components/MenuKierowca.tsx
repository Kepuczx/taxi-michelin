import React from 'react';
import { StyleSheet, Text, View, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export default function MenuKierowca({ visible, onClose, navigation }: MenuProps) {
  const menuItems = ['Lista zleceń', 'Mapa', 'Nawigacja', 'Pauza', 'Historia kursów'];

  const handleMenuItemPress = (item: string) => {
    onClose();
    if (item === 'Lista zleceń' || item === 'Mapa') {
      navigation.navigate('ZleceniaKierowca');
    } else if (item === 'Historia kursów') {
      navigation.navigate('HistoriaKierowca');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
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
                  <Text style={styles.menuItemText}>{item}</Text>
                </Pressable>
                {index < menuItems.length - 1 && <View style={styles.itemSeparator} />}
              </View>
            ))}
          </View>

          <View style={styles.bottomEmptyBox} />

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 20,
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