import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, ImageBackground, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MenuKierowca from '../components/MenuKierowca';

export default function ZleceniaKierowca({ navigation }: any) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const courses = [
    { id: 1, distance: '500m', passengers: '2 os', from: 'A', to: 'B' },
    { id: 2, distance: '150m', passengers: '1 os', from: 'C', to: 'B' },
    { id: 3, distance: '1km', passengers: '3 os', from: 'A', to: 'C' },
  ];

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
            navigation.replace('Login');
          },
        },
      ]
    );
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
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Wyloguj</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <ImageBackground
          source={require('../assets/TempBackground.jpg')}
          style={styles.mapBackground}
          resizeMode="cover"
        >
          <View style={[styles.bottomSheet, { height: isExpanded ? '50%' : 100 }]}>
            <Pressable style={styles.sheetHeader} onPress={() => setIsExpanded(!isExpanded)}>
              <Text style={styles.sheetTitle}>Dostępne kursy</Text>
              <Ionicons name={isExpanded ? "chevron-down" : "chevron-up"} size={35} color="black" />
            </Pressable>

            {isExpanded && (
              <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
                {courses.map((course, index) => (
                  <View key={course.id} style={[styles.courseItem, index === courses.length - 1 && styles.lastCourseItem]}>
                    <View>
                      <Text style={styles.courseText}>{course.distance}, {course.passengers}</Text>
                      <Text style={styles.courseText}>Od: {course.from}, Do: {course.to}</Text>
                    </View>
                    <Pressable style={styles.acceptButton}>
                      <Text style={styles.acceptButtonText}>Akceptuj</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </ImageBackground>
      </View>

      <MenuKierowca 
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
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
  },
  mapBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  lastCourseItem: {
    borderBottomWidth: 0,
  },
  courseText: {
    fontSize: 18,
    color: '#333',
    lineHeight: 26,
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});