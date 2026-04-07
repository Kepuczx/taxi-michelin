import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import MainKierowca from './screens/MainKierowca';
import ZleceniaKierowca from './screens/ZleceniaKierowca';
import HistoriaKierowca from './screens/HistoriaKierowca';
import ZamowieniePracownik from './screens/ZamowieniePracownik';
import HistoriaPracownik from './screens/HistoriaPracownik';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        
        <Stack.Screen name="MainKierowca" component={MainKierowca} />
        <Stack.Screen name="ZleceniaKierowca" component={ZleceniaKierowca} />
        <Stack.Screen name="HistoriaKierowca" component={HistoriaKierowca} />
        
        <Stack.Screen name="ZamowieniePracownik" component={ZamowieniePracownik} />
        <Stack.Screen name="HistoriaPracownik" component={HistoriaPracownik} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}