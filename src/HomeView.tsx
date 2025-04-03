import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Button,
  Dimensions,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Header from '../assets/images/bg.png';
import Logo from '../assets/images/logo.svg';
import Indicator from '../assets/images/iconIndicator.svg';
import Info from '../assets/images/iconInfo.svg';
import Selfie from '../assets/images/iconSelfie.svg';
import LinearGradient from 'react-native-linear-gradient';
import Body from '../assets/images/body.png';
import Touch from '../assets/images/iconTouch.svg';
import Header2 from '../assets/images/bg-body-1.png';
import Body1 from '../assets/images/bg-body-2.png';
import Body2 from '../assets/images/bg-body-3.png';
import Location from '../assets/images/iconLocation.svg';
import Temperature from '../assets/images/iconTemperature.svg';
import TemperatureCold from '../assets/images/iconTemperatureCold.svg';
import TemperatureHot from '../assets/images/iconTemperatureHot.svg';
import CO2 from '../assets/images/iconCo2.svg';
import CO2Bad from '../assets/images/iconCo2Bad.svg';
import CO2Regular from '../assets/images/iconCo2Regular.svg';
import RectangleSelfie from '../assets/images/iconRectangleSelfie.png';
import TakeSelfie from '../assets/images/iconTakeSelfie.svg';
import Next from '../assets/images/iconNext.svg';
import UE from '../assets/images/UE.svg';
import Mapa from '../assets/images/map.png';
import Plan from '../assets/images/plan.svg';
import Ministerio from '../assets/images/ministerio.svg';
import Minilogo from '../assets/images/miniLogo.svg';
import Back from '../assets/images/iconBack.svg';
import Photo from '../assets/images/iconPhoto.svg';
import Close from '../assets/images/iconClose.svg';
import Check from '../assets/images/iconCheck.svg';
import Popup from '../assets/images/popup.png';
import Sent from '../assets/images/sent.svg';
import Home from '../assets/images/iconHome.svg';
import {launchCamera} from 'react-native-image-picker';
import {
  ODOO_URL,
  ODOO_DB,
  ODOO_USERNAME,
  ODOO_PASSWORD,
  TOTEM_ID_LAST_DIGITS,
} from '@env';
import {Totem} from '../types/entities';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navProps';
import Paho from 'paho-mqtt';
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevices,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import WebView from 'react-native-webview';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type Data = {
  n: string;
  u: string;
  v: number;
};

