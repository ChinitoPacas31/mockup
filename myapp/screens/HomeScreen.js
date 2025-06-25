// screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

export default function HomeScreen({ route }) {
  const { user_id, nombre } = route.params;
  const [incubadoras, setIncubadoras] = useState([]);

  useEffect(() => {
    const fetchIncubadoras = async () => {
      try {
        const res = await axios.get(`http://192.168.1.144:5000/api/incubadoras/${user_id}`);
        setIncubadoras(res.data);
      } catch (error) {
        console.error('Error al obtener incubadoras:', error);
      }
    };

    fetchIncubadoras();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola {nombre}</Text>
      <FlatList
        data={incubadoras}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.nombre}</Text>
            <Text>Código: {item.codigo}</Text>
            <Text>Ubicación: {item.ubicacion}</Text>
            <Text>Tipo de ave: {item.tipo_ave}</Text>
            <Text>Activa: {item.activa ? 'Sí' : 'No'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 30 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  card: { padding: 15, backgroundColor: '#e0f7fa', marginBottom: 10, borderRadius: 8 },
  name: { fontSize: 18, fontWeight: 'bold' },
});
