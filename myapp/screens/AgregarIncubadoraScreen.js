import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert 
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
    <ScrollView 
      contentContainerStyle={styles.container}
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
        <Text style={styles.title}>Nueva Incubadora</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="add-circle-outline" size={24} color="#4C51BF" />
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
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="egg-outline" size={24} color="#4C51BF" />
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
                name="egg-outline" 
                size={20} 
                color={formData.ave_id === ave._id ? "#FFF" : "#4C51BF"} 
                style={styles.aveIcon}
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

      <TouchableOpacity 
        style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.submitButtonText}>Guardar Incubadora</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 45
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    textAlign: 'center',
    flex: 1,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 12,
  },
  formGroup: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 0,
  },
  label: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  aveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  aveOptionSelected: {
    backgroundColor: '#4C51BF',
    borderColor: '#4C51BF',
  },
  aveIcon: {
    marginRight: 8,
  },
  aveOptionText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '500',
  },
  aveOptionTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#4C51BF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#4C51BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});