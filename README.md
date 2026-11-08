# Pong Roguelike 3D

Pong para dos jugadores con progresión roguelike: entre rondas cada jugador elige una carta de mejora, y cada ronda trae un modificador de reglas distinto. Se juega en local (teclado compartido o un celular en horizontal) u online por código de sala (WebRTC, sin servidor propio).

## Cómo jugar

Abre `index.html` en el navegador (no requiere build ni servidor). Para el modo online ambos jugadores necesitan conexión a internet.

| Acción     | Jugador 1 | Jugador 2      | Táctil                         |
|------------|-----------|----------------|--------------------------------|
| Mover      | `W` / `S` | `↑` / `↓`      | Arrastrar en tu mitad          |
| Habilidad  | `D`       | `←` / `Enter`  | Botón redondo                  |
| Pausa      | `P` / `Esc` |              |                                |
| Silenciar  | `M`       |                |                                |

Reglas: 3 puntos ganan una ronda, 4 rondas ganan la partida. Quien pierde una ronda recibe una carta rara garantizada.

## Estructura del proyecto

```
index.html              Markup y orden de carga de scripts
css/styles.css          Estilos del menú y overlays HTML
js/
  core/
    config.js           Constantes (resolución lógica, reglas, colores)
    utils.js            Matemática pura: clamp, rnd, ease, colisión círculo-rect
    dom.js              Canvas 2D de overlay y helper $()
    state.js            Estado mutable global de la partida
  data/
    cards.js            Cartas de mejora y rarezas
    modifiers.js        Modificadores de ronda
    events.js           Eventos de cámara
  systems/
    audio.js            Efectos de sonido sintetizados (WebAudio)
    input.js            Teclado, táctil y mapeo de controles
    fx.js               Partículas, anillos, textos flotantes
  game/
    player.js           Paletas: stats y movimiento
    abilities.js        Habilidades activas
    ball.js             Física de la bola y colisiones
    camera-events.js    Modificadores de cámara por evento
    match.js            Draft, rondas, goles y máquina de estados
  net/
    peer-room.js        Transporte PeerJS (WebRTC)
    netcode.js          Snapshots host-autoritativos y predicción del invitado
    lobby.js            Crear / unirse / salir de salas
  ui/
    menu.js             Menú HTML, teclado de código, botones táctiles
  render/
    scene3d.js          Escena Three.js (mesa, paletas, bolas, bloom)
    draw-utils.js       Helpers de texto y formas para el canvas 2D
    hud.js              Marcador, habilidades, banners
    screens.js          Pantallas de draft, título y fin de partida
    overlay.js          Compositor del frame (3D + overlay 2D)
  main.js               Escalado, bucle principal y arranque
```

### Arquitectura

- **Bucle** (`main.js`): `netPoll → gatherInput → update → netSend → render → updateUI` a paso variable (dt máx. 33 ms).
- **Simulación en coordenadas 2D** (960×600). El renderer 3D proyecta esas coordenadas sobre la mesa; el HUD se dibuja en un canvas 2D superpuesto.
- **Online host-autoritativo**: el anfitrión simula todo y envía snapshots (~30 Hz). El invitado mueve su paleta localmente, interpola la del rival y reproduce los efectos (`fxRec`) que vienen en el snapshot.
- **Módulos**: scripts clásicos que comparten el ámbito global, cargados en orden de dependencias desde `index.html`. Así el juego funciona abriendo el archivo directamente (`file://`) sin bundler. Al añadir un archivo, respeta el orden: `core → data → state → systems → game → net → ui → render → main`.

## Dependencias (CDN)

- [Three.js r128](https://threejs.org/) + postprocesado (bloom)
- [PeerJS 1.5.4](https://peerjs.com/)
- Google Fonts: Press Start 2P, VT323
