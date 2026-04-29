# PRD: Infinite Tic Tac Toe (Gato Infinito)

## 1. Visión
Aplicación móvil cross-platform (iOS/Android) del juego "Gato Infinito", una variante del tic-tac-toe clásico donde cada jugador solo puede tener 3 fichas en el tablero simultáneamente. Al colocar la cuarta ficha, la más antigua desaparece automáticamente. No hay empates; siempre hay un ganador.

## 2. Reglas del Juego (Core Rules)
- Tablero 3x3.
- Dos jugadores: X (cruz) y O (círculo).
- Cada jugador puede tener MÁXIMO 3 fichas en el tablero al mismo tiempo.
- Al colocar la 4ª ficha, la 1ª ficha colocada por ese jugador DESAPARECE automáticamente.
- Gana quien complete 3 en línea (horizontal, vertical o diagonal).
- Como las fichas desaparecen, el juego no puede terminar en empate indefinidamente; alguien debe ganar.
- El primer movimiento de la partida determina quién empieza; luego se alterna turnos.

## 3. Modos de Juego
1. **Local 2 Players (Pass & Play)**: Dos jugadores en el mismo dispositivo.
2. **Online Multiplayer**: Emparejamiento aleatorio o código de sala. Turnos asíncronos con actualización en tiempo real.
3. **Single Player vs AI**: Oponente IA con 3 niveles de dificultad (Fácil, Medio, Difícil).
4. **Zen Mode**: Sin anuncios, sin presión, solo el tablero.

## 4. Stack Técnico
- **Frontend**: Expo (React Native) + TypeScript
- **Navigation**: React Navigation (Native Stack)
- **State Management**: Zustand (ligero, sin boilerplate)
- **Backend/Auth/DB**: Firebase (Spark plan - free tier)
  - Firebase Auth (anónimo + Google + Apple Sign-In)
  - Cloud Firestore (estado de partidas, salas, rankings)
  - Firebase Analytics + Crashlytics
- **Monetización**: Google AdMob
  - Banner inferior durante partida
  - Intersticial cada 3 partidas completadas
  - Opción "Remove Ads" compra in-app (si es posible)
- **Build**: EAS Build (Expo Application Services) para generar IPA/APK sin Mac
- **Animaciones**: React Native Animated API (sin librerías externas pesadas)

## 5. Monetización
- Gratis para descargar.
- Publicidad no intrusiva.
- Compra única para quitar anuncios (pago simbólico).

## 6. Publicación
- App Store (iOS) - requiere Apple Developer Program ($99/año)
- Google Play (Android) - one-time $25

## 7. Diseño Visual (High-level)
- Minimalista, limpio, oscuro/claro según sistema.
- Colores: fondo #0F0F23 (dark) o #F5F5F7 (light). X en #FF6B6B, O en #4ECDC4.
- Tipografía: Inter o System font.
- Animaciones: fade-in/out al colocar/desaparecer fichas. Shake al ganar.
- Sin skeuomorphism. Neumorfismo sutil en botones.

## 8. Alcance MVP
Fases 1-6 de este documento constituyen el MVP. Fases 7-10 son post-MVP.
