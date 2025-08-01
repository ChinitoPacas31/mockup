// screens/CambiarImagenScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import API_BASE_URL from '../config';

export default function CambiarImagenScreen({ route, navigation }) {
  const { userId } = route.params;
  const [perfil, setPerfil] = useState(null);
  const [imagen, setImagen] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    // Obtener perfil al cargar pantalla
    fetch(`${API_BASE_URL}/api/perfil/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPerfil(data);
        } else {
          Alert.alert('Error', 'No se pudo cargar el perfil');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Error al obtener perfil');
      });
  }, []);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso denegado', 'Se requiere acceso a la galería para seleccionar imágenes.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
  
      console.log('Resultado de selección:', result);
  
      if (!result.cancelled && result.assets && result.assets.length > 0) {
        console.log('URI seleccionada:', result.assets[0].uri);
        setImagen(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error en pickImage:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };
  

  const subirImagen = async () => {
    if (!imagen) {
      Alert.alert('Error', 'Selecciona una imagen primero');
      return;
    }

    setSubiendo(true);

    let filename = imagen.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    let ext = match ? match[1].toLowerCase() : '';

    // Si es HEIC, cambiamos a jpg para backend
    let type = `image/${ext}`;
    if (ext === 'heic') {
      type = 'image/jpeg';
      filename = filename.replace(/\.heic$/i, '.jpg');
    }

    const formData = new FormData();
    formData.append('imagen', {
      uri: imagen,
      name: filename,
      type,
    });

    try {
      const res = await fetch(`${API_BASE_URL}/api/perfil/${userId}/imagen`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert('Éxito', 'Imagen actualizada correctamente');
        setPerfil(prev => ({ ...prev, imagen_perfil: data.imagen_perfil }));
        setImagen(null);
      } else {
        Alert.alert('Error', data.message || 'Error al subir imagen');
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
      Alert.alert('Error', 'Error al subir imagen');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <View style={styles.container}>
      {perfil && perfil.imagen_perfil ? (
        <Image
          source={{ uri: `${API_BASE_URL}${perfil.imagen_perfil}` }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}

      {imagen && (
        <Image
          source={{ uri: imagen }}
          style={[styles.image, { marginTop: 20 }]}
        />
      )}

      <View style={{ marginTop: 30, width: '60%' }}>
        <Button title="Seleccionar imagen" onPress={pickImage} />
      </View>

      {subiendo ? (
        <ActivityIndicator
          size="large"
          color="#6C63FF"
          style={{ marginTop: 20 }}
        />
      ) : (
        <View style={{ marginTop: 20, width: '60%' }}>
          <Button title="Subir imagen" onPress={subirImagen} disabled={!imagen} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#ccc',
  },
});
