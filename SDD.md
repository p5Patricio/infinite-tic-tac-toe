# SDD: Infinite Tic Tac Toe (Gato Infinito) — Software Design Document

> **Versión:** 1.0.0  
> **Basado en:** PRD.md (Fases 1–6 = MVP)  
> **Stack:** Expo (React Native) + TypeScript + Zustand + Firebase + AdMob

---

## 1. Arquitectura General

### 1.1 Patrón de Arquitectura
- **MVVM (Model-View-ViewModel)** para la capa de presentación.
- **Repository Pattern** para abstractar servicios externos (Firebase, AdMob).
- **Game Engine puro** como capa de dominio independiente de UI.

### 1.2 Capas del Sistema

```
┌─────────────────────────────────────────────┐
│  UI Layer (Screens + Components)            │
│  React Native + Animated API                │
├─────────────────────────────────────────────┤
│  State Layer (Zustand Stores)               │
│  AppState, GameState, AuthState             │
├─────────────────────────────────────────────┤
│  Domain Layer (Game Engine + Rules)         │
│  GameEngine.ts — 100% puro, testeable       │
├─────────────────────────────────────────────┤
│  Repository Layer                           │
│  FirebaseRepo, AdMobRepo, AuthRepo          │
├─────────────────────────────────────────────┤
│  External Services                          │
│  Firestore, Firebase Auth, AdMob SDK        │
└─────────────────────────────────────────────┘
```

### 1.3 Principios de Diseño
- **Unidireccionalidad de datos:** UI → Action → Store → Repository → External → Store → UI.
- **Determinismo del motor:** Mismo `GameState` + movimiento = mismo output. Sin side effects.
- **Separación de concerns:** El motor de juego NO conoce React, Firebase, ni AdMob.

---

## 2. Modelo de Datos

> **Archivo fuente de verdad:** `src/types/game.ts`

### 2.1 Tipos Base

```typescript
export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type GameMode = 'local' | 'online' | 'ai' | 'zen';
export type AIDifficulty = 'easy' | 'medium' | 'hard';
```

### 2.2 Interfaces Principales

```typescript
export interface Move {
  player: Player;
  position: number;      // 0–8
  timestamp: number;     // Date.now()
  moveNumber: number;    // ordinal global del movimiento
}

export interface GameState {
  board: CellValue[];            // length 9
  movesX: Move[];                // máximo 3 elementos
  movesO: Move[];                // máximo 3 elementos
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  winningLine: number[] | null;  // ej: [0, 1, 2]
  totalMoves: number;
  gameMode: GameMode;
  isGameOver: boolean;
}

// Alias de Firestore para claridad en interfaces
export type FirebaseTimestamp = { seconds: number; nanoseconds: number } | Date;

export interface OnlineRoom {
  id: string;
  playerXId: string | null;
  playerOId: string | null;
  gameState: GameState;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: FirebaseTimestamp;
  lastMoveAt: FirebaseTimestamp;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  gamesPlayed: number;
  gamesWon: number;
  rank: number;
  createdAt: FirebaseTimestamp;
}
```

### 2.3 Invariantes del Modelo
- `movesX.length <= 3` y `movesO.length <= 3` siempre.
- `board[position] === null` antes de colocar una nueva ficha.
- `totalMoves === movesX.length + movesO.length` siempre.
- `isGameOver === true` implica `winner !== null`.

---

## 3. Lógica del Juego (Game Engine)

> **Archivo fuente de verdad:** `src/services/game/GameEngine.ts`

### 3.1 Diseño del Motor
- **Puro:** Funciones puras, sin dependencias de React Native ni Firebase.
- **Inmutable:** Cada operación retorna un nuevo `GameState`.
- **Determinístico:** Dado un estado y una acción, el resultado es predecible.

### 3.2 Algoritmo de un Turno (applyMove)

