# 🏝️ Sa Talaia Totem

Aplicación React Native para el totem informativo de **Sant Josep de sa Talaia, Ibiza**. Funciona como un punto de información turística con capacidades de selfie y monitoreo ambiental en tiempo real.

## 📱 Características Principales

### 🌤️ **Monitoreo Ambiental**
- **Datos meteorológicos** en tiempo real (temperatura, humedad, presión atmosférica)
- **Calidad del aire** con mediciones de CO, O3, NO2, SO2, PM10, PM2.5, PM1
- **Cálculo automático** del Índice de Calidad del Aire (ICA)
- **Conexión MQTT** para actualizaciones en tiempo real

### 📸 **Sistema de Selfie**
- **Cámara frontal** integrada con cuenta regresiva de 10 segundos
- **Captura automática** de fotos en alta calidad
- **Envío por email** a través de integración con Odoo
- **Política de privacidad** multilingüe (Español, Catalán, Inglés)

### 🌍 **Información Turística**
- **Interfaz multilingüe** completa (ES/CA/EN)
- **Navegación web** integrada a sitio turístico
- **Diseño responsive** optimizado para pantallas táctiles
- **UI moderna** con gradientes y animaciones

## 🚀 Tecnologías Utilizadas

- **React Native 0.77.1** con TypeScript
- **Navegación** con React Navigation v7
- **Cámara** con react-native-vision-camera
- **Comunicación MQTT** para datos en tiempo real
- **Integración con Odoo** para backend y emails
- **Gradientes** con react-native-linear-gradient
- **Fuentes personalizadas** (Poppins)

## 📋 Requisitos Previos

- **Node.js** >= 18
- **React Native CLI** instalado globalmente
- **Android Studio** (para desarrollo Android)
- **Xcode** (para desarrollo iOS, solo macOS)
- **Java JDK 17** o superior

## 🛠️ Instalación

### 1. **Clonar el Repositorio**
```bash
git clone https://github.com/tu-usuario/sa-talaia-totem.git
cd sa-talaia-totem
```

### 2. **Instalar Dependencias**
```bash
npm install
```

### 3. **Configurar Variables de Entorno**
Crea un archivo `.env` en la raíz del proyecto:

```bash
# Odoo Configuration
ODOO_URL=https://tu-odoo-instance.com
ODOO_DB=tu_base_de_datos
ODOO_USERNAME=tu_usuario
ODOO_PASSWORD=tu_password

# MQTT Configuration
TOTEM_ID_LAST_DIGITS=1234
```

### 4. **Configurar Android**
```bash
# Navegar al directorio Android
cd android

# Limpiar build anterior
./gradlew clean

# Verificar configuración
./gradlew --version
```

### 5. **Ejecutar la Aplicación**
```bash
# Volver a la raíz del proyecto
cd ..

# Iniciar Metro bundler
npm start

# En otra terminal, ejecutar en Android
npm run android
```

## 🏗️ Estructura del Proyecto

```
sa-talaia-totem/
├── src/
│   └── HomeView.tsx          # Vista principal con toda la lógica
├── android/                  # Configuración nativa Android
├── ios/                     # Configuración nativa iOS
├── assets/                  # Imágenes, iconos, fuentes
├── types/                   # Definiciones TypeScript
├── .github/workflows/       # GitHub Actions para CI/CD
└── App.tsx                  # Punto de entrada de la aplicación
```

## 🔧 Configuración de Build

### **Build de Debug (Desarrollo)**
```bash
cd android
./gradlew assembleDebug
```

### **Build de Release (Producción)**
```bash
cd android
./gradlew assembleRelease
```

### **Build de Bundle (Play Store)**
```bash
cd android
./gradlew bundleRelease
```

## 🚀 GitHub Actions - CI/CD Automático

El proyecto incluye workflows automatizados para construir y distribuir APKs:

### **Workflows Disponibles**

#### 1. **Android Build & Release** (`android-build.yml`)
- ✅ Build automático en PRs y tags
- ✅ Generación de APK y AAB
- ✅ Creación automática de releases
- ✅ Subida de artifacts como assets

#### 2. **Quick Android Build** (`quick-build.yml`)
- ✅ Build rápido para desarrollo
- ✅ Timeout de 15 minutos
- ✅ Solo cambios relevantes

