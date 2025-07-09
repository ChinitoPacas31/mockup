import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function RegistroScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleRegistro = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/registro`, {
        nombre,
        email,
        password,
      });

      if (res.data.success) {
        setMensaje('Registro exitoso. Redirigiendo...');
        setTimeout(() => navigation.navigate('Login'), 2000);
      } else {
        setMensaje(res.data.message || 'Error en el registro');
      }
    } catch (error) {
      console.error(error);
      setMensaje('Error al conectar con el servidor');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Nombre" onChangeText={setNombre} value={nombre} style={styles.input} />
      <TextInput placeholder="Email" onChangeText={setEmail} value={email} style={styles.input} />
      <TextInput placeholder="Contraseña" onChangeText={setPassword} value={password} secureTextEntry style={styles.input} />
      <Button title="Registrarse" onPress={handleRegistro} />
      <Text>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10 },
});
