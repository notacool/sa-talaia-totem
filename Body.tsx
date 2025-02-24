import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {HomeView} from './src/HomeView';
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import WebViewScreen from './src/WebView';
import { RootStackParamList } from './types/navProps';

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
  return (
    <SafeAreaView style={style.globalView}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Home" component={HomeView} />
          <Stack.Screen name="WebView" component={WebViewScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

export default Body;
