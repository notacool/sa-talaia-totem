import {
  useRoute,
  RouteProp,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import {Header, StackNavigationProp} from '@react-navigation/stack';
import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  Text,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  AppState,
  DeviceEventEmitter,
  TouchableWithoutFeedback,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Header1 from '../assets/images/bg.png';
import Logo from '../assets/images/logo.svg';
import Indicator from '../assets/images/iconIndicator.svg';
import Info from '../assets/images/iconInfo.svg';
import Selfie from '../assets/images/iconSelfie.svg';
import {RootStackParamList} from '../types/navProps';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const WebViewScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'WebView'>>();
  const [loading, setLoading] = useState(true);
  const url = route.params?.url || '';

  type NavigationProps = StackNavigationProp<RootStackParamList, 'WebView'>;

  const navigation = useNavigation<NavigationProps>();

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    console.log('User is active, resetting timer...');
    if (timeoutId) clearTimeout(timeoutId);
    setTimeoutId(
      setTimeout(() => {
        console.log('User inactive, navigating to Home...');
        navigation.navigate('Home');
      }, 30000), // 30 seconds timeout
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      resetTimer(); // Reset timer when screen is focused
      return () => {
        if (timeoutId) clearTimeout(timeoutId); // Clear timeout when leaving screen
      };
    }, []),
  );

  return (
    <TouchableWithoutFeedback onPress={resetTimer}>
      <View style={styles.container}>
        <ImageBackground
          source={Header1}
          style={styles.headerContainer}
          resizeMode="stretch">
          {/* Sección superior: Logo + Nombre del Ayuntamiento */}
          <View style={styles.headerSection}>
            <View
              style={{
                flex: 1,
                height: '100%',
                flexDirection: 'column',
                display: 'flex',
              }}>
              <TouchableOpacity
                style={{justifyContent: 'center'}}
                onPress={() => navigation.navigate('Home')}>
                <Logo width="70%" height="60%" style={styles.logo} />
              </TouchableOpacity>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                }}>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '26%',
                    paddingTop: screenHeight * 0.0025,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: screenWidth * 0.005,
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        ...styles.infoTitle,
                        fontSize: screenWidth * 0.016,
                        textAlign: 'right',
                        fontFamily: 'Poppins-Bold',
                      }}>
                      Servicios
                    </Text>
                    <Indicator
                      height="70%"
                      width="10%"
                      preserveAspectRatio="none"
                      style={{flexShrink: 1, minWidth: screenWidth * 0.02}}
                    />
                  </View>
                  <Text
                    style={{
                      ...styles.infoSubtitleRed,
                      fontSize: screenWidth * 0.012,
                      paddingLeft: screenWidth * 0.032,
                      fontFamily: 'Poppins-Bold',
                    }}>
                    Serves
                  </Text>
                  <Text
                    style={{
                      ...styles.infoSubtitleYellow,
                      fontSize: screenWidth * 0.012,
                      paddingLeft: screenWidth * 0.032,
                      fontFamily: 'Poppins-Bold',
                    }}>
                    Services
                  </Text>
                </View>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '65%',
                    paddingLeft: screenWidth * 0.015,
                    paddingTop: screenHeight * 0.0025,
                    // backgroundColor: 'red',
                  }}>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: screenWidth * 0.005,
                    }}>
                    <Info
                      height="50%"
                      width="10%"
                      // preserveAspectRatio="none"
                      style={{
                        flexShrink: 1,
                        minWidth: screenWidth * 0.02,
                      }}></Info>
                    <View style={{flexDirection: 'column', display: 'flex'}}>
                      <View style={{flexDirection: 'row', display: 'flex'}}>
                        <Text
                          style={{
                            fontSize: screenWidth * 0.014,
                            fontFamily: 'Poppins-Regular',
                          }}>
                          Punto de información.{' '}
                        </Text>
                        <Text
                          style={{
                            ...styles.infoSubtitleRed,
                            fontSize: screenWidth * 0.014,
                            fontFamily: 'Poppins-Regular',
                          }}>
                          Punt d'informació.{' '}
                        </Text>
                      </View>
                      <Text
                        style={{
                          ...styles.infoSubtitleYellow,
                          fontSize: screenWidth * 0.014,
                          fontFamily: 'Poppins-Regular',
                        }}>
                        Information point.
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: screenWidth * 0.005,
                    }}>
                    <Selfie
                      height="100%"
                      width="7%"
                      // preserveAspectRatio="none"
                      style={{
                        flexShrink: 1,
                        minWidth: screenWidth * 0.018,
                      }}></Selfie>
                    <Text
                      style={{
                        fontSize: screenWidth * 0.014,
                        fontFamily: 'Poppins-Regular',
                      }}>
                      Selfie
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.infoScreen}>
              <Text
                style={{...styles.infoTitle, fontFamily: 'Poppins-SemiBold'}}>
                Pantalla de información
              </Text>
              <Text
                style={{
                  ...styles.infoSubtitleRed,
                  fontFamily: 'Poppins-SemiBold',
                }}>
                Pantalla d'informació
              </Text>
              <Text
                style={{
                  ...styles.infoSubtitleYellow,
                  fontFamily: 'Poppins-SemiBold',
                }}>
                Information screen
              </Text>
            </View>

            {/* <Text style={styles.title}>
                Ajuntament de{'\n'}
                <Text style={styles.boldText}>Sant Josep de sa Talaia</Text>
              </Text> */}
          </View>
        </ImageBackground>
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#006EA0" />
          </View>
        )}
        <WebView
          source={{uri: url}}
          onLoadStart={() => setLoading(true)} // Show loader when WebView starts loading
          onLoad={() => setLoading(false)} // Hide loader when WebView finishes loading
          style={{flex: 1}}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: screenHeight,
    backgroundColor: 'white',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    width: screenWidth,
    height: screenHeight * 0.16, // Ajusta la altura proporcionalmente al ancho
  },
  headerSection: {
    height: screenHeight * 0.16, // Ajuste dinámico
    flexDirection: 'row',
    alignItems: 'center', // Asegura que los elementos estén centrados
    paddingTop: screenHeight * 0.02,
    // backgroundColor: 'red',
  },
  logo: {
    marginLeft: '10%',
  },
  infoTitle: {
    fontSize: screenWidth * 0.035,
    // fontWeight: 'bold',
    color: '#000',
  },
  infoSubtitleRed: {
    fontSize: screenWidth * 0.02,
    color: '#D00000',
  },
  infoSubtitleYellow: {
    fontSize: screenWidth * 0.02,
    color: '#B8860B',
  },
  infoScreen: {
    paddingTop: screenHeight * 0.03,
    flex: 1,
    alignItems: 'flex-start',
    // backgroundColor: 'green',
    height: '100%',
  },
});

export default WebViewScreen;
