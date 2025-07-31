// screens/PerfilScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import API_BASE_URL from '../config';

export default function PerfilScreen({ route, navigation }) {
  const { userId } = route.params;
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/perfil/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPerfil(data);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !perfil) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.title}>Mi Perfil</Text>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => {
            /* Aquí podrías poner logout o alguna acción */
            // navigation.navigate('LogoutScreen')
            alert('Cerrar sesión (implementa acción)');
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Foto de Perfil */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <FontAwesome5 name="image" size={18} /> Foto de Perfil
        </Text>

        <Image
          source={
            perfil.imagen_perfil
              ? { uri: `${API_BASE_URL}${perfil.imagen_perfil}` }
              : require('../assets/incubadorita.png')
          }
          style={styles.avatar}
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            <FontAwesome5 name="upload" size={14} /> Cambiar imagen
          </Text>
        </TouchableOpacity>
      </View>

      {/* Información Personal */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <FontAwesome5 name="id-card" size={18} /> Información Personal
        </Text>

        <View style={styles.infoRow}>
          <FontAwesome5 name="user-tag" size={16} color="#4A5568" />
          <Text style={styles.infoLabel}>Nombre:</Text>
          <Text style={styles.infoValue}>{perfil.nombre}</Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome5 name="envelope" size={16} color="#4A5568" />
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{perfil.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('EditarPerfil', { userId })}
        >
          <Text style={styles.buttonText}>
            <FontAwesome5 name="edit" size={14} /> Editar Perfil
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resumen de Actividad */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <FontAwesome5 name="chart-line" size={18} /> Resumen de Actividad
        </Text>

        <View style={styles.infoRow}>
          <FontAwesome5 name="egg" size={16} color="#4A5568" />
          <Text style={styles.infoLabel}>Incubadoras registradas:</Text>
          <Text style={styles.infoValue}>{perfil.total_incubadoras || 0}</Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome5 name="history" size={16} color="#4A5568" />
          <Text style={styles.infoLabel}>Última incubadora:</Text>
          <Text style={styles.infoValue}>{perfil.ultima_incubadora || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome5 name="calendar-alt" size={16} color="#4A5568" />
          <Text style={styles.infoLabel}>Miembro desde:</Text>
          <Text style={styles.infoValue}>{perfil.fecha_registro || 'N/A'}</Text>
        </View>
      </View>

      {/* Acceso rápido */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          <FontAwesome5 name="bolt" size={18} /> Acceso rápido
        </Text>

        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => navigation.navigate('Incubadoras', { userId })}
          >
            <FontAwesome5 name="egg" size={16} color="#fff" />
            <Text style={styles.quickText}>Mis Incubadoras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => navigation.navigate('AgregarIncubadora', { userId })}
          >
            <FontAwesome5 name="plus-circle" size={16} color="#fff" />
            <Text style={styles.quickText}>Agregar Incubadora</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickButton}>
            <FontAwesome5 name="headset" size={16} color="#fff" />
            <Text style={styles.quickText}>Soporte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 12,
    color: '#2D3748',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  infoLabel: {
    fontWeight: '600',
    marginLeft: 6,
    color: '#2D3748',
  },
  infoValue: {
    marginLeft: 6,
    color: '#4A5568',
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  quickText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
