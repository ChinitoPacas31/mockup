import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import API_BASE_URL from '../config';

export default function RegistroScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegistro = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setMensaje('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/registro`, {
        nombre: nombre.trim(),
        email: email.trim(),
        password: password.trim(),
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContainer}>
            {/* Logo con temática de incubadoras */}
            <Image
              source={require('../assets/logo.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            
            <Text style={styles.subtitle}>Crear nueva cuenta</Text>

            <View style={styles.inputContainer}>
              <Icon 
                name="person" 
                size={20} 
                color="#718096" 
                style={styles.inputIcon} 
              />
              <TextInput
                placeholder="Nombre completo"
                placeholderTextColor="#A0AEC0"
                onChangeText={setNombre}
                value={nombre}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => this.emailInput.focus()}
                blurOnSubmit={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Icon 
                name="email" 
                size={20} 
                color="#718096" 
                style={styles.inputIcon} 
              />
              <TextInput
                ref={(input) => { this.emailInput = input; }}
                placeholder="Correo electrónico"
                placeholderTextColor="#A0AEC0"
                onChangeText={setEmail}
                value={email}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => this.passwordInput.focus()}
                blurOnSubmit={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Icon 
                name="lock" 
                size={20} 
                color="#718096" 
                style={styles.inputIcon} 
              />
              <TextInput
                ref={(input) => { this.passwordInput = input; }}
                placeholder="Contraseña"
                placeholderTextColor="#A0AEC0"
                onChangeText={setPassword}
                value={password}
                style={styles.input}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleRegistro}
              />
            </View>

            {mensaje ? (
              <Text style={[
                styles.messageText,
                mensaje.includes('éxito') ? styles.successMessage : styles.errorMessage
              ]}>
                {mensaje}
              </Text>
            ) : null}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegistro}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Registrarse</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  innerContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  logoIcon: {
    alignSelf: 'center',
    marginBottom: -20,
    width: 280,
    height: 200,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 10,
    fontSize: 16,
    color: '#2D3748',
  },
  inputIcon: {
    marginRight: 10,
  },
  button: {
    backgroundColor: '#4C51BF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4C51BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messageText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
    padding: 10,
    borderRadius: 8,
  },
  errorMessage: {
    backgroundColor: '#FFF5F5',
    color: '#E53E3E',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  successMessage: {
    backgroundColor: '#F0FFF4',
    color: '#38A169',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#718096',
    fontSize: 14,
    marginRight: 5,
  },
  footerLink: {
    color: '#4C51BF',
    fontSize: 14,
    fontWeight: '600',
  },
});