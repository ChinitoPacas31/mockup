import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, RefreshControl } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function IncubadorasScreen({ route, navigation }) {
  const { userId } = route.params; // Asegúrate que userId se pasa correctamente
  const [incubadoras, setIncubadoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarIncubadoras = async () => {
    try {
      const res = await axios.get(`http://192.168.1.144:5000/api/incubadoras/${userId}`);
      setIncubadoras(res.data);
    } catch (error) {
      console.error('Error cargando incubadoras:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarIncubadoras();
  };

  useEffect(() => {
    cargarIncubadoras();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DetalleIncubadora', { 
        incubadoraId: item.id,
        userId: userId // Pasamos también el userId por si es necesario
      })}
    >
      <View style={styles.cardHeader}>
        <Ionicons name="egg" size={24} color="#4a90e2" />
        <Text style={styles.nombre}>{item.nombre}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.activa ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>{item.activa ? 'Activa' : 'Inactiva'}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="barcode" size={16} color="#666" />
          <Text style={styles.infoText}>Código: {item.codigo}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.infoText}>Ubicación: {item.ubicacion}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="paw" size={16} color="#666" />
          <Text style={styles.infoText}>Tipo de ave: {item.tipo_ave}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tus Incubadoras</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('AgregarIncubadora', { userId: userId })}
        >
          <Ionicons name="add-circle" size={32} color="#4a90e2" />
        </TouchableOpacity>
      </View>
      
      {incubadoras.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="egg-outline" size={100} color="#ccc" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No tienes incubadoras registradas</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AgregarIncubadora', { userId: userId })}
          >
            <Text style={styles.addButtonText}>Agregar Incubadora</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={incubadoras}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4a90e2']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 20,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    paddingLeft: 34,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});