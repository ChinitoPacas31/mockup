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
        const res = await axios.get('http://192.168.1.144:5000/api/aves');
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
      await axios.post('http://192.168.1.144:5000/api/incubadoras', {
        ...formData,
        user_id: userId,
        activa: true
      });

      Alert.alert('Éxito', 'Incubadora agregada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error agregando incubadora:', error);
      Alert.alert('Error', 'No se pudo agregar la incubadora');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Nueva Incubadora</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Código de la incubadora</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: INC-001"
          value={formData.codigo}
          onChangeText={(text) => handleChange('codigo', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nombre descriptivo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Mi incubadora principal"
          value={formData.nombre}
          onChangeText={(text) => handleChange('nombre', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Ubicación física</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Sala de incubación, Granja norte"
          value={formData.ubicacion}
          onChangeText={(text) => handleChange('ubicacion', text)}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tipo de ave</Text>
        <View style={styles.selectContainer}>
          {aves.map(ave => (
            <TouchableOpacity
              key={ave._id}
              style={[
                styles.aveOption,
                formData.ave_id === ave._id && styles.aveOptionSelected
              ]}
              onPress={() => handleChange('ave_id', ave._id)}
            >
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
        style={styles.submitButton} 
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Guardar Incubadora</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  aveOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  aveOptionSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  aveOptionText: {
    color: '#333',
  },
  aveOptionTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});