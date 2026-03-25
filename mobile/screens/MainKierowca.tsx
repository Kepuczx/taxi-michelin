import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image } from 'react-native';

export default function MainKierowca() {
  const cars = ['NO XXXXX', 'NO XXXXX', 'NO XXXXX', 'NO XXXXX', 'NO XXXXX'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/MichelinLogo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>Wybierz samochód</Text>

      <View style={styles.listContainer}>
        <ScrollView bounces={false}>
          {cars.map((car, index) => (
            <View key={index} style={[styles.listItem, index === cars.length - 1 && styles.lastItem]}>
              <Text style={styles.carText}>{car}</Text>
              <Pressable style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}>
                <Text style={styles.buttonText}>Wybierz</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
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
  },
  logoImage: {
    width: 220, 
    height: 60,
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
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#a9a9a9',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  carText: {
    fontSize: 24,
    color: '#000',
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
});