```
Entrada: GameState actual, position (0–8)
Salida: Nuevo GameState

1. VALIDAR
   - Si isGameOver → retornar estado sin cambios.
   - Si board[position] !== null → retornar estado sin cambios.

2. CREAR MOVIMIENTO
   move = {
     player: currentPlayer,
     position,
     timestamp: Date.now(),
     moveNumber: totalMoves + 1
   }

3. GESTIONAR FIFO DE 3 FICHAS
   movesArray = currentPlayer === 'X' ? movesX : movesO
   movesArray = [...movesArray, move]
   
   SI movesArray.length > 3 ENTONCES
     oldest = movesArray.shift()        // eliminar primero
     board[oldest.position] = null      // limpiar celda
   FIN SI

4. COLOCAR NUEVA MARCA
   board[position] = currentPlayer

5. VERIFICAR WIN CONDITION
   Para cada línea en WIN_LINES (8 líneas):
     [a, b, c] = línea
     SI board[a] === board[b] === board[c] === currentPlayer ENTONCES
       winner = currentPlayer
       winningLine = [a, b, c]
       isGameOver = true
       DETENER
     FIN SI
   FIN PARA

6. VERIFICAR EMPATE (guarda de seguridad)
   SI !isGameOver Y board no tiene nulls ENTONCES
     winner = 'draw'
     isGameOver = true
   FIN SI

7. CAMBIAR TURNO
   SI !isGameOver ENTONCES
     currentPlayer = currentPlayer === 'X' ? 'O' : 'X'
   FIN SI

8. RETORNAR nuevo GameState
```

### 3.3 Win Lines (8 líneas posibles)
```typescript
const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],  // horizontales
  [0, 3, 6], [1, 4, 7], [2, 5, 8],  // verticales
  [0, 4, 8], [2, 4, 6],              // diagonales
];
```

### 3.4 Estado Inicial
```typescript
export const INITIAL_GAME_STATE: GameState = {
  board: Array(9).fill(null),
  movesX: [],
  movesO: [],
  currentPlayer: 'X',
  winner: null,
  winningLine: null,
  totalMoves: 0,
  gameMode: 'local',
  isGameOver: false,
};
```

### 3.5 Funciones Públicas del Engine
```typescript
export function createInitialState(overrides?: Partial<GameState>): GameState;
export function applyMove(state: GameState, position: number): GameState;
export function checkWinner(board: CellValue[]): { winner: Player | null; line: number[] | null };
export function getValidMoves(state: GameState): number[];
export function isBoardFull(board: CellValue[]): boolean;
```

---

## 4. Flujo de Firebase / Firestore

### 4.1 Autenticación
- **Anónima:** Al abrir la app por primera vez, se ejecuta `signInAnonymously()`.
- **UID generado:** Firebase genera un `uid` único que se usa como identidad del jugador.
- **Vinculación opcional:** El usuario puede vincular Google Sign-In o Apple Sign-In desde Settings.
- **Perfil:** Se crea/lee documento `users/{uid}` en Firestore al autenticar.

### 4.2 Colección `rooms`

```
rooms/{roomId} (documento)
├── id: string
├── playerXId: string | null
├── playerOId: string | null
├── gameState: GameState (mapa anidado)
├── status: 'waiting' | 'playing' | 'finished'
├── createdAt: timestamp
└── lastMoveAt: timestamp
```

### 4.3 Flujo de una Partida Online

```
Jugador A (creador)                    Jugador B (invitado)
       │                                       │
       ▼                                       │
  crearRoom() ──► Firestore: rooms/{id}       │
       │          status: 'waiting'             │
       │                                       │
       ▼                                       ▼
  mostrar código de sala              joinRoom(código)
       │                                       │
       │          onSnapshot(roomId) ◄─────────┤
       │◄──────────────────────────────────────┤
       │          playerOId = uid B            │
       │          status = 'playing'           │
       ▼                                       ▼
  ambos escuchan onSnapshot(roomId)
  cada cambio en gameState se propaga
  a través de Zustand
```

### 4.4 Matchmaking Simple
- Cola `waiting_players`: documento temporal con `uid` y `timestamp`.
- Cloud Function o lógica cliente: cada 5s, si hay 2 jugadores en cola, crea sala y elimina de cola.
- **MVP simplificado:** El matchmaking se hace por código de sala; la cola automática es post-MVP.

