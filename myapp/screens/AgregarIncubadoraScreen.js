import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    ubicacion: ''
  });

  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async () => {
    if (!formData.codigo || !formData.nombre || !formData.ubicacion) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
  
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/incubadoras`, {
        codigo: formData.codigo,
        nombre: formData.nombre,
        ubicacion: formData.ubicacion,
        user_id: userId
      });

      if (response.data.success) {
        Alert.alert('Éxito', 'Incubator added successfully', [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Incubadoras', { userId }) 
          }
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Error adding incubator');
      }
    } catch (error) {
      console.error('Error adding incubator:', error);
      let errorMessage = 'Error adding incubator';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Invalid code or already exists';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error';
        }
      }
      
      Alert.alert('Error', errorMessage);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>New Incubator</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Formulario */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color="#6C63FF" />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Activation Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the incubator code"
              placeholderTextColor="#A0AEC0"
              value={formData.codigo}
              onChangeText={(text) => handleChange('codigo', text)}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
            />
            <Text style={styles.hintText}>
              This code comes with your physical device.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Example: Main Incubator"
              placeholderTextColor="#A0AEC0"
              value={formData.nombre}
              onChangeText={(text) => handleChange('nombre', text)}
              returnKeyType="next"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Example: Incubation room, Farm"
              placeholderTextColor="#A0AEC0"
              value={formData.ubicacion}
              onChangeText={(text) => handleChange('ubicacion', text)}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Botón de guardar */}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            loading && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>Save Incubator</Text>
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#6C63FF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 10,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#2D3748',
  },
  hintText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 5,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});