import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {HomeView} from './src/HomeView';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from './types/navProps';
import {Camera} from 'react-native-vision-camera';

const style = StyleSheet.create({
  globalView: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    gap: 8,
  },
  privateContentView: {
    padding: 24,
    paddingBottom: 0,
  },
});

const Stack = createStackNavigator<RootStackParamList>();

function Body(): JSX.Element {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const getPermission = async () => {
      const status: string = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    };
    getPermission();
  }, []);

  return (
    <SafeAreaView style={style.globalView}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Home" component={HomeView} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default Body;