### 4.5 Security Rules (FireStore)
```
rules version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && (request.auth.uid == resource.data.playerXId
            || request.auth.uid == resource.data.playerOId)
        && request.resource.data.gameState.currentPlayer != resource.data.gameState.currentPlayer;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4.6 Offline Support
- **MVP:** No requerido.
- Firestore habilita caché local por defecto (`persistentCacheIndexManager`).

---

## 5. AdMob Integration Strategy

> **Archivos:** `src/services/ads/AdMobService.ts`, `src/hooks/useAds.ts`

### 5.1 Banner
- **Posición:** Parte inferior de `GameScreen`.
- **Condición:** `adsRemoved === false && gameMode !== 'zen'`.
- **Unit IDs:** Diferentes para Android e iOS, leídos de `process.env.EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID_*`.

### 5.2 Intersticial
- **Carga:** Precargado al iniciar `GameScreen`.
- **Disparo:** Al terminar una partida (`isGameOver === true`).
- **Frecuencia:** Cada 3 partidas completadas.
- **Contador:** Persistido en `AsyncStorage` bajo la key `@ad_interstitial_counter`.
- **Lógica:**
  ```
  SI isGameOver Y !adsRemoved Y gameMode !== 'zen' ENTONCES
    counter = (await AsyncStorage.getItem('@ad_counter')) || '0'
    counter = parseInt(counter) + 1
    SI counter >= 3 ENTONCES
      mostrarIntersticial()
      counter = 0
    FIN SI
    AsyncStorage.setItem('@ad_counter', counter.toString())
  FIN SI
  ```

### 5.3 Compra "Remove Ads"
- **Almacenamiento local:** `AsyncStorage.setItem('@ads_removed', 'true')`.
- **Sincronización cloud:** Guardar `removeAds: true` en `users/{uid}`.
- **Verificación al inicio:**
  1. Leer `AsyncStorage`.
  2. Si `false`, leer Firestore `users/{uid}.removeAds`.
  3. Si Firestore dice `true`, actualizar `AsyncStorage`.

---

## 6. AI Oponente (Minimax Adaptado)

> **Archivo fuente de verdad:** `src/services/game/AIEngine.ts`

### 6.1 Estrategia por Dificultad

| Nivel | Comportamiento |
|-------|----------------|
| **Fácil** | 60% movimiento aleatorio válido. 40% Minimax con profundidad máxima 2. |
| **Medio** | 30% movimiento aleatorio válido. 70% Minimax completo. |
| **Difícil** | 100% Minimax con profundidad completa. |

### 6.2 Minimax Adaptado a Infinite Rules

```
minimax(state, depth, isMaximizing, aiPlayer):
  SI hay ganador EN gameState ENTONCES
    RETORNAR score = (aiPlayer === winner) ? 10 - depth : depth - 10
  SI empate O depth === 0 ENTONCES
    RETORNAR 0

  moves = getValidMoves(state)
  
  SI isMaximizing ENTONCES
    bestScore = -Infinity
    PARA CADA move EN moves:
      newState = applyMove(state, move)
      score = minimax(newState, depth + 1, false, aiPlayer)
      bestScore = max(bestScore, score)
    RETORNAR bestScore
  SINO
    bestScore = +Infinity
    PARA CADA move EN moves:
      newState = applyMove(state, move)
      score = minimax(newState, depth + 1, true, aiPlayer)
      bestScore = min(bestScore, score)
    RETORNAR bestScore
```

### 6.3 Consideración de Fichas Volátiles
- El motor de juego (`applyMove`) ya maneja el desaparecimiento automático de la 4ª ficha.
- El AI explora el árbol de decisiones usando `applyMove`, por lo que naturalmente considera estados donde sus fichas (y las del oponente) desaparecen.
- **Optimización:** En dificultad difícil, el AI evalúa no solo el estado inmediato sino también el estado proyectado a 2–3 movimientos futuros, teniendo en cuenta qué ficha desaparecerá.

### 6.4 API del AI
```typescript
export function getAIMove(
  state: GameState,
  difficulty: AIDifficulty
): number;  // retorna position (0–8)
```

---

## 7. Componentes UI Principales

### 7.1 Árbol de Componentes

```
App
└── NavigationContainer
    └── StackNavigator
        ├── HomeScreen
        │   ├── Header (logo + perfil)
        │   ├── ModeSelector
        │   │   ├── LocalButton
        │   ├── OnlineButton
        │   ├── AIButton
        │   └── ZenButton
        │   └── Footer (ranking, settings)
        ├── GameScreen
        │   ├── PlayerBar (turno + historial de fichas)
        │   ├── Board (3x3)
        │   │   └── Cell (x9)
        │   │       ├── GhostMarker (cuando es la más antigua)
        │   │       └── Marker (X o O con fade)
        │   ├── BannerAd (condicional)
        │   └── WinOverlay (shake + mensaje)
        ├── LobbyScreen
        │   ├── RoomCodeInput
        │   ├── CreateRoomButton
        │   └── WaitingIndicator
        └── SettingsScreen
            ├── ThemeToggle
            ├── SoundToggle
            ├── HapticToggle
            └── RemoveAdsButton
