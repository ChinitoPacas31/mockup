import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ScrollView,
  Dimensions
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../config';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

const { width } = Dimensions.get('window');

export default function IncubadorasScreen({ route, navigation }) {
  const { userId } = route.params;
  const [incubadoras, setIncubadoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    cargarIncubadoras();
    const interval = setInterval(cargarIncubadoras, 30000);
    const unsubscribe = navigation.addListener('focus', cargarIncubadoras);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

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

  const filteredIncubadoras = incubadoras.filter((item) =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredIncubadoras.length / itemsPerPage);
  const paginatedIncubadoras = filteredIncubadoras.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DetalleIncubadora', {
        incubadoraId: item.id,
        userId: userId
      })}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconContainer, {backgroundColor: item.activa ? '#38A169' : '#E53E3E'}]}>
          <Ionicons name="egg" size={20} color="#FFF" />
        </View>
        <Text style={styles.nombre} numberOfLines={1} ellipsizeMode="tail">{item.nombre}</Text>
      </View>

      <View style={styles.statusIconContainer}>
        {item.activa ? (
          <View style={styles.activeStatus}>
            <Ionicons name="checkmark-circle" size={60} color="#38A169" />
            <Text style={styles.statusLabel}>ACTIVA</Text>
          </View>
        ) : (
          <View style={styles.inactiveStatus}>
            <Ionicons name="close-circle" size={60} color="#E53E3E" />
            <Text style={styles.statusLabel}>INACTIVA</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="barcode-outline" size={16} color="#4A5568" />
          <Text style={styles.infoText}>{item.codigo}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#4A5568" />
          <Text style={styles.infoText}>{item.ubicacion}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="egg-outline" size={16} color="#4A5568" />
          <Text style={styles.infoText}>{item.tipo_ave || 'No especificado'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
        >
          <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? "#A0AEC0" : "#6C63FF"} />
        </TouchableOpacity>
        
        <Text style={styles.pageText}>
          Página {currentPage} de {totalPages}
        </Text>
        
        <TouchableOpacity
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
        >
          <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? "#A0AEC0" : "#6C63FF"} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando incubadoras...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Header con nuevo diseño */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Perfil', { userId })}
          >
            <Ionicons name="person" size={24} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.title}>Mis Incubadoras</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AgregarIncubadora', { userId })}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar incubadoras..."
            placeholderTextColor="#A0AEC0"
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              setCurrentPage(1);
            }}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color="#A0AEC0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{incubadoras.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{incubadoras.filter(i => i.activa).length}</Text>
            <Text style={styles.statLabel}>Activas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{incubadoras.filter(i => !i.activa).length}</Text>
            <Text style={styles.statLabel}>Inactivas</Text>
          </View>
        </View>

        {/* Incubadoras List */}
        {filteredIncubadoras.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="egg-outline" size={80} color="#E2E8F0" />
            <Text style={styles.emptyTitle}>No se encontraron incubadoras</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm.length > 0 
                ? "Prueba con otros términos de búsqueda" 
                : "Agrega una nueva incubadora para comenzar"}
            </Text>
            {searchTerm.length === 0 && (
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => navigation.navigate('AgregarIncubadora', { userId })}
              >
                <Text style={styles.addFirstButtonText}>Agregar Incubadora</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <FlatList
              data={paginatedIncubadoras}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#6C63FF']}
                  tintColor="#6C63FF"
                />
              }
              showsVerticalScrollIndicator={false}
            />
            {renderPagination()}
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#6C63FF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    paddingVertical: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '30%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '48%',
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  nombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  statusIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    marginVertical: 12,
  },
  activeStatus: {
    alignItems: 'center',
  },
  inactiveStatus: {
    alignItems: 'center',
  },
  statusLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#4A5568',
    fontSize: 12,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    maxWidth: '80%',
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addFirstButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  pageButton: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 15,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageText: {
    marginHorizontal: 15,
    color: '#4A5568',
    fontSize: 14,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

});