import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import API_BASE_URL from '../config';

export default function AjustesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>
      {/* Aquí puedes agregar el contenido de ajustes */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});