```

### 7.2 Especificaciones de Componentes Clave

#### `Board`
- **Props:** `board: CellValue[]`, `onCellPress: (index: number) => void`, `winningLine: number[] | null`
- **Layout:** Grid 3x3 con `flexDirection: 'row'` y `flexWrap: 'wrap'`.
- **Dimensiones:** Cada celda = `width: 33.33%`, `aspectRatio: 1`.

#### `Cell`
- **Props:** `value: CellValue`, `index: number`, `isWinning: boolean`, `isGhost: boolean`
- **Render:**
  - `null` → celda vacía con tap target.
  - `'X'` → SVG cruz color `#FF6B6B`.
  - `'O'` → SVG círculo color `#4ECDC4`.
- **Animaciones:**
  - **Fade in:** `Animated.timing(opacity, { toValue: 1, duration: 200 })` al aparecer.
  - **Fade out:** `Animated.timing(opacity, { toValue: 0, duration: 200 })` al desaparecer (ghost → eliminada).
  - **Ghost:** Opacidad 0.3, escala 0.8, indica que esa ficha será la próxima en desaparecer.

#### `GhostMarker`
- **Lógica:** Si `movesX.length === 3` y es turno de X, la posición de `movesX[0]` muestra un ghost marker.
- **Visual:** Misma forma que la ficha real pero con `opacity: 0.3` y `transform: [{ scale: 0.8 }]`.

#### `PlayerBar`
- **Props:** `currentPlayer: Player`, `movesX: Move[]`, `movesO: Move[]`
- **Visual:**
  - Dos filas (X arriba, O abajo) o dos columnas.
  - Muestra las últimas 3 fichas de cada jugador con número de orden (1, 2, 3).
  - Indicador de turno activo (brillo o borde resaltado).

#### `WinOverlay`
- **Trigger:** `isGameOver === true && winner !== null`.
- **Animaciones:**
  - **Shake:** `Animated.sequence` de traslaciones X en las celdas ganadoras.
  - **Overlay:** `Animated.timing(opacity)` para mostrar fondo semitransparente.
  - **Mensaje:** "X Wins!" o "O Wins!" con `Animated.spring` para escala.

#### `ModeSelector`
- **Props:** `selectedMode: GameMode`, `onSelect: (mode: GameMode) => void`
- **Estilos:** Botones neumórficos sutiles (sombra suave, fondo card).

---

## 8. Navegación

> **Archivo fuente de verdad:** `src/navigation/AppNavigator.tsx`

### 8.1 Native Stack Navigator

```typescript
type RootStackParamList = {
  Home: undefined;
  Game: { mode: GameMode; roomId?: string };
  Lobby: { roomId?: string; isHost?: boolean };
  Settings: undefined;
};
```

### 8.2 Flujo de Navegación por Modo

| Modo | Flujo |
|------|-------|
| **Local** | `Home → Game(mode: 'local')` |
| **AI** | `Home → Game(mode: 'ai')` |
| **Zen** | `Home → Game(mode: 'zen')` |
| **Online (crear)** | `Home → Lobby(isHost: true) → Game(mode: 'online', roomId)` |
| **Online (unirse)** | `Home → Lobby(isHost: false) → Game(mode: 'online', roomId)` |

### 8.3 Configuración del Stack
- **Header:** Oculto en `GameScreen` (pantalla inmersiva).
- **Header:** Visible en `HomeScreen`, `LobbyScreen`, `SettingsScreen`.
- **Transiciones:** Slide horizontal por defecto de Native Stack.

---

## 9. Zustand Store Structure

> **Archivo fuente de verdad:** `src/store/useAppStore.ts`

### 9.1 Interface AppState

