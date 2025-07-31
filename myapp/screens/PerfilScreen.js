// screens/PerfilScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../config';

export default function PerfilScreen({ route, navigation }) {
  const { userId } = route.params;
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPerfil();
    const unsubscribe = navigation.addListener('focus', cargarPerfil);
    return unsubscribe;
  }, []);

  const cargarPerfil = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/perfil/${userId}`);
      const data = await res.json();
      if (data.success) {
        setPerfil(data);
      } else {
        Alert.alert('Error', 'No se pudo cargar el perfil');
      }
    } catch (error) {
      console.log('Error cargando perfil:', error);
      Alert.alert('Error', 'Ocurrió un error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              // Borra solo las keys necesarias de sesión:
              await AsyncStorage.multiRemove(['userToken', 'userId']);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (e) {
              console.log('Error al cerrar sesión:', e);
              Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!perfil) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se encontró el perfil</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Mi Perfil</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Foto de perfil */}
      <View style={styles.profileImageContainer}>
        <Image
          source={
            perfil.imagen_perfil
              ? { uri: `${API_BASE_URL}${perfil.imagen_perfil}` }
              : require('../assets/incubadorita.png')
          }
          style={styles.avatar}
        />
        <TouchableOpacity
          style={styles.changeImageButton}
          onPress={() => navigation.navigate('CambiarImagen', { userId })}
        >
          <Ionicons name="camera" size={20} color="#FFF" />
          <Text style={styles.changeImageText}>Cambiar imagen</Text>
        </TouchableOpacity>
      </View>

      {/* Información personal */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Información Personal</Text>

        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="#6C63FF" />
          <Text style={styles.infoText}>{perfil.nombre}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="#6C63FF" />
          <Text style={styles.infoText}>{perfil.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditarPerfil', { userId })}
        >
          <Ionicons name="create-outline" size={20} color="#FFF" />
          <Text style={styles.editProfileText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  errorText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: 'red',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#6C63FF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileImageContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderColor: '#6C63FF',
    borderWidth: 3,
  },
  changeImageButton: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: '#6C63FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
  },
  changeImageText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  infoCard: {
    marginTop: 40,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  editProfileButton: {
    marginTop: 10,
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});
