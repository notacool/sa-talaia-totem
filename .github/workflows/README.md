# GitHub Actions para Android

Este directorio contiene los workflows de GitHub Actions para automatizar la construcción y distribución de APKs de Android.

## 📱 Workflows Disponibles

### 1. **Android Build & Release** (`android-build.yml`)
Workflow completo para builds de producción y releases automáticos.

**Triggers:**
- Push a `main` o `develop`
- Tags con formato `v*` (ej: v1.0.0)
- Pull Requests a `main` o `develop`
- Manual (workflow_dispatch)

**Funcionalidades:**
- ✅ Build automático de APK debug en PRs
- ✅ Build automático de APK release en tags
- ✅ Generación de AAB para Play Store
- ✅ Creación automática de releases en GitHub
- ✅ Subida de artifacts como assets del release
- ✅ Cache optimizado para dependencias

### 2. **Quick Android Build** (`quick-build.yml`)
Workflow rápido para builds de desarrollo y testing.

**Triggers:**
- Push a `develop` (solo cambios en código)
- Manual (workflow_dispatch)

**Funcionalidades:**
- ✅ Build rápido (timeout: 15 min)
- ✅ Solo se ejecuta en cambios relevantes
- ✅ Retención de artifacts: 7 días
- ✅ Resumen del build en GitHub

## 🚀 Cómo Usar

### **Build Manual (Recomendado para desarrollo)**

1. Ve a la pestaña **Actions** en tu repositorio
2. Selecciona **Quick Android Build**
3. Haz clic en **Run workflow**
4. Elige la variante:
   - `debug`: APK de desarrollo
   - `release`: APK de producción

### **Build Automático en Tags**

Para crear un release automático:

```bash
# Crear y subir un tag
git tag v1.0.0
git push origin v1.0.0
```

El workflow se ejecutará automáticamente y:
- Generará APK y AAB de release
- Creará un release en GitHub
- Subirá los archivos como assets

### **Build en Pull Requests**

Cada PR a `main` o `develop` generará automáticamente:
- APK de debug para testing
- Artifacts disponibles para descarga

## 📦 Artifacts Generados

### **Debug Build**
- **Ubicación:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Uso:** Testing y desarrollo
- **Tamaño:** ~50-100MB

### **Release Build**
- **Ubicación:** `android/app/build/outputs/apk/release/app-release.apk`
- **Uso:** Distribución y producción
- **Tamaño:** ~30-80MB

### **Release Bundle (AAB)**
- **Ubicación:** `android/app/build/outputs/bundle/release/app-release.aab`
- **Uso:** Google Play Store
- **Tamaño:** ~25-70MB

## ⚙️ Configuración Requerida

### **1. Variables de Entorno**
Asegúrate de tener configuradas en tu repositorio:

```bash
# En Settings > Secrets and variables > Actions
ANDROID_SDK_ROOT=/usr/local/lib/android/sdk
ANDROID_HOME=/usr/local/lib/android/sdk
```

### **2. Keystore de Release**
Para builds de release, necesitas:

```bash
# Archivos en android/app/
my-release-key.jks          # Tu keystore de release
debug.keystore              # Keystore de debug (ya incluido)
```

### **3. Configuración de Gradle**
Verifica que `android/app/build.gradle` tenga:

```gradle
android {
    compileSdk 33
    buildToolsVersion "33.0.0"
    
    defaultConfig {
        minSdk 21
        targetSdk 33
    }
}
```

## 🔧 Personalización

### **Modificar Versiones**
Edita `.github/workflows/config.yml` para cambiar:
- Versión de Java
- Versión de Node.js
- SDK de Android
- Configuración de Gradle

### **Agregar Nuevos Triggers**
Modifica la sección `on:` en cualquier workflow:

```yaml
on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * 1'  # Lunes a las 2 AM
```

### **Modificar Pasos del Build**
Agrega pasos personalizados en la sección `steps:`:

```yaml
- name: Custom Step
  run: |
    echo "Tu comando personalizado aquí"
    # Más comandos...
```

## 📊 Monitoreo y Debugging

### **Ver Logs**
1. Ve a **Actions** > **Workflow run**
2. Haz clic en el job que falló
3. Revisa los logs paso a paso

### **Problemas Comunes**

#### **Build Falla por Licencias**
```bash
# En el workflow ya está incluido:
yes | sdkmanager --licenses
```

#### **Timeout en Build**
- El workflow rápido tiene timeout de 15 min
- El workflow completo no tiene timeout
- Usa cache para acelerar builds

#### **Error de Memoria**
```yaml
# En el workflow:
env:
  GRADLE_OPTS: -Dorg.gradle.jvmargs=-Xmx2048m
```

## 🎯 Mejores Prácticas

1. **Usa Tags para Releases**: Automatiza la distribución
2. **Mantén develop actualizada**: Para builds automáticos
3. **Revisa Artifacts**: Descarga y testea los APKs generados
4. **Monitoriza Builds**: Revisa logs regularmente
5. **Optimiza Cache**: No modifiques archivos de configuración innecesariamente

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del workflow
2. Verifica la configuración de Gradle
3. Asegúrate de que las dependencias estén actualizadas
4. Consulta la documentación de React Native

---

**Nota:** Estos workflows están optimizados para tu proyecto Sa Talaia Totem. Ajusta las configuraciones según tus necesidades específicas.
