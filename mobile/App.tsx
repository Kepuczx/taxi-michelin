import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  // Funkcja, która odpali się po kliknięciu przycisku
  const handlePress = () => {
    Alert.alert("Brum brum! 🚕", "Twoja wirtualna taksówka jest w drodze!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System TAXI</Text>
      <Text style={styles.subtitle}>Test połączenia z telefonem</Text>

      {/* Nasz główny przycisk */}
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>Zamów wirtualne auto</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

// Tutaj definiujemy wygląd (CSS dla aplikacji mobilnych)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Ciemny motyw
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700', // Taksówkowy żółty
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FFD700', 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25, // Zaokrąglone rogi
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
});