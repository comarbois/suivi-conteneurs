import {View, Text, Image, ActivityIndicator} from 'react-native';
import React, { useEffect } from 'react';
import {verifyToken} from '../hooks/verifyToken';


const Unsplash = ({route, navigation}) => {
  const checkLogin = async () => {
    verifyToken().then(res => {
      if (res) {
        navigation.navigate('ListReceptions');
      } else {
        navigation.navigate('Login');
      }
    });
  };



  useEffect(() => {
    
    setTimeout(() => {
      checkLogin();
    }, 2000);
  }, []);

  return (
    <View style={{flex: 1, justifyContent:'center', alignItems:'center'}}>
      <Image source={require('../assets/logo.com.png')} />
      <ActivityIndicator size="large" color="#0000ff" />

    </View>
  );
};

export default Unsplash;
