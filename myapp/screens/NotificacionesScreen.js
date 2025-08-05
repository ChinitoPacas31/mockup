import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '../config';

export default function NotificacionesScreen({ route, navigation }) {
  const { userId } = route.params;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notificaciones/${userId}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      } else {
        Alert.alert('Error', 'Notifications could not be loaded.');
      }
    } catch (error) {
      console.log('Error loading notifications:', error);
      Alert.alert('Error', 'Error loading notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const marcarComoLeida = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notificaciones/marcar-leida`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          notificationId 
        }),
      });
      const data = await res.json();
      if (data.success) {
        cargarNotificaciones();
      }
    } catch (error) {
      console.log('Error marking notification as read:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notificaciones/marcar-todas-leidas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        cargarNotificaciones();
        Alert.alert('Éxito', 'All notifications marked as read');
      }
    } catch (error) {
      console.log('Error marking all as read:', error);
      Alert.alert('Error', 'Not all notifications could be marked as read.');
    }
  };

  const borrarNotificacion = async (notificationId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notificaciones/eliminar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          notificationId 
        }),
      });
      const data = await res.json();
      if (data.success) {
        cargarNotificaciones();
        Alert.alert('Éxito', 'Notification deleted');
      }
    } catch (error) {
      console.log('Error deleting notification:', error);
      Alert.alert('Error', 'The notification could not be deleted.');
    }
  };

  const borrarTodasLasNotificaciones = async () => {
    Alert.alert(
      'Confirm',
      'Are you sure you want to delete all notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        { 
          text: 'Delete', 
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/notificaciones/eliminar-todas`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
              });
              const data = await res.json();
              if (data.success) {
                cargarNotificaciones();
                Alert.alert('Éxito', 'All notifications have been deleted.');
              }
            } catch (error) {
              console.log('Error deleting all notifications:', error);
              Alert.alert('Error', 'Not all notifications could be deleted.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={[styles.notificationItem, !item.leida && styles.unreadNotification]}>
      <TouchableOpacity 
        style={styles.notificationContentWrapper}
        onPress={() => marcarComoLeida(item._id)}
      >
        <View style={styles.notificationIcon}>
          {item.tipo === 'alerta' ? (
            <Ionicons name="warning" size={24} color="#FF6B6B" />
          ) : item.tipo === 'exito' ? (
            <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
          ) : (
            <Ionicons name="information-circle" size={24} color="#4D96FF" />
          )}
        </View>
        <View style={styles.notificationContent}>
          {item.nombre_incubadora && (
            <Text style={styles.incubadoraName}>{item.nombre_incubadora}</Text>
          )}
          <Text style={styles.notificationTitle}>{item.titulo}</Text>
          <Text style={styles.notificationMessage}>{item.mensaje}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.fecha).toLocaleDateString()} {new Date(item.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
        {!item.leida && <View style={styles.unreadDot} />}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => borrarNotificacion(item._id)}
      >
        <Ionicons name="trash" size={20} color="#E53E3E" />
      </TouchableOpacity>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarNotificaciones();
  };

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
        <Text style={styles.title}>Alerts</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={marcarTodasComoLeidas}
        >
          <Ionicons name="checkmark-done" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Botón para borrar todas */}
      <TouchableOpacity
        style={styles.deleteAllButton}
        onPress={borrarTodasLasNotificaciones}
      >
        <Ionicons name="trash" size={20} color="#FFF" />
        <Text style={styles.deleteAllButtonText}>Delete all</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#CCC" />
          <Text style={styles.emptyText}>There are no alerts.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  clearButton: {
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
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E53E3E',
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    elevation: 2,
  },
  deleteAllButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incubadoraName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  notificationContentWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#718096',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C63FF',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});