type LanguageType = 'es' | 'va' | 'en';
export function HomeView(): JSX.Element {
  const [image, setImage] = useState<string | undefined>();
  const [image64, setImage64] = useState<string | undefined>();
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [readPrivacy, setReadPrivacy] = useState(false);
  const [privacyLang, setPrivacyLang] = useState<LanguageType>('es');
  const [focused, setFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [data, setData] = useState<Totem | undefined>();
  const [sendingImage, setSendingImage] = useState(false);
  const [messages, setMessages] = useState<Data[]>();
  const [airQualityValue, setAirQualityValue] = useState<number>();
  const [airQuality, setAirQuality] = useState<string>();

  const devices = useCameraDevices();
  const device = devices.find(cam => cam.position === 'front');
  const cameraRef = useRef<Camera>(null);
  const [countdown, setCountdown] = useState(0);
  const [isCounting, setIsCounting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Dispositivos disponibles:', devices);
  }, [devices]);

  const limits = {
    CO: [
      [0, 4.4, 50],
      [4.5, 9.4, 100],
      [9.5, 12.4, 150],
      [12.5, 15.4, 200],
      [15.5, 30.4, 300],
      [30.5, 40.4, 400],
      [40.5, 50.4, 500],
    ],
    SO2: [
      [0, 35, 50],
      [36, 75, 100],
      [76, 185, 150],
      [186, 304, 200],
      [305, 604, 300],
      [605, 804, 400],
      [805, 1004, 500],
    ],
    NO2: [
      [0, 53, 50],
      [54, 100, 100],
      [101, 360, 150],
      [361, 649, 200],
      [650, 1249, 300],
      [1250, 1649, 400],
      [1650, 2049, 500],
    ],
    O3: [
      [0, 54, 50],
      [55, 70, 100],
      [71, 85, 150],
      [86, 105, 200],
      [106, 200, 300],
      [201, 300, 400],
      [301, 400, 500],
    ],
  };

  const qualityLevels = [
    [0, 50, 'Buena'],
    [51, 100, 'Moderada'],
    [101, 150, 'No saludable para grupos sensibles'],
    [151, 200, 'No saludable'],
    [201, 300, 'Muy no saludable'],
    [301, Infinity, 'Peligroso'],
  ];

  function calculateICA(value: number | undefined, pollutant: any) {
    if (value && value > 0) {
      for (let [low, high, icaHigh] of limits[pollutant]) {
        if (value >= low && value <= high) {
          let icaLow =
            low === 0 ? 0 : limits[pollutant].find(([l]) => l === low)[2];
          return icaLow + ((icaHigh - icaLow) * (value - low)) / (high - low);
        }
      }
      // Si está fuera del rango
      return null;
    } else {
      return 0;
    }
  }

  const getAirQuality = () => {
    if (messages) {
      const co =
        messages.find(val => val.n === 'co') &&
        (
          Math.round(messages.find(val => val.n === 'co')?.v * 100) / 100
        ).toFixed(2);
      const so2 =
        messages.find(val => val.n === 'so2') &&
        (
          Math.round(messages.find(val => val.n === 'so2')?.v * 100) /
          100 /
          1000
        ).toFixed(2);
      const o3 =
        messages.find(val => val.n === 'o3') &&
        (
          Math.round(messages.find(val => val.n === 'o3')?.v * 100) /
          100 /
          1000
        ).toFixed(2);
      const no2 =
        messages.find(val => val.n === 'no2') &&
        (
          Math.round(messages.find(val => val.n === 'no2')?.v * 100) /
          100 /
          1000
        ).toFixed(2);
      const vals = {
        CO: Number(co) < 0 ? 0 : Number(co), // ppm
        SO2: Number(so2) < 0 ? 0 : Number(so2), // ppb
        NO2: Number(no2) < 0 ? 0 : Number(no2), // ppb
        O3: Number(o3) < 0 ? 0 : Number(o3), //ppb
      };
      const icaValues = Object.fromEntries(
        Object.entries(vals).map(([key, val]) => [key, calculateICA(val, key)]),
      );
      const icaFinal = Math.max(
        ...Object.values(icaValues).filter(v => v !== null),
      );
      setAirQualityValue(
        Object.values(vals)
          .reduce((sum, val) => sum + val, 0)
          .toFixed(2),
      );
      setAirQuality(
        qualityLevels.find(
          ([low, high]) => icaFinal >= low && icaFinal <= high,
        )[2],
      );
    }
  };

  const getMonth = (month: number, language: LanguageType) => {
    switch (language) {
      case 'en':
        switch (month) {
          case 0:
            return 'January';
          case 1:
            return 'February';
          case 2:
            return 'March';
          case 3:
            return 'April';
          case 4:
            return 'May';
          case 5:
            return 'June';
          case 6:
            return 'July';
          case 7:
            return 'August';
          case 8:
            return 'September';
          case 9:
            return 'October';
          case 10:
            return 'November';
          case 11:
            return 'December';
        }
        break;
      case 'es':
        switch (month) {
          case 0:
            return 'Enero';
          case 1:
            return 'Febrero';
          case 2:
            return 'Marzo';
          case 3:
            return 'Abril';
          case 4:
            return 'Mayo';
          case 5:
            return 'Junio';
          case 6:
            return 'Julio';
          case 7:
            return 'Agosto';
          case 8:
            return 'Septiembre';
          case 9:
            return 'Octubre';
          case 10:
            return 'Noviembre';
          case 11:
            return 'Diciembre';
        }
        break;
      case 'va':
        switch (month) {
          case 0:
            return 'Gener';
          case 1:
            return 'Febrer';
          case 2:
            return 'Març';
          case 3:
            return 'Abril';
          case 4:
            return 'Maig';
          case 5:
            return 'Juny';
          case 6:
            return 'Juliol';
          case 7:
            return 'Agost';
          case 8:
            return 'Setembre';
          case 9:
            return 'Octubre';
          case 10:
            return 'Novembre';
          case 11:
            return 'Desembre';
        }
        break;
    }
  };

  const getDay = (day: number, language: LanguageType) => {
    switch (language) {
      case 'en':
        switch (day) {
          case 1:
            return 'Monday';
          case 2:
            return 'Tuesday';
          case 3:
            return 'Wednesday';
          case 4:
            return 'Thursday';
          case 5:
            return 'Friday';
          case 6:
            return 'Saturday';
          case 7:
            return 'Sunday';
        }
        break;
      case 'es':
        switch (day) {
          case 1:
            return 'Lunes';
          case 2:
            return 'Martes';
          case 3:
            return 'Miércoles';
          case 4:
            return 'Jueves';
          case 5:
            return 'Viernes';
          case 6:
            return 'Sábado';
          case 7:
            return 'Domingo';
        }
        break;
      case 'va':
        switch (day) {
          case 1:
            return 'Dilluns';
          case 2:
            return 'Dimarts';
          case 3:
            return 'Dimecres';
          case 4:
            return 'Dijous';
          case 5:
            return 'Divendres';
          case 6:
            return 'Dissabte';
          case 7:
            return 'Diumenge';
        }
        break;
    }
  };

  const fetchData = async () => {
    try {
      const authResponse = await fetch(`${ODOO_URL}/web/session/authenticate`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            db: ODOO_DB,
            login: ODOO_USERNAME,
            password: ODOO_PASSWORD,
          },
        }),
      });
      const authData = await authResponse.json();
      console.log(authData);
      if (!authData.result) {
        throw new Error('Error de autenticación en Odoo');
      }
      const sessionId = authResponse.headers.get('set-cookie')?.split(';')[0];
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionId) {
        headers['Cookie'] = sessionId;
      }
      const response = await fetch(
        `${ODOO_URL}/web/dataset/call_kw/notacool_gm.totem.sa_talaia/search_read`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model: 'notacool_gm.totem.sa_talaia',
              method: 'search_read',
              args: [[]], // Puedes filtrar usuarios aquí si es necesario
              kwargs: {}, // Campos que quieres obtener
            },
          }),
        },
      );
      const data = await response.json();
      setData(data.result[0]);
    } catch (error) {
      console.log(error);
      console.error('Error fetching data:', error);
    }
  };

  const handleTakePhoto = () => {
    if (isCounting) return;

    setIsCounting(true);
    setCountdown(10);

    let seconds = 10;
    const interval = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);

      if (seconds <= 0) {
        clearInterval(interval);
        setIsCounting(false);
        onTakePhoto(); // 👈 tu función original
      }
    }, 1000);
  };
  const onTakePhoto = async () => {
    if (cameraRef.current == null) return;

    const photo = await cameraRef.current.takePhoto({
      flash: 'off',
    });

    const image = photo.path;
    console.log(image);

    try {
      const base64 = await RNFS.readFile(photo.path, 'base64');
      console.log(base64);
      setImage(image);
      setImage64(base64);
      setStep(2);
    } catch (error) {
      console.error('Error al leer el archivo:', error);
    }
    // launchCamera({mediaType: 'photo', includeBase64: true}, response => {
    //   if (response?.assets && response.assets.length > 0) {
    //     if (response.assets[0].uri === undefined) return;
    //     const image =
    //       Platform.OS === 'ios'
    //         ? response.assets[0].uri.replace('file://', '')
    //         : response.assets[0].uri;
    //     const image64 = response.assets[0].base64 as string;
    //     setImage(image);
    //     setImage64(image64);
    //   }
    // });
  };

  const getPrivacyTitle = (lang: LanguageType) => {
    switch (lang) {
      case 'en':
        return 'Basic information on data protection:';
      case 'es':
        return 'Información básica sobre protección de datos:';
      case 'va':
        return 'Informació básica sobre la protecció de dades:';
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (step !== 4) return;

      resetTimer(); // Reset timer when screen is focused and step === 4

      return () => {
        if (timeoutId) clearTimeout(timeoutId); // Clear timeout when leaving screen
      };
    }, [step]),
  );

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    console.log('User is active, resetting timer...');
    if (timeoutId) clearTimeout(timeoutId);
    setTimeoutId(
      setTimeout(() => {
        console.log('User inactive, navigating to Home...');
        setStep(0);
      }, 120000), // 30 seconds timeout
    );
  };

  const sendEmailOdoo = async () => {
    setSendingImage(true);
    try {
      // 🔹 Paso 1: crear el attachment en Odoo
      const attachmentResponse = await fetch(
        `${ODOO_URL}/web/dataset/call_kw`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model: 'ir.attachment',
              method: 'create',
              args: [
                {
                  name: 'foto_recuerdo.jpg',
                  type: 'binary',
                  datas: image64, // 👈 solo el base64, sin "data:image/jpeg;base64,"
                  res_model: 'mail.mail',
                  res_id: 0,
                  mimetype: 'image/jpeg',
                },
              ],
              kwargs: {},
            },
          }),
        },
      );

      const attachmentData = await attachmentResponse.json();
      const attachmentId = attachmentData.result;

      if (!attachmentId) {
        throw new Error('❌ No se pudo crear el attachment');
      }

      // 🔹 Paso 2: crear el correo con el attachment
      const createResponse = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'mail.mail',
            method: 'create',
            args: [
              {
                email_from: data?.mail || 'default@mail.com',
                email_to: email || 'destinatario@mail.com',
                subject: 'Aquí tienes tu foto de recuerdo!',
                body_html:
                  'Te adjuntamos la foto que te has sacado de recuerdo!',
                attachment_ids: [[6, false, [attachmentId]]],
              },
            ],
            kwargs: {},
          },
        }),
      });

      const createData = await createResponse.json();
      const mailId = createData.result;

      if (!mailId) {
        throw new Error('❌ No se pudo crear el correo en Odoo');
      }

      // 🔹 Paso 3: enviar el correo
      await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            model: 'mail.mail',
            method: 'send',
            args: [[mailId]],
            kwargs: {},
          },
        }),
      });

      // ✅ Éxito
      setSendingImage(false);
      setAccepted(false);
      setStep(3);
    } catch (error) {
      console.error('❌ Error al enviar correo:', error);
      setSendingImage(false);
    }
  };

  type NavigationProps = StackNavigationProp<RootStackParamList, 'Home'>;

  const navigation = useNavigation<NavigationProps>();

  const pressSend = () => {
    sendEmailOdoo();
  };

  const getMQTTData = async () => {
    const client = new Paho.Client(
      'mqtt-broker.notacoolcompany.com',
      9001,
      'react-native-client',
    );

    client.connect({
      userName: 'meteoiot',
      password: 'Meteo2025!',
      useSSL: false, // Cambia a `true` si el broker soporta `wss://`
      onSuccess: () => {
        client.subscribe('/test/message');
      },
      onFailure: err => {
        console.log('❌ Error de conexión MQTT:', err);
        getMQTTData();
        console.error('❌ Error de conexión:', err);
      },
    });

    client.onMessageArrived = message => {
      console.log(message);
      console.log(TOTEM_ID_LAST_DIGITS);
      if (
        JSON.parse(message.payloadString).device_info.uuid.slice(-4) ===
        TOTEM_ID_LAST_DIGITS
      ) {
        setMessages(JSON.parse(message.payloadString).measures);
      }
    };

    client.onConnectionLost = responseObject => {};
  };

  useEffect(() => {
    getMQTTData();
  }, []);

  useEffect(() => {
    console.log(messages);
    getAirQuality();
  }, [messages]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={Header}
        style={styles.headerContainer}
        resizeMode="stretch">
        <View style={styles.headerSection}>
          <View
            style={{
              flex: 1,
              height: '100%',
              flexDirection: 'column',
              display: 'flex',
            }}>
            <Logo width="70%" height="60%" style={styles.logo} />
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
            <Text style={{...styles.infoTitle, fontFamily: 'Poppins-SemiBold'}}>
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
        </View>
      </ImageBackground>

      {step == 0 ? (
        <ImageBackground
          source={Body}
          style={{width: screenWidth, height: screenHeight * 0.84}}>
          <LinearGradient
            colors={['#FFFFFF', 'transparent']} // Colores del gradiente
            locations={[0, 0.13]} // 0% y 83% del gradiente
            start={{x: 0, y: 0}} // Dirección del gradiente (de arriba a abajo)
            end={{x: 0, y: 1}}
            style={styles.gradient}>
            <View
              style={{
                paddingTop: screenHeight * 0.01,
                display: 'flex',
                flexDirection: 'column',
                gap: screenHeight * 0.02,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: screenWidth * 0.015,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Touch
                  height="140%"
                  width="3%"
                  // preserveAspectRatio="none"
                  style={{
                    flexShrink: 1,
                    // minWidth: screenWidth * 0.0,
                  }}></Touch>
                <Text
                  style={{
                    fontSize: screenWidth * 0.014,
                    fontFamily: 'Poppins-Bold',
                  }}>
                  PANTALLA TÁCTIL
                </Text>
                <Text
                  style={{
                    ...styles.infoSubtitleRed,
                    fontSize: screenWidth * 0.014,
                    fontFamily: 'Poppins-Bold',
                  }}>
                  PANTALLA TÁCTIL
                </Text>
                <Text
                  style={{
                    ...styles.infoSubtitleYellow,
                    fontSize: screenWidth * 0.014,
                    fontFamily: 'Poppins-Bold',
                  }}>
                  PANTALLA TÁCTIL
                </Text>
              </View>

              <View
                style={{
                  // marginHorizontal: screenWidth * 0.05,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: screenHeight * 0.65,
                }}>
                <View style={styles.shadowContainer}>
                  <ImageBackground
                    source={Header2}
                    style={{
                      width: screenWidth * 0.9,
                      height: screenHeight * 0.08,
                    }}
                    resizeMode="stretch">
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: screenHeight * 0.01,
                      }}>
                      <View
                        style={{
                          backgroundColor: 'white',
                          marginHorizontal: screenWidth * 0.05,
                          marginTop: screenWidth * 0.01,
                          width: 'auto',
                          alignSelf: 'flex-start',
                          maxWidth: screenWidth * 0.3,
                          borderRadius: 100,
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <Location
                          height="8%"
                          width="10%"
                          style={{
                            flexShrink: 1,
                            minHeight: screenHeight * 0.02,
                          }}></Location>
                        <Text
                          style={{
                            fontSize: screenWidth * 0.012,
                            fontFamily: 'Poppins-SemiBold',
                          }}>
                          Sant Josep de sa Talaia. Ibiza
                        </Text>
                      </View>
                      <View
                        style={{
                          width: screenWidth * 0.35,
                          alignItems: 'center',

                          // gap: screenHeight * 0.001,
                          display: 'flex',
                          flexDirection: 'column',
                        }}>
                        <Text
                          style={{
                            fontSize: screenWidth * 0.05,
                            fontFamily: 'Poppins-Bold',
                            lineHeight: screenWidth * 0.05,
                          }}>
                          {new Date().getDate()}
                        </Text>
                        <View
                          style={{
                            gap: screenWidth * 0.005,
                            display: 'flex',
                            flexDirection: 'row',
                          }}>
                          <Text
                            style={{
                              ...styles.infoTitle,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            {getDay(new Date().getDay(), 'es')}
                          </Text>
                          <Text
                            style={{
                              ...styles.infoTitle,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            /
                          </Text>
                          <Text
                            style={{
                              ...styles.infoSubtitleRed,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            {getDay(new Date().getDay(), 'va')}
                          </Text>
                          <Text
                            style={{
                              ...styles.infoTitle,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            /
                          </Text>
                          <Text
                            style={{
                              ...styles.infoSubtitleYellow,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            {getDay(new Date().getDay(), 'en')}
                          </Text>
                        </View>
                        <View
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: screenWidth * 0.005,
                          }}>
                          <Text
                            style={{
                              ...styles.infoTitle,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            {getMonth(
                              new Date().getMonth(),
                              'es',
                            )?.toUpperCase()}
                          </Text>
                          <Text
                            style={{
                              ...styles.infoTitle,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            /
                          </Text>
                          <Text
                            style={{
                              ...styles.infoSubtitleRed,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            {getMonth(
                              new Date().getMonth(),
                              'va',
                            )?.toUpperCase()}
                          </Text>
                          <Text
                            style={{
                              ...styles.infoTitle,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            /
                          </Text>
                          <Text
                            style={{
                              ...styles.infoSubtitleYellow,
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                            }}>
                            {getMonth(
                              new Date().getMonth(),
                              'en',
                            )?.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          flexGrow: 1,
                          height: '100%',
                          alignItems: 'flex-end',
                          marginTop: screenHeight * 0.01,
                          marginRight: screenWidth * 0.05,
                        }}>
                        <Text
                          style={{
                            fontSize: screenWidth * 0.02,
                            fontFamily: 'Poppins-Bold',
                          }}>
                          {new Date().getFullYear()}
                        </Text>
                      </View>
                    </View>
                  </ImageBackground>
                </View>
                <ImageBackground
                  source={Body1}
                  style={{
                    width: screenWidth * 0.9,
                    height: screenHeight * 0.65,
                    borderBottomLeftRadius: 16,
                    // backgroundColor: 'red',
                  }}
                  resizeMode="stretch">
                  <View style={styles.cardsContainer}>
                    <View style={styles.row}>
                      <View style={styles.card}>
                        <View
                          style={{
                            backgroundColor: 'white',
                            width: '100%',
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                          }}>
                          <Text
                            style={{
                              fontSize: screenWidth * 0.02,
                              textAlign: 'center',
                              paddingVertical: screenHeight * 0.003,
                              fontFamily: 'Poppins-Bold',
                              lineHeight: screenWidth * 0.025,
                            }}>
                            TEMPERATURA
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: 'transparent',
                            width: '100%',
                            borderBottomLeftRadius: 16,
                            borderBottomRightRadius: 16,
                            borderColor: 'white',
                            borderWidth: 0.5,
                            alignItems: 'center',
                          }}>
                          <View style={{display: 'flex', flexDirection: 'row'}}>
                            <Text
                              style={{
                                ...styles.infoSubtitleRed,
                                fontSize: screenWidth * 0.0125,
                                fontFamily: 'Poppins-Regular',
                                textAlign: 'center',
                                paddingVertical: screenHeight * 0.003,
                              }}>
                              Temperatura ·
                            </Text>
                            <Text
                              style={{
                                ...styles.infoSubtitleYellow,
                                fontSize: screenWidth * 0.0125,
                                fontFamily: 'Poppins-Regular',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                paddingVertical: screenHeight * 0.003,
                              }}>
                              Temperature
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            height: '25%',
                            flexDirection: 'row',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          {messages &&
                          messages.find(val => val.n === 'temp') &&
                          Number(
                            (
                              Math.round(
                                messages.find(val => val.n === 'temp')?.v * 10,
                              ) / 10
                            ).toFixed(1),
                          ) < 20 ? (
                            <TemperatureCold
                              height="75%"
                              width="30%"></TemperatureCold>
                          ) : messages &&
                            messages.find(val => val.n === 'temp') &&
                            Number(
                              (
                                Math.round(
                                  messages.find(val => val.n === 'temp')?.v *
                                    10,
                                ) / 10
                              ).toFixed(1),
                            ) < 30 ? (
                            <Temperature height="85%" width="40%"></Temperature>
                          ) : (
                            <TemperatureHot
                              height="75%"
                              width="30%"></TemperatureHot>
                          )}

                          <View
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              justifyContent: 'center',
                              alignItems: 'center',

                              paddingTop: '5%',
                            }}>
                            <Text
                              style={{
                                fontSize: screenWidth * 0.075,
                                fontFamily: 'Poppins-SemiBold',
                              }}>
                              {messages &&
                                messages.find(val => val.n === 'temp') &&
                                (
                                  Math.round(
                                    messages.find(val => val.n === 'temp')?.v *
                                      10,
                                  ) / 10
                                ).toFixed(1)}
                            </Text>
                            <Text
                              style={{
                                fontSize: screenWidth * 0.02,
                                fontFamily: 'Poppins-Regular',
                              }}>
                              ºC
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5%',
                            width: '95%',
                            height: '20%',
                          }}>
                          <View
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1%',
                            }}>
                            <View
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                // backgroundColor: 'red',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.01,
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Humedad
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleRed,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Humitat
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleYellow,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Humidity
                              </Text>
                            </View>
                            <View
                              style={{
                                height: '60%',
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                width: '95%',
                                borderRadius: 16,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.005,
                                marginTop: '1%',
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.01,
                                }}>
                                {messages &&
                                  messages.find(val => val.n === 'hum') &&
                                  (
                                    Math.round(
                                      messages.find(val => val.n === 'hum')?.v *
                                        10,
                                    ) / 10
                                  ).toFixed(1)}{' '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.01,
                                  }}>
                                  %
                                </Text>
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1%',
                            }}>
                            <View
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                // backgroundColor: 'red',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.01,
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Presión atmosférica
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleRed,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Pressió atmosfèrica
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleYellow,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Atmospheric pressure
                              </Text>
                            </View>
                            <View
                              style={{
                                height: '60%',
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                width: '95%',
                                borderRadius: 16,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.005,
                                marginTop: '1%',
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.01,
                                }}>
                                {messages &&
                                  messages.find(val => val.n === 'prb') &&
                                  (
                                    Math.round(
                                      messages.find(val => val.n === 'prb')?.v *
                                        10,
                                    ) / 10
                                  ).toFixed(1)}
                                {'  '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.01,
                                  }}>
                                  hPA
                                </Text>
                              </Text>
                            </View>
                          </View>
                        </View>
                        <ImageBackground
                          source={Mapa}
                          style={{
                            height: '50%',
                            width: '90%',
                            marginTop: '25%',
                            marginLeft: '12.5%',
                          }}
                          resizeMode="stretch"
                        />
                      </View>
                      <View style={styles.card}>
                        <View
                          style={{
                            backgroundColor: 'white',
                            width: '100%',
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                          }}>
                          <Text
                            style={{
                              fontSize: screenWidth * 0.02,
                              fontFamily: 'Poppins-Bold',
                              lineHeight: screenWidth * 0.025,
                              textAlign: 'center',
                              paddingVertical: screenHeight * 0.003,
                            }}>
                            CALIDAD DEL AIRE
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: 'transparent',
                            width: '100%',
                            borderBottomLeftRadius: 16,
                            borderBottomRightRadius: 16,
                            borderColor: 'white',
                            borderWidth: 0.5,
                            alignItems: 'center',
                          }}>
                          <View style={{display: 'flex', flexDirection: 'row'}}>
                            <Text
                              style={{
                                ...styles.infoSubtitleRed,
                                fontSize: screenWidth * 0.0125,
                                fontFamily: 'Poppins-Regular',
                                textAlign: 'center',
                                paddingVertical: screenHeight * 0.003,
                              }}>
                              Qualitat de l'aire ·
                            </Text>
                            <Text
                              style={{
                                ...styles.infoSubtitleYellow,
                                fontSize: screenWidth * 0.0125,
                                fontFamily: 'Poppins-Regular',
                                textAlign: 'center',
                                paddingVertical: screenHeight * 0.003,
                              }}>
                              Air quality
                            </Text>
                          </View>
                        </View>

                        <View
                          style={{
                            height: '25%',
                            flexDirection: 'row',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                          {airQuality === 'Buena' ? (
                            <CO2 height="75%" width="30%"></CO2>
                          ) : airQuality === 'Moderada' ? (
                            <CO2Regular height="75%" width="30%" />
                          ) : (
                            <CO2Bad height="75%" width="30%" />
                          )}

                          <View
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              justifyContent: 'center',
                              alignItems: 'center',
                              paddingTop: '5%',
                            }}>
                            <Text
                              style={{
                                fontSize: screenWidth * 0.075,
                                fontFamily: 'Poppins-SemiBold',
                              }}>
                              {airQualityValue}
                            </Text>
                            <Text
                              style={{
                                fontSize: screenWidth * 0.02,
                                fontFamily: 'Poppins-Regular',
                              }}>
                              ppm.
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3%',
                            width: '95%',
                            height: '20%',
                          }}>
                          <View
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1%',
                            }}>
                            <View
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                // backgroundColor: 'red',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.01,
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                M. de carbono / Ozono
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleRed,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                M. de carboni / Ozó
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleYellow,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Carbon monoxide / Ozone
                              </Text>
                            </View>
                            <View
                              style={{
                                height: '60%',
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                width: '95%',
                                borderRadius: 16,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.005,
                                marginTop: '1%',
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.015,
                                }}>
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  CO:{' '}
                                </Text>
                                {messages &&
                                messages.find(val => val.n === 'co') &&
                                messages.find(val => val.n === 'co')?.v > 0
                                  ? (
                                      Math.round(
                                        messages.find(val => val.n === 'co')
                                          ?.v * 10,
                                      ) / 10
                                    ).toFixed(1)
                                  : 0}{' '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  ppm
                                </Text>
                              </Text>
                              <View
                                style={{
                                  width: '1%',
                                  backgroundColor: '#BFC7D1',
                                  height: '50%',
                                }}></View>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.015,
                                }}>
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  O3:{' '}
                                </Text>
                                {messages &&
                                messages.find(val => val.n === 'o3') &&
                                messages.find(val => val.n === 'o3')?.v > 0
                                  ? (
                                      Math.round(
                                        messages.find(val => val.n === 'o3')
                                          ?.v * 10,
                                      ) / 10
                                    ).toFixed(1)
                                  : 0}{' '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.01,
                                  }}>
                                  ppb
                                </Text>
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1%',
                            }}>
                            <View
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                // backgroundColor: 'red',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.01,
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                D. de nitrógeno y azufre
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleRed,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                D. de nitrogen i sofre
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleYellow,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Nitrogen dioxide / Sulfur
                              </Text>
                            </View>
                            <View
                              style={{
                                height: '60%',
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                width: '95%',
                                borderRadius: 16,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.005,
                                marginTop: '1%',
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.015,
                                }}>
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  NO2:{' '}
                                </Text>
                                {messages &&
                                messages.find(val => val.n === 'no2') &&
                                messages.find(val => val.n === 'no2')?.v > 0
                                  ? (
                                      Math.round(
                                        messages.find(val => val.n === 'no2')
                                          ?.v * 10,
                                      ) / 10
                                    ).toFixed(1)
                                  : 0}{' '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  ppm
                                </Text>
                              </Text>
                              <View
                                style={{
                                  width: '1%',
                                  backgroundColor: '#BFC7D1',
                                  height: '50%',
                                }}></View>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.015,
                                }}>
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  SO2:{' '}
                                </Text>
                                {messages &&
                                messages.find(val => val.n === 'so2') &&
                                messages.find(val => val.n === 'so2')?.v > 0
                                  ? (
                                      Math.round(
                                        messages.find(val => val.n === 'so2')
                                          ?.v * 10,
                                      ) / 10
                                    ).toFixed(1)
                                  : 0}{' '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.01,
                                  }}>
                                  ppb
                                </Text>
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1%',
                            }}>
                            <View
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                // backgroundColor: 'red',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.01,
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Partículas gruesas
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleRed,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Partícules gruixudes
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleYellow,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Coarse particles
                              </Text>
                            </View>
                            <View
                              style={{
                                height: '60%',
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                width: '95%',
                                borderRadius: 16,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.005,
                                marginTop: '1%',
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.015,
                                }}>
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  PM10:{' '}
                                </Text>
                                {messages &&
                                  messages.find(val => val.n === 'pm10') &&
                                  (
                                    Math.round(
                                      messages.find(val => val.n === 'pm10')
                                        ?.v * 10,
                                    ) / 10
                                  ).toFixed(1)}
                                {'  '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                  }}>
                                  µg/m3
                                </Text>
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1%',
                            }}>
                            <View
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                // backgroundColor: 'red',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.01,
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Part. finas e inhalables
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleRed,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Part. fines i inhalables
                              </Text>
                              <Text
                                style={{
                                  ...styles.infoSubtitleYellow,
                                  fontSize: screenWidth * 0.01,
                                  fontFamily: 'Poppins-Bold',
                                }}>
                                Fine and inhalable part.
                              </Text>
                            </View>
                            <View
                              style={{
                                height: '60%',
                                backgroundColor: 'rgba(255,255,255,0.6)',
                                width: '95%',
                                borderRadius: 16,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: screenWidth * 0.005,
                                marginTop: '1%',
                              }}>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.015,
                                }}>
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  PM2.5:{' '}
                                </Text>
                                {messages &&
                                  messages.find(val => val.n === 'pm2.5') &&
                                  (
                                    Math.round(
                                      messages.find(val => val.n === 'pm2.5')
                                        ?.v * 10,
                                    ) / 10
                                  ).toFixed(1)}{' '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  µg/m3
                                </Text>
                              </Text>
                              <View
                                style={{
                                  width: '1%',
                                  backgroundColor: '#BFC7D1',
                                  height: '50%',
                                }}></View>
                              <Text
                                style={{
                                  fontSize: screenWidth * 0.02,
                                  fontFamily: 'Poppins-Bold',
                                  lineHeight: screenHeight * 0.015,
                                }}>
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.015,
                                  }}>
                                  PM1:{' '}
                                </Text>
                                {messages &&
                                  messages.find(val => val.n === 'pm1') &&
                                  (
                                    Math.round(
                                      messages.find(val => val.n === 'pm1')?.v *
                                        10,
                                    ) / 10
                                  ).toFixed(1)}{' '}
                                <Text
                                  style={{
                                    fontSize: screenWidth * 0.015,
                                    fontFamily: 'Poppins-Regular',
                                    lineHeight: screenHeight * 0.01,
                                  }}>
                                  µg/m3
                                </Text>
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.selfieCard}>
                      <View
                        style={{
                          width: '40%',
                          borderTopRightRadius: 10,
                          borderTopLeftRadius: 10,
                          backgroundColor: 'white',
                          paddingVertical: screenHeight * 0.0025,
                          paddingHorizontal: 0.1,
                        }}>
                        <Text
                          style={{
                            fontSize: screenWidth * 0.02,
                            fontFamily: 'Poppins-Bold',
                            lineHeight: screenHeight * 0.015,
                            textAlign: 'center',
                          }}>
                          HÁZTE UN SELFIE
                        </Text>
                      </View>
                      <View
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',

                          display: 'flex',
                          flexDirection: 'row',
                          width: '40%',
                          borderBottomRightRadius: 10,
                          borderBottomLeftRadius: 10,
                          backgroundColor: 'transparent',
                          paddingVertical: screenHeight * 0.0025,
                          paddingHorizontal: 0.1,
                          borderWidth: 0.5,
                          borderColor: 'white',
                        }}>
                        <View
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: screenWidth * 0.01,
                          }}>
                          <Text
                            style={{
                              ...styles.infoSubtitleRed,
                              fontSize: screenWidth * 0.0125,
                              fontFamily: 'Poppins-Medium',
                              textAlign: 'center',
                              paddingVertical: screenHeight * 0.003,
                            }}>
                            Fer-se una selfie
                          </Text>
                          <Text
                            style={{
                              ...styles.infoSubtitleYellow,
                              fontSize: screenWidth * 0.0125,
                              fontFamily: 'Poppins-Medium',
                              textAlign: 'center',
                              paddingVertical: screenHeight * 0.003,
                            }}>
                            Take a selfie
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          display: 'flex',
                          width: '100%',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          paddingRight: screenWidth * 0.03,
                        }}>
                        <ImageBackground
                          source={RectangleSelfie}
                          style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '85%',
                            height: '85%',
                          }}
                          resizeMode="stretch">
                          <TouchableOpacity onPress={() => setStep(1)}>
                            <TakeSelfie
                              width0="85%"
                              height="85%"
                              style={{
                                marginBottom: screenHeight * 0.015,
                                marginRight: screenWidth * 0.09,
                              }}></TakeSelfie>
                          </TouchableOpacity>
                        </ImageBackground>
                      </View>
                      <View
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: screenHeight * 0.001,
                          gap: screenWidth * 0.02,
                        }}>
                        <Text
                          style={{
                            fontSize: screenWidth * 0.015,
                            fontFamily: 'Poppins-Bold',
                            lineHeight: screenHeight * 0.02,
                          }}>
                          Visita la web turística de Xxxxx Xxxx
                        </Text>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#006EA0',
                            borderRadius: 50,
                            paddingVertical: screenHeight * 0.0005,
                            paddingHorizontal: screenWidth * 0.03,
                            display: 'flex',
                            width: screenWidth * 0.15,
                            flexDirection: 'row',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: screenWidth * 0.01,
                          }}
                          onPress={() => {
                            setStep(4);
                            setLoading(true);
                          }}>
                          <Text
                            style={{
                              color: 'white',
                              fontSize: screenWidth * 0.015,
                              fontFamily: 'Poppins-Bold',
                              lineHeight: screenHeight * 0.02,
                            }}>
                            Website
                          </Text>
                          <Next
                            height={screenHeight * 0.02}
                            width={screenWidth * 0.02}></Next>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <ImageBackground
                    source={Body2}
                    style={{
                      width: screenWidth * 0.9,
                      height: screenHeight * 0.05,
                    }}
                    resizeMode="stretch">
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: screenWidth * 0.02,
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <UE
                        height={screenHeight * 0.05}
                        width="10%"
                        style={{flex: 1}}></UE>
                      <Ministerio
                        height={screenHeight * 0.05}
                        width="10%"
                        style={{flex: 1}}></Ministerio>
                      <Plan
                        height={screenHeight * 0.05}
                        width="10%"
                        style={{flex: 1}}></Plan>
                      <Minilogo
                        height={screenHeight * 0.05}
                        width="10%"
                        style={{flex: 1}}></Minilogo>
                    </View>
                  </ImageBackground>
                </ImageBackground>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : step == 1 ? (
        <View
          style={{
            backgroundColor: '#C7EEFF',
            height: screenHeight * 0.9,
            paddingVertical: screenHeight * 0.02,
            alignItems: 'center',
            gap: screenHeight * 0.015,
          }}>
          <Camera
            ref={cameraRef}
            style={{
              width: screenWidth,
              height: screenHeight * 0.75,
            }}
            device={device}
            isActive={true}
            photo={true}
          />
          <View
            style={{
              width: '100%',
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: screenWidth * 0.05,
            }}>
            <TouchableOpacity
              style={{
                alignSelf: 'center',
                borderRadius: 100,
                height: screenHeight * 0.055,
              }}
              onPress={() => setStep(0)}>
              <Back
                height={screenHeight * 0.055}
                width={screenWidth * 0.1}
                style={{height: screenWidth * 0.02}}></Back>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleTakePhoto} disabled={isCounting}>
              <Photo
                height={screenHeight * 0.055}
                width={screenWidth * 0.4}></Photo>
            </TouchableOpacity>
            {isCounting && (
              <Text
                style={{
                  marginTop: screenHeight * 0.01,
                  fontSize: screenWidth * 0.05,
                  color: '#006EA0',
                  fontFamily: 'Poppins-Bold',
                }}>
                {countdown}
              </Text>
            )}
          </View>
        </View>
      ) : step == 2 ? (
        <KeyboardAvoidingView
          style={{
            flex: 1,
            height: screenHeight * 0.9,
            backgroundColor: '#C7EEFF',
          }}
          behavior={'height'}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={{
                backgroundColor: '#C7EEFF',

                paddingTop: screenHeight * 0.02,
                paddingBottom: screenHeight * 0.1,
                alignItems: 'center',
                gap: screenHeight * 0.015,
                overflow: 'scroll',
              }}>
              <TouchableOpacity
                style={{
                  alignSelf: 'center',
                  borderRadius: 100,
                  height: screenHeight * 0.055,
                }}
                onPress={() => setStep(0)}>
                <Back
                  height={screenHeight * 0.055}
                  width={screenWidth * 0.1}
                  style={{height: screenWidth * 0.02}}></Back>
              </TouchableOpacity>
              <Image
                key={1}
                source={{
                  uri: 'data:image/jpeg;base64,' + image64,
                }}
                style={{
                  width: screenWidth * 0.3,
                  height: screenHeight * 0.1965,
                  borderRadius: 8,
                  backgroundColor: 'black',
                }}
                resizeMode="contain"
              />
              <View
                style={{
                  backgroundColor: '#DBF4FF',
                  borderRadius: 20,
                  paddingHorizontal: screenWidth * 0.05,
                }}>
                <Text
                  style={{
                    fontFamily: 'Poppins-Medium',
                    fontSize: screenWidth * 0.015,
                  }}>
                  PREVIEW
                </Text>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: screenWidth * 0.02,
                }}>
                <Pressable onPress={() => setAccepted(!accepted)}>
                  <View
                    style={{
                      backgroundColor: accepted
                        ? '#006EA0'
                        : 'rgba(255,255,255,0.6)',
                      borderWidth: 0.5,
                      borderColor: '#8CDBFF',
                      borderRadius: 4,
                      height: screenHeight * 0.035,
                      width: screenWidth * 0.065,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {accepted && <Check height={screenHeight * 0.025}></Check>}
                  </View>
                </Pressable>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: screenHeight * 0.005,
                  }}>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Bold',
                      fontSize: screenWidth * 0.015,
                    }}>
                    Aceptación de la política de privacidad
                  </Text>
                  <Text
                    style={{
                      ...styles.infoSubtitleRed,
                      fontFamily: 'Poppins-Medium',
                      fontSize: screenWidth * 0.015,
                    }}>
                    Acceptació de la política de privadesa
                  </Text>
                  <Text
                    style={{
                      ...styles.infoSubtitleYellow,
                      fontFamily: 'Poppins-Medium',
                      fontSize: screenWidth * 0.015,
                    }}>
                    Acceptance of the privacy policy
                  </Text>
                </View>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: screenHeight * 0.005,
                  }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#006EA0',
                      borderRadius: 50,
                      paddingHorizontal: screenWidth * 0.03,
                      display: 'flex',
                      width: screenWidth * 0.2,
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      height: screenHeight * 0.015,
                      alignItems: 'center',
                      gap: screenWidth * 0.01,
                    }}
                    onPress={() => {
                      {
                        setReadPrivacy(true);
                        setPrivacyLang('es');
                      }
                    }}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: screenWidth * 0.0125,
                        fontFamily: 'Poppins-Bold',
                        lineHeight: screenHeight * 0.01,
                      }}>
                      Leer privacidad
                    </Text>
                    <Next
                      height={screenHeight * 0.02}
                      width={screenWidth * 0.02}></Next>
                  </TouchableOpacity>{' '}
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#006EA0',
                      borderRadius: 50,
                      paddingHorizontal: screenWidth * 0.03,
                      display: 'flex',
                      width: screenWidth * 0.2,
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      height: screenHeight * 0.015,
                      alignItems: 'center',
                      gap: screenWidth * 0.01,
                    }}
                    onPress={() => {
                      {
                        setReadPrivacy(true);
                        setPrivacyLang('va');
                      }
                    }}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: screenWidth * 0.0125,
                        fontFamily: 'Poppins-Bold',
                        lineHeight: screenHeight * 0.01,
                      }}>
                      Llegir privadesa
                    </Text>
                    <Next
                      height={screenHeight * 0.02}
                      width={screenWidth * 0.02}></Next>
                  </TouchableOpacity>{' '}
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#006EA0',
                      borderRadius: 50,
                      paddingHorizontal: screenWidth * 0.03,
                      // display: 'flex',
                      width: screenWidth * 0.2,
                      flexDirection: 'row',
                      justifyContent: 'flex-start',
                      height: screenHeight * 0.015,
                      alignItems: 'center',
                      gap: screenWidth * 0.01,
                    }}
                    onPress={() => {
                      {
                        setReadPrivacy(true);
                        setPrivacyLang('en');
                      }
                    }}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: screenWidth * 0.0125,
                        fontFamily: 'Poppins-Bold',
                        lineHeight: screenHeight * 0.01,
                      }}>
                      Read privacy
                    </Text>
                    <Next
                      height={screenHeight * 0.02}
                      width={screenWidth * 0.02}></Next>
                  </TouchableOpacity>
                </View>
              </View>
              {accepted && (
                <View
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    marginTop: screenHeight * 0.02,
                  }}>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Bold',
                      fontSize: screenWidth * 0.025,
                    }}>
                    ENVÍALA POR EMAIL
                  </Text>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{
                        ...styles.infoSubtitleRed,
                        fontFamily: 'Poppins-Regular',
                        fontSize: screenWidth * 0.015,
                      }}>
                      Envieu-ho per correu electrònic ·
                    </Text>
                    <Text
                      style={{
                        ...styles.infoSubtitleYellow,
                        fontFamily: 'Poppins-Regular',
                        fontSize: screenWidth * 0.015,
                      }}>
                      Send it by email
                    </Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text
                      style={{
                        ...styles.label,
                        fontFamily: 'Poppins-Regular',
                        fontSize: screenWidth * 0.015,
                      }}>
                      Email
                    </Text>
                    <View
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: screenWidth * 0.02,
                        width: screenWidth * 0.7,
                      }}>
                      <TextInput
                        onFocus={() => {
                          setFocused(true);
                        }}
                        onBlur={() => {
                          setFocused(false);
                        }}
                        onChange={e => {
                          setEmail(e.nativeEvent.text);
                        }}
                        style={{
                          ...styles.input,
                          backgroundColor: focused ? '#DBF4FF' : 'white',
                        }}
                        placeholder="Escribe. Write"
                        placeholderTextColor="#90CAF9" // Light blue placeholder
                        keyboardType="email-address"
                      />
                      <TouchableOpacity onPress={pressSend}>
                        <View
                          style={{
                            height: screenHeight * 0.025,
                            flex: 1,
                            backgroundColor: '#006EA0',
                            borderWidth: 1,
                            borderColor: '#8CDBFF',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: 14,
                            display: 'flex',
                            flexDirection: 'row',
                            paddingHorizontal: screenWidth * 0.02,
                          }}>
                          {sendingImage ? (
                            <ActivityIndicator
                              size="small"
                              color="white"></ActivityIndicator>
                          ) : (
                            <>
                              <Text
                                style={{
                                  color: 'white',
                                  fontFamily: 'Poppins-Regular',
                                  fontSize: screenWidth * 0.02,
                                  lineHeight: screenHeight * 0.01,
                                }}>
                                Enviar.
                              </Text>
                              <Text
                                style={{
                                  color: '#EBC714',
                                  fontFamily: 'Poppins-Regular',
                                  fontSize: screenWidth * 0.02,
                                  lineHeight: screenHeight * 0.01,
                                  marginRight: screenWidth * 0.01,
                                }}>
                                Send
                              </Text>
                              <Next
                                height={screenHeight * 0.04}
                                width={screenWidth * 0.04}></Next>
                            </>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              {readPrivacy && (
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: screenWidth * 0.01,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Bold',
                      fontSize: screenWidth * 0.015,
                    }}>
                    Cerrar
                  </Text>
                  <TouchableOpacity onPress={() => setReadPrivacy(false)}>
                    <Close
                      height={screenHeight * 0.03}
                      width={screenWidth * 0.05}></Close>
                  </TouchableOpacity>
                  <Text
                    style={{
                      ...styles.infoSubtitleYellow,
                      fontFamily: 'Poppins-Medium',
                      fontSize: screenWidth * 0.015,
                    }}>
                    Close
                  </Text>
                </View>
              )}
              {readPrivacy && (
                <View
                  style={{
                    height: screenHeight * 0.15,
                    width: screenWidth * 0.85,
                    backgroundColor: '#EEFAFF',
                  }}>
                  <ScrollView
                    style={{
                      marginTop: screenHeight * 0.02,
                      gap: screenHeight * 0.0025,
                      paddingHorizontal: screenWidth * 0.03,
                    }}>
                    <Text
                      style={{
                        ...(privacyLang === 'va'
                          ? styles.infoSubtitleRed
                          : privacyLang === 'en'
                          ? styles.infoSubtitleYellow
                          : undefined),
                        fontFamily: 'Poppins-Bold',
                        fontSize: screenWidth * 0.02,
                      }}>
                      {getPrivacyTitle(privacyLang)}
                    </Text>
                    {privacyLang == 'es' ? (
                      <Text
                        style={{
                          fontFamily: 'Poppins-Regular',
                          fontSize: screenWidth * 0.015,
                        }}>
                        {data?.privacy_text}
                      </Text>
                    ) : privacyLang == 'en' ? (
                      <Text
                        style={{
                          ...styles.infoSubtitleYellow,
                          fontFamily: 'Poppins-Regular',
                          fontSize: screenWidth * 0.015,
                        }}>
                        {data?.privacy_text_en}
                      </Text>
                    ) : (
                      <Text
                        style={{
                          ...styles.infoSubtitleRed,
                          fontFamily: 'Poppins-Regular',
                          fontSize: screenWidth * 0.015,
                        }}>
                        {data?.privacy_text_ca}
                      </Text>
                    )}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      ) : step == 3 ? (
        <View
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: screenHeight * 0.05,
          }}>
          <ImageBackground
            source={Popup}
            style={{
              width: screenWidth * 0.8,
              height: screenHeight * 0.35,
            }}
            resizeMode="stretch">
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingHorizontal: screenWidth * 0.05,
                paddingTop: screenHeight * 0.02,
                gap: screenHeight * 0.01,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: screenWidth * 0.01,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <TouchableOpacity onPress={() => setStep(0)}>
                  <Close
                    height={screenHeight * 0.02}
                    width={screenWidth * 0.05}></Close>
                </TouchableOpacity>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: 'white',
                      fontFamily: 'Poppins-Medium',
                      fontSize: screenWidth * 0.015,
                    }}>
                    Cerrar
                  </Text>
                  <Text
                    style={{
                      ...styles.infoSubtitleYellow,
                      fontFamily: 'Poppins-Medium',
                      fontSize: screenWidth * 0.015,
                    }}>
                    Close
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: '90%',
                  backgroundColor: '#002A3E',
                  borderRadius: 16,
                  paddingVertical: screenHeight * 0.035,
                  gap: screenHeight * 0.01,
                  alignItems: 'center',
                }}>
                <Sent height={screenHeight * 0.07}></Sent>
                <Text
                  style={{
                    color: '#C7EEFF',
                    fontFamily: 'Poppins-Bold',
                    fontSize: screenWidth * 0.025,
                  }}>
                  TE HEMOS ENVIADO UN CORREO CON TU SELFIE
                </Text>
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      color: '#FDA8A8',
                      fontFamily: 'Poppins-Bold',
                      fontSize: screenWidth * 0.015,
                    }}>
                    T'hem enviat un email amb el teu selfie
                  </Text>
                  <Text
                    style={{
                      color: '#EBC714',
                      fontFamily: 'Poppins-Bold',
                      fontSize: screenWidth * 0.015,
                    }}>
                    We have sent you an email with your selfie
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>
      ) : (
        <TouchableWithoutFeedback onPress={resetTimer}>
          <View style={styles.container}>
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#006EA0" />
              </View>
            ) : (
              <View
                style={{
                  ...styles.loaderContainer,
                  paddingVertical: screenHeight * 0.01,
                }}>
                <TouchableOpacity onPress={() => setStep(0)}>
                  <Home
                    height={screenHeight * 0.055}
                    width={screenWidth * 0.1}
                    style={{height: screenWidth * 0.02}}></Home>
                </TouchableOpacity>
              </View>
            )}
            <WebView
              source={{uri: data?.web ? data.web : ''}}
              onLoadStart={() => setLoading(true)} // Show loader when WebView starts loading
              onLoad={() => setLoading(false)} // Hide loader when WebView finishes loading
              style={{flex: 1, backgroundColor: '#C7EEFF'}}
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Sección inferior: Pantalla de información */}
    </View>
  );
}

