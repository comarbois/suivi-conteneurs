import { View, Text, BackHandler, ToastAndroid, ActivityIndicator, Image, TextInput, Pressable, StyleSheet, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyToken } from '../hooks/verifyToken';

const Login = ({route,navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const checkLogin = () => {
    setIsLoading(true);
    verifyToken().then(res => {
      if (res) {
        navigation.navigate('Home'); 
      }else{
        setIsLoading(false);
      }
    });
    setIsLoading(false);
  };

  useEffect(() => {
    checkLogin();
    const handleBackPress = () => {
      if (navigation.isFocused()) {
        Alert.alert('Quitter', 'Voulez vous quitter l\'application ?', [
          {
            text: 'Non',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Oui',
            onPress: () => {
              AsyncStorage.clear()
                .then(() => {
                  BackHandler.exitApp();
                })
                .catch(error => {
                  console.error('Error clearing AsyncStorage:', error);
                });
            },
          },
        ]);
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, []);

  const handleLogin = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `https://tbg.comarbois.ma/controle_reception/api/authentification/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({username, password}),
        },
      );

      if (response.status === 200) {
        const {user, token} = await response.json();      
        await AsyncStorage.setItem('user', JSON.stringify(user));
        await AsyncStorage.setItem('userToken',token);        
        ToastAndroid.show('Connexion réussie', ToastAndroid.LONG);
        navigation.replace('ListReceptions');
      } else {
        const {message} = await response.json();
        console.log(message);
        setError(true);
        setErrorMessage(message);
      }
    } catch (error) {
      console.error('Error:', error);
      ToastAndroid.show('Erreur lors de la connexion', ToastAndroid.SHORT);
    }
    finally {
      setSubmitting(false);
    }
  };



  return isLoading ? (
    <ActivityIndicator size="large" color="#0000ff" style={
      {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      }
    }/>
  ) : (
    <View style={styles.container}>
      <Image source={require('../assets/logo.com.png')} />
      <Text
        style={[
          styles.text,
          {
            fontSize: 20,
            fontWeight: 'bold',
            marginTop: 20,
            color: '#000',
          },
        ]}>
        Authentification
      </Text>
      <View
        style={{
          width: '100%',
          paddingHorizontal: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <TextInput
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            padding: 10,
            marginTop: 20,
            width: '100%',
            borderRadius: 5,
            color: '#000',
          }}
          placeholder="Username"
          onChangeText={text => setUsername(text)}
          autoCapitalize="none"
        />
        <TextInput
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            padding: 10,
            marginTop: 20,
            width: '100%',
            borderRadius: 5,
          }}
          placeholder="Mot de passe"
          secureTextEntry={true}
          onChangeText={text => setPassword(text)}
          autoCapitalize="none"
        />

        {error && (
          <Text style={{color: 'red', marginTop: 10, textAlign: 'left'}}>
            {errorMessage}
          </Text>
        )}

        <Pressable
          style={{
            backgroundColor: submitting ? '#af0007' : '#d32f2f',
            padding: 10,
            marginTop: 20,
            width: '100%',
            borderRadius: 5,
          }}
          onPress={handleLogin}>
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={{
                color: '#fff',
                textAlign: 'center',
              }}>
              Se connecter
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#000',
  },
});

export default Login