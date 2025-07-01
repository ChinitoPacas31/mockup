import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function DetalleIncubadora({ route, navigation }) {
  const { incubadoraId, userId } = route.params; // Asegúrate de recibir userId
  const [incubadora, setIncubadora] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState([]);
  const [showRegistros, setShowRegistros] = useState(false);

  useEffect(() => {
    const cargarDetalles = async () => {
      try {
        // Cambia la URL para que coincida con tu API Flask
        const res = await axios.get(`http://192.168.1.144:5000/api/incubadora/${incubadoraId}`);
        setIncubadora(res.data);
        
        // Carga los registros si es necesario
        const resRegistros = await axios.get(`http://192.168.1.144:5000/api/incubadora/${incubadoraId}/registros`);
        setRegistros(resRegistros.data);
      } catch (error) {
        console.error('Error cargando detalles:', error);
        Alert.alert('Error', 'No se pudo cargar la información de la incubadora');
      } finally {
        setLoading(false);
      }
    };
    cargarDetalles();
  }, [incubadoraId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (!incubadora) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se encontró la incubadora</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{incubadora.nombre}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="barcode" size={20} color="#666" />
          <Text style={styles.infoText}>Código: {incubadora.codigo}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#666" />
          <Text style={styles.infoText}>Ubicación: {incubadora.ubicacion}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="paw" size={20} color="#666" />
          <Text style={styles.infoText}>Tipo de ave: {incubadora.tipo_ave}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="power" size={20} color="#666" />
          <Text style={styles.infoText}>
            Estado: 
            <Text style={{ color: incubadora.activa ? '#4CAF50' : '#F44336' }}>
              {incubadora.activa ? ' Activa' : ' Inactiva'}
            </Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setShowRegistros(!showRegistros)}
      >
        <Text style={styles.toggleButtonText}>
          {showRegistros ? 'Ocultar registros' : 'Mostrar registros'}
        </Text>
        <Ionicons 
          name={showRegistros ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#4a90e2" 
        />
      </TouchableOpacity>

      {showRegistros && (
        <View style={styles.registrosContainer}>
          <Text style={styles.sectionTitle}>Registros Recientes</Text>
          {registros.length > 0 ? (
            registros.map((registro, index) => (
              <View key={index} style={styles.registroItem}>
                <Text style={styles.registroFecha}>
                  {new Date(registro.fechaHora).toLocaleString()}
                </Text>
                <View style={styles.registroData}>
                  <Text style={styles.registroText}>Temp: {registro.temperatura}°C</Text>
                  <Text style={styles.registroText}>Humedad: {registro.humedad}%</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay registros disponibles</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#4a90e2',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  registrosContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  registroItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  registroFecha: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  registroData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  registroText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#F44336',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});