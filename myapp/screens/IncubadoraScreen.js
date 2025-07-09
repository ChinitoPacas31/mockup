import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import API_BASE_URL from '../config';

export default function IncubadorasScreen({ route, navigation }) {
  const { userId } = route.params;
  const [incubadoras, setIncubadoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarIncubadoras = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/incubadoras/${userId}`);
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
        <ActivityIndicator size="large" color="#4C51BF" />
        <Text style={styles.loadingText}>Cargando incubadoras...</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('DetalleIncubadora', { 
        incubadoraId: item.id,
        userId: userId
      })}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>
          <Ionicons name="egg" size={20} color="#FFF" />
        </View>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.activa ? '#38A169' : '#E53E3E' }]}>
          <Text style={styles.statusText}>{item.activa ? 'ACTIVA' : 'INACTIVA'}</Text>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="barcode-outline" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.codigo}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.ubicacion}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="egg-outline" size={16} color="#718096" />
          <Text style={styles.infoText}>{item.tipo_ave}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.moreInfo}>Ver detalles →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Incubadoras</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AgregarIncubadora', { userId: userId })}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {incubadoras.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="egg-outline" size={60} color="#CBD5E0" />
          </View>
          <Text style={styles.emptyTitle}>No hay incubadoras</Text>
          <Text style={styles.emptySubtitle}>Aún no has registrado ninguna incubadora</Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('AgregarIncubadora', { userId: userId })}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Agregar Incubadora</Text>
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
              colors={['#4C51BF']}
              tintColor="#4C51BF"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#718096',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    fontFamily: 'Inter-Bold',
  },
  addButton: {
    backgroundColor: '#4C51BF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4C51BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    backgroundColor: '#4C51BF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    fontFamily: 'Inter-SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
  },
  cardBody: {
    paddingLeft: 44, // 32 (icon) + 12 (margin)
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    color: '#4A5568',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  cardFooter: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  moreInfo: {
    color: '#4C51BF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIconContainer: {
    backgroundColor: '#EDF2F7',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    maxWidth: '80%',
  },
  primaryButton: {
    backgroundColor: '#4C51BF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#4C51BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});