```typescript
export interface AppState {
  // Auth
  user: UserProfile | null;
  isAuthenticated: boolean;

  // Game
  gameState: GameState;
  history: GameState[];  // para undo, opcional post-MVP

  // Settings
  soundEnabled: boolean;
  hapticEnabled: boolean;
  theme: 'light' | 'dark';
  adsRemoved: boolean;

  // Ads
  interstitialCounter: number;

  // Actions
  makeMove: (position: number) => void;
  resetGame: () => void;
  setGameMode: (mode: GameMode) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  setAdsRemoved: (removed: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  loadSettings: () => Promise<void>;
}
```

### 9.2 Implementación con Zustand

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      gameState: INITIAL_GAME_STATE,
      history: [],
      soundEnabled: true,
      hapticEnabled: true,
      theme: 'dark',
      adsRemoved: false,
      interstitialCounter: 0,

      makeMove: (position: number) => {
        const { gameState } = get();
        if (gameState.isGameOver) return;

        const newState = applyMove(gameState, position);
        set({ gameState: newState });

        // Si es modo AI y ahora le toca a O, ejecutar AI
        if (newState.gameMode === 'ai' && !newState.isGameOver && newState.currentPlayer === 'O') {
          const aiMove = getAIMove(newState, get().aiDifficulty || 'medium');
          const aiState = applyMove(newState, aiMove);
          set({ gameState: aiState });
        }
      },

      resetGame: () => set({
        gameState: createInitialState({ gameMode: get().gameState.gameMode }),
        history: [],
      }),

      setGameMode: (mode: GameMode) => set({
        gameState: createInitialState({ gameMode: mode }),
      }),

      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleHaptic: () => set((state) => ({ hapticEnabled: !state.hapticEnabled })),
      setAdsRemoved: (removed: boolean) => set({ adsRemoved: removed }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      loadSettings: async () => {
        const adsRemoved = await AsyncStorage.getItem('@ads_removed');
        const theme = await AsyncStorage.getItem('@theme');
        const sound = await AsyncStorage.getItem('@sound_enabled');
        const haptic = await AsyncStorage.getItem('@haptic_enabled');
        set({
          adsRemoved: adsRemoved === 'true',
          theme: theme === 'light' ? 'light' : 'dark',
          soundEnabled: sound !== 'false',
          hapticEnabled: haptic !== 'false',
        });
      },
    }),
    {
      name: 'infinite-tic-tac-toe-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        hapticEnabled: state.hapticEnabled,
        adsRemoved: state.adsRemoved,
      }),
    }
  )
);
```

### 9.3 Patrones del Store
- **Persistencia parcial:** Solo settings se persisten en `AsyncStorage`. El estado de juego se resetea al cerrar la app.
- **AI reactivo:** `makeMove` detecta modo AI y ejecuta la jugada de la máquina automáticamente.
- **Separación de concerns:** El store ORQUESTA llamadas al `GameEngine`, pero NO contiene lógica de reglas.

---

## 10. Testing Strategy

### 10.1 Unit Tests — GameEngine
> **Framework:** Jest (incluido con Expo)  
> **Cobertura objetivo:** 100% de reglas de juego  
> **Archivo:** `src/services/game/__tests__/GameEngine.test.ts`

```typescript
describe('GameEngine', () => {
  describe('applyMove', () => {
    it('should place X on an empty board', () => { ... });
    it('should alternate turns between X and O', () => { ... });
    it('should remove oldest mark when player has 3 marks', () => { ... });
    it('should detect horizontal win', () => { ... });
    it('should detect vertical win', () => { ... });
    it('should detect diagonal win', () => { ... });
    it('should set isGameOver on win', () => { ... });
    it('should ignore moves on occupied cells', () => { ... });
    it('should ignore moves when game is over', () => { ... });
    it('should maintain FIFO order for movesX and movesO', () => { ... });
  });

  describe('checkWinner', () => {
    it('should return null when no winner', () => { ... });
    it('should return correct line for each win condition', () => { ... });
  });

  describe('getValidMoves', () => {
    it('should return all empty cells', () => { ... });
    it('should return empty array when board is full', () => { ... });
  });
});
```

### 10.2 Component Tests
> **Framework:** React Native Testing Library (`@testing-library/react-native`)  
> **Archivos:**
- `src/components/game/__tests__/Board.test.tsx`
- `src/components/game/__tests__/Cell.test.tsx`

```typescript
describe('Board', () => {
  it('renders 9 cells', () => { ... });
  it('calls onCellPress with correct index', () => { ... });
  it('disables interaction when isGameOver', () => { ... });
});

