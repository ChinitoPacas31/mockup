import 'react-native-gesture-handler'; // debe estar al inicio
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import RegistroScreen from './screens/RegistroScreen';
import IncubadorasScreen from './screens/IncubadoraScreen';
import HomeScreen from './screens/HomeScreen';
import AgregarIncubadora from './screens/AgregarIncubadoraScreen';
import DetalleIncubadora from './screens/DetalleIncubadoraScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegistroScreen} />
        <Stack.Screen name="Incubadoras" component={IncubadorasScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AgregarIncubadora" component={AgregarIncubadora} />
        <Stack.Screen name="DetalleIncubadora" component={DetalleIncubadora} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
