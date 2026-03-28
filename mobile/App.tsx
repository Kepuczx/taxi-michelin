import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import MainKierowca from './screens/MainKierowca';
import MenuKierowca from './screens/MenuKierowca';
import HistoriaKierowca from './screens/HistoriaKierowca';
import MenuPracownik from './screens/MenuPracownik';
import HistoriaPracownik from './screens/HistoriaPracownik';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        
        <Stack.Screen name="MainKierowca" component={MainKierowca} />
        <Stack.Screen name="MenuKierowca" component={MenuKierowca} />
        <Stack.Screen name="HistoriaKierowca" component={HistoriaKierowca} />

        <Stack.Screen name="MenuPracownik" component={MenuPracownik} />
        <Stack.Screen name="HistoriaPracownik" component={HistoriaPracownik} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}