describe('Cell', () => {
  it('renders X marker', () => { ... });
  it('renders O marker', () => { ... });
  it('renders ghost marker with reduced opacity', () => { ... });
});
```

### 10.3 AI Tests
> **Archivo:** `src/services/game/__tests__/AIEngine.test.ts`

```typescript
describe('AIEngine', () => {
  it('easy mode sometimes plays random', () => { ... });
  it('hard mode always blocks opponent win', () => { ... });
  it('hard mode finds winning move', () => { ... });
  it('handles infinite rule (4th move removes oldest)', () => { ... });
});
```

### 10.4 No E2E en MVP
- **Razón:** Overhead de configuración (Maestro, Detox) no justificado para MVP.
- **Post-MVP:** Evaluar Maestro o Detox para flujos críticos (login → partida → victoria).

### 10.5 Comandos de Testing
```bash
# Unit tests
npm test

# Unit tests con coverage
npm test -- --coverage

# Type check
npx tsc --noEmit
```

---

## 11. Decisiones de Diseño Clave (ADR)

### ADR-001: Zustand sobre Redux/Context
- **Decisión:** Usar Zustand para state management.
- **Razón:** Menos boilerplate que Redux, no requiere providers como Context, persistencia integrada, y es suficiente para el estado de una app de juego.

### ADR-002: Game Engine puro (funciones, no clases)
- **Decisión:** Implementar el motor como funciones puras en lugar de una clase `GameEngine`.
- **Razón:** Facilita testing unitario (no hay estado interno oculto), permite inmutabilidad sin `this`, y es más simple de tree-shakear.

### ADR-003: AI síncrono en Zustand
- **Decisión:** La jugada del AI se ejecuta síncronamente dentro del action `makeMove` del store.
- **Razón:** Elimina la necesidad de manejar estados de "esperando AI", simplifica el flujo de turnos, y el cálculo de Minimax es lo suficientemente rápido para un tablero 3x3.

### ADR-004: No undo en MVP
- **Decisión:** El campo `history` existe en `AppState` pero no se expone a la UI en MVP.
- **Razón:** Reduce complejidad inicial. El undo se puede activar fácilmente más adelante usando el array `history` ya previsto.

### ADR-005: Matchmaking por código de sala
- **Decisión:** El matchmaking en MVP es por código de sala, no por cola automática.
- **Razón:** Simplifica la infraestructura (no requiere Cloud Functions para emparejamiento). La cola automática es post-MVP.

---

## 12. Checklist de Implementación por Fase

### Fase 2 (Actual): Diseño Técnico
- [x] SDD.md generado y revisado
- [ ] Interfaces TypeScript en `src/types/game.ts`
- [ ] GameEngine puro con tests
- [ ] Zustand store básico

### Fase 3: Motor de Juego + UI Local
- [ ] Implementar `GameEngine.ts` + tests
- [ ] Implementar componentes `Board`, `Cell`, `PlayerBar`
- [ ] Implementar `GameScreen` con modo local
- [ ] Animaciones fade-in/out y ghost marker

### Fase 4: AI Oponente
- [ ] Implementar `AIEngine.ts` (Minimax)
- [ ] Integrar AI con Zustand store
- [ ] Tests de AI

### Fase 5: Firebase + Online
- [ ] Configurar Firebase SDK
- [ ] Implementar auth anónimo
- [ ] Implementar `LobbyScreen` + creación de salas
- [ ] Implementar `onSnapshot` para sincronización
- [ ] Security Rules

### Fase 6: AdMob + Monetización
- [ ] Integrar Banner en `GameScreen`
- [ ] Integrar Intersticial con contador
- [ ] Compra "Remove Ads" (mock o real)
- [ ] Settings screen

### Fase 7+: Post-MVP
- [ ] Matchmaking automático
- [ ] Ranking global
- [ ] Undo/history
- [ ] E2E tests
- [ ] Apple Sign-In

---

*Documento generado para la FASE 2 del proyecto Infinite Tic Tac Toe.  
Cualquier código de implementación debe leer este SDD.md y seguirlo al pie de la letra.*
