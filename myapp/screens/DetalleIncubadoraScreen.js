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

  const toggleEstado = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/incubadora/${incubadoraId}/toggle`);
      if (res.data.success) {
        setIncubadora({ ...incubadora, activa: res.data.activa });
      }
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
    }
  };

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
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (!incubadora) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={60} color="#FF6B6B" />
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
      {/* Header con gradiente */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{incubadora.nombre}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Tarjeta de información principal */}
      <View style={styles.mainCard}>
        <View style={styles.statusBadge}>
          <Ionicons 
            name={incubadora.activa ? 'checkmark-circle' : 'close-circle'} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.statusText}>
            {incubadora.activa ? 'ACTIVA' : 'INACTIVA'}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Ionicons name="barcode-outline" size={24} color="#6C63FF" />
            <Text style={styles.infoLabel}>Código</Text>
            <Text style={styles.infoValue}>{incubadora.codigo}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={24} color="#6C63FF" />
            <Text style={styles.infoLabel}>Ubicación</Text>
            <Text style={styles.infoValue}>{incubadora.ubicacion}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="egg-outline" size={24} color="#6C63FF" />
            <Text style={styles.infoLabel}>Tipo de ave</Text>
            <Text style={styles.infoValue}>{incubadora.tipo_ave || 'N/A'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={24} color="#6C63FF" />
            <Text style={styles.infoLabel}>Creada</Text>
            <Text style={styles.infoValue}>
              {new Date(incubadora.fechaCreacion).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={toggleEstado}
          style={[
            styles.actionButton,
            incubadora.activa ? styles.deactivateButton : styles.activateButton
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="power"
            size={20}
            color="#FFF"
            style={styles.buttonIcon}
          />
          <Text style={styles.actionButtonText}>
            {incubadora.activa ? 'Desactivar' : 'Activar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sección de registros */}
      <TouchableOpacity 
        style={styles.toggleSection}
        onPress={() => setShowRegistros(!showRegistros)}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleSectionText}>
          {showRegistros ? 'Ocultar registros' : 'Mostrar registros'}
        </Text>
        <Ionicons 
          name={showRegistros ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#6C63FF" 
        />
      </TouchableOpacity>

      {showRegistros && (
        <View style={styles.registrosContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={24} color="#6C63FF" />
            <Text style={styles.sectionTitle}>Historial de Monitoreo</Text>
          </View>

          {registros.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={{
                    labels: registros.map((r, i) => i % 3 === 0 ? new Date(r.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
                    datasets: [
                      {
                        data: registros.map(r => r.temperatura),
                        color: () => '#FF6B6B',
                        strokeWidth: 3,
                      },
                      {
                        data: registros.map(r => r.humedad),
                        color: () => '#4D96FF',
                        strokeWidth: 3,
                      },
                    ],
                    legend: ['Temperatura (°C)', 'Humedad (%)'],
                  }}
                  width={Math.max(Dimensions.get('window').width - 40, registros.length * 40)}
                  height={240}
                  chartConfig={{
                    backgroundGradientFrom: '#FFF',
                    backgroundGradientTo: '#FFF',
                    decimalPlaces: 1,
                    color: () => '#6C63FF',
                    labelColor: () => '#718096',
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: '#FFF'
                    }
                  }}
                  bezier
                  style={styles.chartStyle}
                />
              </ScrollView>
              
              <View style={styles.metricsSummary}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, {color: '#FF6B6B'}]}>
                    {Math.max(...registros.map(r => r.temperatura))}°C
                  </Text>
                  <Text style={styles.metricLabel}>Temp. máxima</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, {color: '#4D96FF'}]}>
                    {Math.max(...registros.map(r => r.humedad))}%
                  </Text>
                  <Text style={styles.metricLabel}>Humedad máx.</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#CBD5E0" />
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
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8F9FA',
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
    justifyContent: 'space-between',
    padding: 27,
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
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    position: 'relative',
    marginTop: 20
  },
  statusBadge: {
    position: 'absolute',
    top: -15,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  statusText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  activateButton: {
    backgroundColor: '#38A169',
  },
  deactivateButton: {
    backgroundColor: '#E53E3E',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleSectionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
  },
  registrosContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 10,
  },
  chartStyle: {
    marginVertical: 15,
    borderRadius: 16,
    marginLeft: 15,
  },
  metricsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 14,
    color: '#718096',
    marginTop: 5,
  },
  emptyState: {
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 15,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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