import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import API_BASE_URL from '../config';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login'); 
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.splashImage}
        resizeMode="contain"
      />
      <View style={styles.poweredContainer}>
        <Text style={styles.poweredText}>Powered by</Text>
        <Image
          source={require('../assets/poweredby.png')} // Cambia por tu imagen
          style={styles.poweredLogo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 250,
    height: 250,
    marginBottom: 40,
  },
  poweredContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  poweredText: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 24,
  },
  poweredLogo: {
    width: 160,
    height: 80,
  },
});