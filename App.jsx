import { View, Text } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack';


const Stack = createNativeStackNavigator();

import Unsplash from './screens/Unsplash';
import Login from './screens/Login';
import ListReceptions from './screens/ListReceptions';
import AddReception from './screens/AddReception';
const App = () => {



  return (
    <NavigationContainer>
      
      <Stack.Navigator>
      <Stack.Screen
          name="Unsplash"
          component={Unsplash}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ListReceptions"
          component={ListReceptions}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="AddReception"
          component={AddReception}
          options={{
            title: 'Ajouter Reception',
            headerStyle: {
              backgroundColor: '#d32f2f',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
          />
      </Stack.Navigator>


    </NavigationContainer>
  )
}

export default App