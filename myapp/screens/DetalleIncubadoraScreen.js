import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../config';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

export default function DetalleIncubadora({ route, navigation }) {
  const { incubadoraId, userId } = route.params;
  const [incubadora, setIncubadora] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState([]);
  const [showRegistros, setShowRegistros] = useState(false);

  useEffect(() => {
    const cargarDetalles = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/incubadora/${incubadoraId}`);
        setIncubadora(res.data);
        
        const resRegistros = await axios.get(`${API_BASE_URL}/api/incubadora/${incubadoraId}/registros`);
        setRegistros(resRegistros.data);
      } catch (error) {
        console.error('Error cargando detalles:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDetalles();
  }, [incubadoraId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C51BF" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (!incubadora) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={60} color="#E53E3E" />
        <Text style={styles.errorTitle}>No se encontró la incubadora</Text>
        <Text style={styles.errorSubtitle}>La incubadora solicitada no está disponible</Text>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.primaryButtonText}>Volver atrás</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#4C51BF" />
        </TouchableOpacity>
        <Text style={styles.title}>{incubadora.nombre}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Ionicons name="egg" size={20} color="#FFF" />
          </View>
          <Text style={styles.cardTitle}>Información General</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="barcode-outline" size={18} color="#4C51BF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Código</Text>
              <Text style={styles.infoValue}>{incubadora.codigo}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={18} color="#4C51BF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ubicación</Text>
              <Text style={styles.infoValue}>{incubadora.ubicacion}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="egg-outline" size={18} color="#4C51BF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Tipo de ave</Text>
              <Text style={styles.infoValue}>{incubadora.tipo_ave}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="power-outline" size={18} color="#4C51BF" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={[
                styles.infoValue, 
                styles.statusText,
                incubadora.activa ? styles.statusActive : styles.statusInactive
              ]}>
                {incubadora.activa ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setShowRegistros(!showRegistros)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleButtonText}>
          {showRegistros ? 'Ocultar registros' : 'Mostrar registros'}
        </Text>
        <Ionicons 
          name={showRegistros ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#4C51BF" 
        />
      </TouchableOpacity>

      {showRegistros && (
  <View style={styles.registrosContainer}>
    <View style={styles.sectionHeader}>
      <Ionicons name="time-outline" size={20} color="#4C51BF" />
      <Text style={styles.sectionTitle}>Gráfica de Registros</Text>
    </View>

    {registros.length > 0 ? (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels: registros.map((r, i) => i % 2 === 0 ? new Date(r.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
            datasets: [
              {
                data: registros.map(r => r.temperatura),
                color: () => '#E53E3E',
                strokeWidth: 2,
              },
              {
                data: registros.map(r => r.humedad),
                color: () => '#3182CE',
                strokeWidth: 2,
              },
            ],
            legend: ['Temperatura (°C)', 'Humedad (%)'],
          }}
          width={Math.max(Dimensions.get('window').width - 40, registros.length * 60)}
          height={220}
          chartConfig={{
            backgroundGradientFrom: '#FFF',
            backgroundGradientTo: '#FFF',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(76, 81, 191, ${opacity})`,
            labelColor: () => '#718096',
            style: { borderRadius: 16 },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
        />
      </ScrollView>
    ) : (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={40} color="#CBD5E0" />
        <Text style={styles.emptyText}>No hay registros disponibles</Text>
      </View>
    )}
  </View>
)}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  cardIcon: {
    backgroundColor: '#4C51BF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  infoContainer: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  statusText: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusActive: {
    color: '#38A169',
  },
  statusInactive: {
    color: '#E53E3E',
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C51BF',
  },
  registrosContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  registroItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  firstRegistroItem: {
    borderTopWidth: 0,
  },
  lastRegistroItem: {
    borderBottomWidth: 0,
  },
  registroFecha: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  registroData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  registroMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registroText: {
    fontSize: 16,
    color: '#2D3748',
    marginLeft: 8,
  },
  emptyState: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 16,
    textAlign: 'center',
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
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});