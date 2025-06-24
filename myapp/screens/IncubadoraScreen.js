import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

export default function IncubadorasScreen({ route }) {
  const { userId } = route.params; // recibido desde login
  const [incubadoras, setIncubadoras] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarIncubadoras = async () => {
    try {
      const res = await axios.get(`http://10.100.0.90:5000/api/incubadoras/${userId}`);
      setIncubadoras(res.data);
    } catch (error) {
      console.error('Error cargando incubadoras:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarIncubadoras();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tus Incubadoras</Text>
      <FlatList
        data={incubadoras}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text>Código: {item.codigo}</Text>
            <Text>Ubicación: {item.ubicacion}</Text>
            <Text>Tipo de ave: {item.tipo_ave}</Text>
            <Text>Estado: {item.activa ? 'Activa' : 'Inactiva'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 10, fontWeight: 'bold' },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 15,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
