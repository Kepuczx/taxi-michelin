import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, ImageBackground, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MenuKierowca({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const [courses, setCourses] = useState([
    { id: 1, distance: '500m', passengers: '2 os', from: 'A', to: 'B' },
    { id: 2, distance: '150m', passengers: '1 os', from: 'C', to: 'B' },
    { id: 3, distance: '1km', passengers: '3 os', from: 'A', to: 'C' },
    { id: 4, distance: '700m', passengers: '1 os', from: 'C', to: 'A' },
  ]);

  const menuItems = ['Lista zleceń', 'Mapa', 'Nawigacja', 'Pauza', 'Historia kursów'];

  const toggleSheet = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAccept = (id: number) => {
    setCourses(prevCourses => prevCourses.filter(course => course.id !== id));
  };

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

      <ImageBackground
        source={require('../assets/TempBackground.jpg')}
        style={styles.mapBackground}
        resizeMode="cover"
      >
        <View style={[styles.bottomSheet, { height: isExpanded ? '55%' : 110 }]}>
          <Pressable style={styles.sheetHeader} onPress={toggleSheet}>
            <Text style={styles.sheetTitle}>Dostępne kursy</Text>
            <Ionicons name={isExpanded ? "chevron-down" : "chevron-up"} size={30} color="black" />
          </Pressable>

          {isExpanded && (
            <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
              {courses.length > 0 ? (
                courses.map((course, index) => (
                  <View key={course.id} style={[styles.courseItem, index === courses.length - 1 && styles.lastCourseItem]}>
                    <View>
                      <Text style={styles.courseText}>{course.distance}, {course.passengers}</Text>
                      <Text style={styles.courseText}>Od: {course.from}, Do: {course.to}</Text>
                    </View>
                    <Pressable 
                      style={({ pressed }) => [styles.acceptButton, { opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => handleAccept(course.id)}
                    >
                      <Text style={styles.acceptButtonText}>Akceptuj</Text>
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Brak dostępnych kursów.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </ImageBackground>

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
  mapBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10, 
  },
  sheetTitle: {
    fontSize: 26,
    fontWeight: '500',
    color: '#000',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#a9a9a9',
  },
  lastCourseItem: {
    borderBottomWidth: 0,
  },
  courseText: {
    fontSize: 18,
    color: '#000',
    marginBottom: 2,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
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