#### 3. **Code Quality & Testing** (`code-quality.yml`)
- ✅ Linting y testing automático
- ✅ Escaneo de seguridad
- ✅ Validación de configuración Android

### **Cómo Usar GitHub Actions**

#### **Build Manual (Desarrollo)**
1. Ve a **Actions** en tu repositorio
2. Selecciona **Quick Android Build**
3. Haz clic en **Run workflow**
4. Elige la variante: `debug` o `release`

#### **Release Automático**
```bash
# Crear y subir un tag
git tag v1.0.0
git push origin v1.0.0
```

El workflow se ejecutará automáticamente y:
- Generará APK y AAB de release
- Creará un release en GitHub
- Subirá los archivos como assets

## 📊 Monitoreo y Datos

### **Fuentes de Datos**
- **MQTT Broker**: `mqtt-broker.notacoolcompany.com:9001`
- **Backend**: Odoo para gestión de datos y emails
- **Sensores**: Estación meteorológica local

### **Métricas Disponibles**
- **Temperatura** (°C)
- **Humedad** (%)
- **Presión atmosférica** (hPA)
- **CO** (ppm)
- **O3** (ppb)
- **NO2** (ppb)
- **SO2** (ppb)
- **PM10, PM2.5, PM1** (µg/m³)

## 🎨 Personalización

### **Cambiar Colores y Estilos**
Edita `src/HomeView.tsx` para modificar:
- Colores de la interfaz
- Tamaños de fuentes
- Espaciado y layout

### **Agregar Nuevos Idiomas**
1. Agrega el idioma en `types/entities.ts`
2. Implementa las traducciones en `HomeView.tsx`
3. Actualiza las funciones `getMonth()` y `getDay()`

### **Modificar Configuración MQTT**
Edita las credenciales en `.env`:
```bash
MQTT_BROKER=tu-broker.com
MQTT_PORT=9001
MQTT_USERNAME=tu_usuario
MQTT_PASSWORD=tu_password
```

## 🧪 Testing

### **Ejecutar Tests**
```bash
npm test
```

### **Tests con Coverage**
```bash
npm test -- --coverage --watchAll=false
```

### **Linting**
```bash
npm run lint
```

## 📱 Distribución

### **APK de Debug**
- **Uso**: Testing y desarrollo
- **Ubicación**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Tamaño**: ~50-100MB

### **APK de Release**
- **Uso**: Distribución y producción
- **Ubicación**: `android/app/build/outputs/apk/release/app-release.apk`
- **Tamaño**: ~30-80MB

### **Bundle (AAB)**
- **Uso**: Google Play Store
- **Ubicación**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Tamaño**: ~25-70MB

## 🔒 Seguridad

### **Keystore de Release**
Para builds de producción, asegúrate de tener:
- `android/app/my-release-key.jks` (tu keystore)
- `android/app/debug.keystore` (para desarrollo)

### **Variables de Entorno**
- Nunca subas archivos `.env` al repositorio
- Usa GitHub Secrets para credenciales en CI/CD
- Rota regularmente las contraseñas

## 🐛 Solución de Problemas

### **Problemas Comunes**

#### **Build Falla por Licencias Android**
```bash
# En el workflow ya está incluido:
yes | sdkmanager --licenses
```

#### **Error de Memoria en Gradle**
```bash
# Agregar en gradle.properties:
org.gradle.jvmargs=-Xmx2048m
```

#### **Problemas de Dependencias**
```bash
# Limpiar cache
npm cache clean --force
cd android && ./gradlew clean
```

#### **Error de Cámara**
- Verifica permisos en `AndroidManifest.xml`
- Asegúrate de que `react-native-vision-camera` esté bien configurado

## 📚 Recursos Adicionales

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Vision Camera](https://mrousavy.com/react-native-vision-camera/)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)
- [Odoo API](https://www.odoo.com/documentation/16.0/developer/reference/external_api.html)

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. **Issues**: Abre un issue en GitHub
2. **Documentación**: Revisa este README y la documentación de los workflows
3. **Logs**: Revisa los logs de GitHub Actions para debugging
4. **Comunidad**: Consulta la documentación de React Native

---

**Desarrollado con ❤️ para Sa Talaia, Ibiza**

*Un proyecto de información turística y monitoreo ambiental en tiempo real.*
