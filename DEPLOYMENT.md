# Infinite Tic Tac Toe — Guía de Despliegue

> FASE 10 — Producción & Lanzamiento

---

## 1. Pre-requisitos y Costos

| Requisito | Costo | Acción Manual |
|-----------|-------|---------------|
| Cuenta Expo (gratis) | $0 | Crear en [expo.dev](https://expo.dev) |
| Google Play Developer | $25 (único) | [play.google.com/console](https://play.google.com/console) |
| Apple Developer Program | $99/año | [developer.apple.com](https://developer.apple.com) |
| Cuenta Firebase | $0 | [console.firebase.google.com](https://console.firebase.google.com) |
| Cuenta AdMob | $0 | [admob.google.com](https://admob.google.com) |

---

## 2. Configuración EAS

### 2.1 Instalar EAS CLI
```bash
npm install -g eas-cli
```

### 2.2 Login en Expo
```bash
eas login
# o en CI:
# export EXPO_TOKEN=your_token_here
```

### 2.3 Inicializar proyecto EAS (si es la primera vez)
```bash
eas init
```

---

## 3. Perfiles de Build (eas.json)

Ya configurados:

- **development** — Development client para hot-reload en dispositivo físico.
- **preview** — APK interno para Android (testing sin Play Store).
- **production** — AAB para Google Play / IPA para App Store (autoIncrement de versión).

---

## 4. Pre-Build Checklist

### 4.1 Variables de entorno
Crear `.env` en la raíz (NO se sube a git):
```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4.2 AdMob — IDs de producción
Editar `app.json` → `extra`:
```json
"admobAndroidAppId": "ca-app-pub-TU_ID~TU_ID",
"admobIosAppId": "ca-app-pub-TU_ID~TU_ID",
"admobAndroidBannerId": "ca-app-pub-TU_ID/TU_ID",
"admobAndroidInterstitialId": "ca-app-pub-TU_ID/TU_ID",
"admobIosBannerId": "ca-app-pub-TU_ID/TU_ID",
"admobIosInterstitialId": "ca-app-pub-TU_ID/TU_ID"
```

> ⚠️ **IMPORTANTE**: Los IDs actuales son de **prueba de Google**. Antes de publicar, reemplazarlos por los IDs reales de tu cuenta de AdMob.

### 4.3 Firebase — Proyecto de producción
Asegurar que las variables de entorno apuntan al proyecto de Firebase de producción (no al de desarrollo).

### 4.4 Iconos y Splash
- `src/assets/icon.png` → 1024×1024 PNG
- `src/assets/splash.png` → 1242×2436 PNG (o similar, formato 9:19.5)
- `src/assets/adaptive-icon.png` → 1024×1024 PNG con fondo transparente

> El archivo `assets/icon.svg` está disponible como fuente vectorial para generar los PNGs.

### 4.5 Validaciones automáticas
```bash
npx expo-doctor      # Debe pasar 17/17
npx tsc --noEmit     # Sin errores de TypeScript
npm test             # 21 tests passing
```

---

## 5. Build Android

### 5.1 Preview (APK interno)
```bash
eas build -p android --profile preview
```
Genera un `.apk` descargable. Instalar directamente en dispositivos Android para testeo final.

### 5.2 Production (AAB para Play Store)
```bash
eas build -p android --profile production
```
Genera un `.aab` (Android App Bundle) listo para subir a Google Play Console.

---

## 6. Build iOS

### 6.1 Requisitos
- Apple Developer Program activo ($99/año).
- Mac con Xcode (para builds locales) o usar EAS Build en la nube.

### 6.2 Preview (TestFlight interno)
```bash
eas build -p ios --profile preview
```
Se distribuye vía TestFlight sin revisión de App Store.

### 6.3 Production (App Store)
```bash
eas build -p ios --profile production
```
Luego usar **EAS Submit** o **Transporter** para subir a App Store Connect.

---

## 7. Publicar en Google Play Store

### 7.1 Crear app en Play Console
1. [Google Play Console](https://play.google.com/console) → Crear aplicación.
2. Elegir idioma predeterminado (español).
3. Título: **Infinite Tic Tac Toe**.

### 7.2 Configurar listing
- **Descripción corta**: Juego de tres en raya infinito. Sin empates, sin límites.
- **Descripción larga**: Explicar modos (local, IA, online, zen), reglas del Gato Infinito, características.
- **Screenshots**: Mínimo 2 por tipo de dispositivo (teléfono, tablet).
- **Feature graphic**: 1024×500 PNG.
- **Icono**: 512×512 PNG.

### 7.3 Política de privacidad
Crear una página web simple con política de privacidad (puede ser GitHub Pages). Es obligatoria para apps con ads y online multiplayer.

### 7.4 Lanzamiento
1. **Lanzamiento interno** → testers internos.
2. **Closed testing** → beta cerrada (recomendado).
3. **Production** → lanzamiento público.

Subir el `.aab` generado por EAS en el track correspondiente.

---

## 8. Publicar en App Store

### 8.1 App Store Connect
1. [App Store Connect](https://appstoreconnect.apple.com) → Apps → Add New App.
2. Nombre: **Infinite Tic Tac Toe**.
3. SKU: `com.tuusuario.infinitetictactoe`.
4. Bundle ID: seleccionar el registrado.

### 8.2 Configurar listing
- **Subtítulo**: Gato infinito multijugador.
- **Descripción**: Similar a Play Store.
- **Keywords**: tic tac toe, gato, tres en raya, juego multijugador, infinite.
- **URL de soporte**: tu sitio web.
- **URL de política de privacidad**: obligatoria.

### 8.3 Screenshots requeridos
- 6.7" iPhone (1290×2796)
- 5.5" iPhone (1242×2208)
- iPad (2048×2732) — si soportas tablet

### 8.4 Subir build
Usar **EAS Submit**:
```bash
eas submit -p ios --id BUILD_ID
```
O subir manualmente con **Transporter** en Mac.

### 8.5 Revisión de App Store
- Tiempo típico: 1–2 días hábiles.
- Asegurar que la app cumple las [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines).
- Explicar claramente el modo online y las ads en las notas de revisión.

---

## 9. Post-Launch Monitoring

### 9.1 Firebase Crashlytics
Para activar Crashlytics en producción:
```bash
npx expo install @react-native-firebase/app @react-native-firebase/crashlytics
```
Agregar a `app.json`:
```json
"plugins": [
  ["@react-native-firebase/app", {}],
  ["@react-native-firebase/crashlytics", {}]
]
```

### 9.2 Firebase Analytics
```bash
npx expo install @react-native-firebase/analytics
```
En `src/services/analytics/AnalyticsManager.ts`, reemplazar los métodos mock por:
```ts
import analytics from '@react-native-firebase/analytics';

logEvent: (event, params) => {
  analytics().logEvent(event, params);
}
```

### 9.3 Eventos recomendados
| Evento | Cuándo disparar |
|--------|-----------------|
| `game_started` | Al iniciar una partida (con parámetro `mode`). |
| `game_won` | Al terminar una partida ganada (con `winner`, `moves`). |
| `online_match_made` | Al emparejar en modo online (con `room_id`). |
| `ad_impression` | Al mostrar un banner o interstitial (con `ad_type`). |
| `settings_changed` | Al cambiar sonido, haptics o tema. |

### 9.4 Métricas clave a monitorear
- **Retención D1/D7/D30**: % de usuarios que vuelven.
- **Sesiones por usuario**: cuántas partidas juegan por día.
- **Tiempo de sesión**: duración promedio.
- **Crash-free users**: objetivo > 99%.
- **Ad impressions / fill rate**: ingresos por usuario.
- **Online match success rate**: % de partidas online completadas.

---

## 10. Checklist Final Pre-Lanzamiento

- [ ] `expo-doctor` pasa 17/17 checks.
- [ ] TypeScript limpio (`tsc --noEmit`).
- [ ] Tests pasan (`npm test`).
- [ ] IDs de AdMob son de producción.
- [ ] Variables de Firebase apuntan a producción.
- [ ] `.env` NO está en git (`git check-ignore .env`).
- [ ] Iconos y splash están en alta resolución.
- [ ] Política de privacidad publicada en web.
- [ ] Screenshots tomados en dispositivos reales.
- [ ] Build preview testeado en Android físico.
- [ ] TestFlight interno testeado en iOS físico (si aplica).
- [ ] Analytics events implementados y verificados.
- [ ] Crashlytics configurado para builds de producción.

---

## 11. Notas Importantes

> **Apple Developer**: Si aún no tienes cuenta, el build iOS NO podrá ejecutarse. Documenta el paso pero no bloquees el lanzamiento en Android.
>
> **AdMob**: Los primeros días el fill rate puede ser bajo. Considera usar mediation con Meta Audience Network o AppLovin si los ingresos son críticos.
>
> **Firebase**: El plan Spark (gratis) cubre el tráfico inicial. Monitorea el uso de Firestore reads/writes para evitar sorpresas.
>
> **Reviews**: Responde rápido a reviews negativas en Play Store/App Store. Un bug crítico corregido en 24h genera lealtad.
