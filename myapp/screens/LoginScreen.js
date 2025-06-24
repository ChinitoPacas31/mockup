import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://10.100.0.90:5000/api/login', {
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data.success) {
        setMensaje('Inicio de sesión exitoso');
        // Puedes navegar a otra pantalla con los datos:
        navigation.navigate('Incubadoras', { userId: res.data.user_id });
      } else {
        setMensaje('Credenciales incorrectas');
      }
    } catch (error) {
      console.error(error);
      setMensaje('Error al conectar con el servidor');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Correo electrónico"
        onChangeText={setEmail}
        value={email}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Contraseña"
        onChangeText={setPassword}
        value={password}
        style={styles.input}
        secureTextEntry
      />
      <Button title="Iniciar sesión" onPress={handleLogin} />
      <Text style={{ marginTop: 10 }}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 },
});
