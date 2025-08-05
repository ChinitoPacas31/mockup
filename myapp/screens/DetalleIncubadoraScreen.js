import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  Alert,
  Dimensions,
  Image,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LineChart } from 'react-native-chart-kit';
import API_BASE_URL from '../config';
import { obtenerIconoAve } from '../avesConfig';

export default function DetalleIncubadora({ route, navigation }) {
  const { codigoIncubadora, userId } = route.params; // Cambiado a codigoIncubadora
  const [incubadora, setIncubadora] = useState(null);
  const [ave, setAve] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState([]);
  const [showRegistros, setShowRegistros] = useState(false);
  const [aves, setAves] = useState([]);
  const [showModalAve, setShowModalAve] = useState(false);
  const [aveSeleccionada, setAveSeleccionada] = useState(null);
  const [diasTranscurridos, setDiasTranscurridos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const cargarDatosIncubadora = async () => {
    try {
      setLoading(true);
      const [incubadoraRes, registrosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/incubadora-detalle/${codigoIncubadora}`),
        axios.get(`${API_BASE_URL}/api/incubadora/${codigoIncubadora}/registros`)
      ]);

      if (incubadoraRes.data.success) {
        setIncubadora(incubadoraRes.data.incubadora);
        setAve(incubadoraRes.data.ave || null);
        setDiasTranscurridos(incubadoraRes.data.dias_transcurridos || 0);
        setFinalizado(incubadoraRes.data.finalizado || false);
        setRegistros(registrosRes.data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarTemporizador = (diasIniciales) => {
    setDiasTranscurridos(diasIniciales);
    
    const intervalo = setInterval(() => {
      setDiasTranscurridos(prev => {
        const nuevosDias = prev + 1;
        if (ave && nuevosDias >= ave.dias_incubacion) {
          setFinalizado(true);
          clearInterval(intervalo);
          return ave.dias_incubacion;
        }
        return nuevosDias;
      });
    }, 86400000); // Actualizar cada 24 horas

    return () => clearInterval(intervalo);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', cargarDatosIncubadora);
    cargarDatosIncubadora();
    
    const cargarAves = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/aves`);
        setAves(res.data);
      } catch (error) {
        console.error('Error cargando aves:', error);
      }
    };
    cargarAves();

    return unsubscribe;
  }, [navigation, codigoIncubadora]);

  const iniciarCiclo = async () => {
    if (!aveSeleccionada) {
      Alert.alert('Error', 'Selecciona un tipo de ave');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/incubadora/${codigoIncubadora}/asignar-ave`, {
        ave_id: aveSeleccionada
      });

      if (res.data.success) {
        await cargarDatosIncubadora();
        setShowModalAve(false);
        setAveSeleccionada(null);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Error al iniciar ciclo');
    }
  };

  const apagarIncubadora = async () => {
    Alert.alert(
      'Apagar incubadora',
      '¿Deseas descargar un archivo con los registros antes de apagar?',
      [
        {
          text: 'No',
          onPress: async () => {
            try {
              const res = await axios.post(`${API_BASE_URL}/api/incubadora/${codigoIncubadora}/apagar`);
              if (res.data.success) {
                Alert.alert('Éxito', 'Incubadora apagada');
                await cargarDatosIncubadora();
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo apagar la incubadora');
            }
          },
          style: 'destructive'
        },
        {
          text: 'Sí',
          onPress: async () => {
            try {
              const url = `${API_BASE_URL}/api/incubadora/${codigoIncubadora}/exportar-registros`;
              const supported = await Linking.canOpenURL(url);
              
              if (supported) {
                await Linking.openURL(url);
                
                // Esperar un momento y luego apagar
                setTimeout(async () => {
                  const res = await axios.post(`${API_BASE_URL}/api/incubadora/${codigoIncubadora}/apagar`);
                  if (res.data.success) {
                    Alert.alert('Éxito', 'Archivo descargado e incubadora apagada');
                    await cargarDatosIncubadora();
                  }
                }, 2000);
              } else {
                Alert.alert('Error', 'No se pudo abrir el enlace de descarga');
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo completar la operación');
            }
          }
        },
        {
          text: 'Cancelar',
          style: 'cancel'
        }
      ]
    );
  };

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
    >
      <Modal
        visible={showModalAve}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModalAve(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona el tipo de ave</Text>
            
            <ScrollView contentContainerStyle={styles.avesContainer}>
              {aves.map(ave => (
                <TouchableOpacity
                  key={ave._id}
                  style={[
                    styles.aveOption,
                    aveSeleccionada === ave._id && styles.aveOptionSelected
                  ]}
                  onPress={() => setAveSeleccionada(ave._id)}
                >
                  <View style={[
                    styles.aveCircle,
                    aveSeleccionada === ave._id && styles.aveCircleSelected
                  ]}>
                    <Image 
                      source={obtenerIconoAve(ave.nombre)} 
                      style={styles.aveIcon} 
                    />
                  </View>
                  <View style={styles.aveInfo}>
                    <Text style={[
                      styles.aveName,
                      aveSeleccionada === ave._id && styles.aveNameSelected
                    ]}>
                      {ave.nombre}
                    </Text>
                    <Text style={styles.aveDays}>{ave.dias_incubacion} días de incubación</Text>
                    <Text style={styles.aveDetails}>
                      Temp: {ave.temperatura_ideal}°C - Hum: {ave.humedad_ideal}%
                    </Text>
                  </View>
                  {aveSeleccionada === ave._id && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={24} 
                      color="#6C63FF" 
                      style={styles.aveCheckmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setAveSeleccionada(null);
                  setShowModalAve(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  !aveSeleccionada && styles.disabledButton
                ]}
                onPress={iniciarCiclo}
                disabled={!aveSeleccionada}
              >
                <Text style={styles.confirmButtonText}>Iniciar ciclo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{incubadora.nombre}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.mainCard}>
        <View style={[
          styles.statusBadge,
          incubadora.activa ? styles.activeBadge : styles.inactiveBadge,
          finalizado && styles.finishedBadge
        ]}>
          <Ionicons 
            name={finalizado ? 'checkmark-done' : (incubadora.activa ? 'checkmark-circle' : 'close-circle')} 
            size={24} 
            color="#FFF" 
          />
          <Text style={styles.statusText}>
            {finalizado ? 'FINALIZADO' : (incubadora.activa ? 'ACTIVA' : 'INACTIVA')}
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
            <Text style={styles.infoValue}>{ave?.nombre || 'No asignado'}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={24} color="#6C63FF" />
            <Text style={styles.infoLabel}>Días de incubación</Text>
            <Text style={styles.infoValue}>
              {incubadora.activa && ave
                ? `${diasTranscurridos}/${ave.dias_incubacion}`
                : 'No activa'}
            </Text>
          </View>
        </View>

        {finalizado ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.finishedButton]}
          >
            <Ionicons name="checkmark-done" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Ciclo completado</Text>
          </TouchableOpacity>
        ) : incubadora.activa ? (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Confirmar',
                '¿Estás seguro que deseas apagar la incubadora?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Apagar', onPress: apagarIncubadora, style: 'destructive' }
                ]
              );
            }}
            style={[styles.actionButton, styles.deactivateButton]}
          >
            <Ionicons name="power" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Apagar incubadora</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowModalAve(true)}
            style={[styles.actionButton, styles.activateButton]}
          >
            <Ionicons name="play" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Iniciar ciclo</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={styles.toggleSection}
        onPress={() => setShowRegistros(!showRegistros)}
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
                    labels: registros.map((r, i) => 
                      i % Math.ceil(registros.length / 5) === 0 ? 
                      new Date(r.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                      ''
                    ),
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
                  width={Math.max(Dimensions.get('window').width - 40, registros.length * 2)}
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
                    {Math.max(...registros.map(r => r.temperatura)).toFixed(1)}°C
                  </Text>
                  <Text style={styles.metricLabel}>Temp. máxima</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, {color: '#4D96FF'}]}>
                    {Math.max(...registros.map(r => r.humedad)).toFixed(1)}%
                  </Text>
                  <Text style={styles.metricLabel}>Humedad máx.</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricValue, {color: '#38A169'}]}>
                    {Math.min(...registros.map(r => r.temperatura)).toFixed(1)}°C
                  </Text>
                  <Text style={styles.metricLabel}>Temp. mínima</Text>
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
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  activeBadge: {
    backgroundColor: '#38A169',
  },
  inactiveBadge: {
    backgroundColor: '#E53E3E',
  },
  finishedBadge: {
    backgroundColor: '#6C63FF',
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
  finishedButton: {
    backgroundColor: '#6C63FF',
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
    minWidth: 100,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2D3748',
  },
  avesContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  aveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aveOptionSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#6C63FF',
  },
  aveCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  aveCircleSelected: {
    backgroundColor: '#E0E7FF',
  },
  aveIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain'
  },
  aveInfo: {
    flex: 1,
  },
  aveName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  aveNameSelected: {
    color: '#6C63FF',
  },
  aveDays: {
    fontSize: 14,
    color: '#718096',
  },
  aveDetails: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  aveCheckmark: {
    marginLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    padding: 15,
    borderRadius: 12,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  confirmButton: {
    backgroundColor: '#6C63FF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});