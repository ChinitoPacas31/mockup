import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../config';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';


export default function IncubadorasScreen({ route, navigation }) {
  const { userId } = route.params;
  const [incubadoras, setIncubadoras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

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

  useEffect(() => {
    cargarIncubadoras();
  }, []);

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
      onPress={() =>
        navigation.navigate('DetalleIncubadora', {
          incubadoraId: item.id,
          userId: userId
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>
          <Ionicons name="egg" size={20} color="#FFF" />
        </View>
        <Text style={styles.nombre}>{item.nombre}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.activa ? '#38A169' : '#E53E3E' }
          ]}
        >
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const buttons = [];

    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <TouchableOpacity
          key={i}
          onPress={() => setCurrentPage(i)}
          style={[
            styles.pageButton,
            i === currentPage && styles.pageButtonActive
          ]}
        >
          <Text style={styles.pageButtonText}>{i}</Text>
        </TouchableOpacity>
      );
    }

    return <View style={styles.paginationContainer}>{buttons}</View>;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C51BF" />
        <Text style={styles.loadingText}>Cargando incubadoras...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Incubadoras</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AgregarIncubadora', { userId })}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre, ubicación o código"
        placeholderTextColor="#A0AEC0"
        value={searchTerm}
        onChangeText={(text) => {
          setSearchTerm(text);
          setCurrentPage(1); // Resetear a la primera página cuando se busca
        }}
      />

      {filteredIncubadoras.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="egg-outline" size={60} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>No hay incubadoras</Text>
          <Text style={styles.emptySubtitle}>No se encontraron resultados</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={paginatedIncubadoras}
            keyExtractor={(item) => item.id}
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
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 24
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#718096',
    fontSize: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D3748',
    fontFamily: 'Inter-Bold'
  },
  addButton: {
    backgroundColor: '#4C51BF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchInput: {
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#2D3748'
  },
  listContent: {
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  cardIconContainer: {
    backgroundColor: '#4C51BF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  nombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  cardBody: {
    paddingLeft: 44
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  infoText: {
    marginLeft: 12,
    color: '#4A5568',
    fontSize: 14
  },
  cardFooter: {
    marginTop: 8,
    alignItems: 'flex-end'
  },
  moreInfo: {
    color: '#4C51BF',
    fontSize: 14
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 4
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 35
  },
  pageButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 15,
    marginHorizontal: 4
  },
  pageButtonActive: {
    backgroundColor: '#4C51BF'
  },
  pageButtonText: {
    color: '#2D3748',
    fontWeight: '600'
  }
});
