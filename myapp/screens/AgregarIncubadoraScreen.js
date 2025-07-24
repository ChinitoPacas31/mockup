import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function AgregarIncubadora({ navigation, route }) {
  const { userId } = route.params;
  const [loading, setLoading] = useState(false);
  const [aves, setAves] = useState([]);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    ubicacion: '',
    ave_id: ''
  });

  useEffect(() => {
    const cargarAves = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/aves`);
        setAves(res.data);
      } catch (error) {
        console.error('Error cargando aves:', error);
        Alert.alert('Error', 'No se pudieron cargar los tipos de ave');
      }
    };
    cargarAves();
  }, []);

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    if (!formData.codigo || !formData.nombre || !formData.ubicacion || !formData.ave_id) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }
  
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/incubadoras`, {
        ...formData,
        user_id: userId,
        activa: true
      });
  
      Alert.alert('Éxito', 'Incubadora agregada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'No se pudo agregar la incubadora');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          <Text style={styles.title}>Nueva Incubadora</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Tarjeta de información básica */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="information-circle-outline" size={24} color="#6C63FF" />
            </View>
            <Text style={styles.cardTitle}>Información Básica</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Código de la incubadora</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: INC-001"
              placeholderTextColor="#A0AEC0"
              value={formData.codigo}
              onChangeText={(text) => handleChange('codigo', text)}
              returnKeyType="next"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre descriptivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Mi incubadora principal"
              placeholderTextColor="#A0AEC0"
              value={formData.nombre}
              onChangeText={(text) => handleChange('nombre', text)}
              returnKeyType="next"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ubicación física</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Sala de incubación, Granja norte"
              placeholderTextColor="#A0AEC0"
              value={formData.ubicacion}
              onChangeText={(text) => handleChange('ubicacion', text)}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Tarjeta de tipo de ave */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="egg-outline" size={24} color="#6C63FF" />
            </View>
            <Text style={styles.cardTitle}>Tipo de Ave</Text>
          </View>

          <View style={styles.selectContainer}>
            {aves.map(ave => (
              <TouchableOpacity
                key={ave._id}
                style={[
                  styles.aveOption,
                  formData.ave_id === ave._id && styles.aveOptionSelected
                ]}
                onPress={() => handleChange('ave_id', ave._id)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="egg" 
                  size={20} 
                  color={formData.ave_id === ave._id ? "#FFF" : "#6C63FF"} 
                />
                <Text style={[
                  styles.aveOptionText,
                  formData.ave_id === ave._id && styles.aveOptionTextSelected
                ]}>
                  {ave.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón de guardar */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="save" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Guardar Incubadora</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
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
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  card: {
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  aveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    width: '48%',
  },
  aveOptionSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  aveOptionText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  aveOptionTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});