// Estilos optimizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B2E4FF', // Color azul de fondo
  },
  gradient: {
    width: '100%',
    height: 140, // Ajusta según necesites
  },
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4, // Shadow at the bottom
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // For Android
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48, // Optional, to match rounded edges
  },
  //   logo: {
  //     // aspectRatio: 1, // Mantiene la proporción del logo
  // , // Evita que se deforme en pantallas grandes
  //   },
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
  title: {
    fontSize: 20,
    marginLeft: 12,
    color: '#333',
  },
  boldText: {
    fontWeight: 'bold',
  },
  logo: {
    marginLeft: '10%',
  },
  servicesBox: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginHorizontal: '5%',
    marginTop: 30,
  },
  servicesTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  servicesSubtitle: {
    fontSize: 12,
    color: '#777',
  },
  serviceItem: {
    marginTop: 10,
  },
  serviceText: {
    fontSize: 14,
    color: '#333',
  },
  serviceTextHighlight: {
    color: '#D00000', // Rojo para destacar
    fontWeight: 'bold',
  },
  infoScreen: {
    paddingTop: screenHeight * 0.03,
    flex: 1,
    alignItems: 'flex-start',
    // backgroundColor: 'green',
    height: '100%',
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
  cardsContainer: {
    height: '99%',
    width: '100%',
    alignItems: 'center',
    paddingTop: screenHeight * 0.01,
    gap: screenHeight * 0.02,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: screenWidth * 0.05,
    justifyContent: 'center',
    gap: screenWidth * 0.05,
    width: screenWidth * 0.9,
    height: '55%',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: screenWidth * 0.01,
    paddingVertical: screenHeight * 0.005,
    // margin: 10,
    width: '50%',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: screenWidth,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: 'gray',
  },
  cardValue: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  icon: {
    width: 50,
    height: 50,
    marginVertical: 10,
  },
  selfieCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 15,
    paddingTop: screenHeight * 0.005,
    width: '94%',
    height: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  selfieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selfieSubtitle: {
    fontSize: 12,
    color: 'gray',
  },
  selfieButton: {
    backgroundColor: 'transparent',
    marginTop: screenHeight * 0.01,
    width: '57%',
    alignItems: 'center',
  },
  selfieButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  selfieButtonSubtext: {
    fontSize: 10,
    color: 'yellow',
  },
  inputContainer: {
    alignSelf: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#006EA0', // Dark blue label
    marginBottom: screenHeight * 0.005,
  },
  input: {
    borderRadius: 10, // Rounded corners
    height: screenHeight * 0.05,
    paddingHorizontal: screenWidth * 0.02,
    fontSize: screenWidth * 0.02,
    flex: 1,
    borderWidth: 1,
    borderColor: '#8CDBFF', // Subtle border
    color: '#002A3E', // Text color
    paddingVertical: 0,
  },
  containerWeb: {
    flex: 1,
    height: screenHeight,
    backgroundColor: 'white',
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C7EEFF',
  },
});

export default HomeView;
