import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import API_BASE_URL from '../config';

export default function PerfilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil del Usuario</Text>
      {/* Aquí puedes agregar el contenido del perfil */}
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