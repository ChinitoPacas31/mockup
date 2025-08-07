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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss(); // Ocultar teclado al intentar login
    setLoading(true);
    setMensaje('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, {
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data.success) {
        setMensaje('Inicio de sesión exitoso');
        navigation.navigate('Incubadoras', { userId: res.data.user_id });
      } else {
        setMensaje('Credenciales incorrectas');
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
            
            <Text style={styles.subtitle}>Incubator Control</Text>

            <View style={styles.inputContainer}>
              <Icon 
                name="email" 
                size={20} 
                color="#718096" 
                style={styles.inputIcon} 
              />
              <TextInput
                placeholder="E-mail"
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
                placeholder="Password"
                placeholderTextColor="#A0AEC0"
                onChangeText={setPassword}
                value={password}
                style={styles.input}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </View>

            {mensaje ? (
              <Text style={[
                styles.messageText,
                mensaje.includes('Successful') ? styles.successMessage : styles.errorMessage
              ]}>
                {mensaje}
              </Text>
            ) : null}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Log in</Text>
              )}
            </TouchableOpacity>


            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
                <Text style={styles.footerLink}>Sign up</Text>
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
  forgotPassword: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#4C51BF',
    fontSize: 14,
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