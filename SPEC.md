# Color Catch — 糖果跳跳乐 · Specification

## 1. Project Overview

**Type:** HTML5 Canvas 2D platformer game
**Core Functionality:** A vertical-scrolling platformer where the player controls a cute candy creature that must jump onto platforms matching their current color. Matching = score, mismatch = game over.
**Target Users:** Casual mobile & desktop players; fans of Candy Crush / "开心消消乐" aesthetics.

---

## 2. Visual & Rendering Specification

### Scene Setup
- **Canvas:** 400×640 (scales to viewport, max 400w / 640h)
- **Camera:** Vertical follow, smooth lerp (0.1 factor). Player kept at 60% from top.
- **Background:** 3-layer parallax (distant clouds, mid hills, near grass) over a sky gradient.

### Color Palette — 6 candy colors
| Key    | Hex       |
|--------|-----------|
| red    | #FF6B6B  |
| yellow | #FFD93D  |
| blue   | #4ECDC4  |
| green  | #95E66A  |
| purple | #C77DFF  |
| orange | #FF9F43  |

### Player Character
- Radial gradient sphere (candy/gem style)
- Large eyes + highlight + blush cheeks + small mouth
- Idle float animation (sine wave ±2px)
- Blink every 3–5 seconds (horizontal line)
- Jump: stretch vertically (scaleY 1.3), land: squash (scaleY 0.7)

### Platform Types
| Type       | Visual                        | Behavior                        |
|------------|-------------------------------|---------------------------------|
| `normal`   | Solid candy gradient          | Static                          |
| `crumbling`| Translucent + crack lines     | Collapses 0.6s after landing   |
| `moving`   | Normal gradient               | Oscillates left/right          |
| `bonus`    | Gold gradient + star mark     | Awards 3× score                |

### Particle Effects
- **jump:** burst of 10, colored circles, outward velocity + gravity
- **score:** 12 rising stars on match
- **eliminate:** 15 large circles on mismatch or big combo (≥3)
- **trail:** 1 particle per frame while moving fast

### Post-Processing
- Screen shake on combos (≥5: intensity 4) and mismatch (intensity 6)
- Score popup: gold text with outBack ease scale

---

## 3. Simulation / Game Logic

### Physics
- Gravity: 0.38 px/frame²
- Jump velocity: -11 px/frame
- Horizontal friction: ×0.88/frame
- Platform collision: top-only, corrected for frame-skip (prevents clipping)

### Scoring
- Normal platform match: 10 pts × combo multiplier
- Bonus platform match: 30 pts × combo multiplier
- Floating ball: 15 pts (orange = 50 pts)
- Combo window: 2 seconds, resets to 0

### Combo System
- Counter increments on each successful match
- 2+ combo triggers animated "Nx COMBO!" overlay text
- 5+ combo triggers screen shake + big particle burst

### Level Progression
- 10 difficulty levels; auto-increments every 15 seconds
- Each level: tighter platforms, more crumbling/moving types, more balls
- No discrete levels in UI; difficulty ramps continuously

---

## 4. Interaction Specification

### Keyboard
| Key         | Action         |
|-------------|----------------|
| ← / A       | Move left      |
| → / D       | Move right     |
| Space       | Jump           |

### Touch / Mouse
- Drag horizontally to move player
- Tap/click canvas to jump (when on ground)

### Audio (Web Audio API, synthesized — no external files)
| Event           | Sound                                      |
|-----------------|--------------------------------------------|
| Jump            | Rising sine sweep                         |
| Land            | Soft thud + noise pop                      |
| Score           | Ascending triple ding (C5-E5-G5)          |
| Combo (2+)      | Extended ascending ding sequence           |
| Bonus collect   | Magical sparkle (high harmonics)          |
| Game over       | Descending sad tones + noise              |

---

## 5. Project Structure (Vite)

```
colorcatch/
├── index.html
├── package.json
├── vite.config.js
├── SPEC.md
├── README.md
├── src/
│   ├── main.js              # Entry point
│   ├── style.css            # UI overlay styles
│   ├── game/
│   │   ├── Game.js          # Main game orchestrator
│   │   ├── Player.js        # Player entity + colors
│   │   ├── Platform.js      # Platform + ColorBall
│   │   ├── Particle.js      # Particle system + ScorePopup
│   │   └── levels.js         # Level configs
│   ├── render/
│   │   ├── Background.js     # Parallax background
│   │   ├── Effect.js         # Screen shake
│   │   └── HUD.js            # Score / combo display
│   └── utils/
│       ├── easing.js         # Spring curves
│       ├── audio.js          # Web Audio synth
│       └── utils.js          # Color helpers, roundRect
├── public/
│   └── screenshots/
└── dist/                    # Build output
```

---

## 6. Acceptance Criteria

- [x] Game loads in browser with `npm run dev`
- [x] Player moves left/right with keyboard and touch
- [x] Player jumps on space/click/tap
- [x] Color matching awards points; mismatch ends game
- [x] Combo system works and displays overlay text
- [x] Screen shake triggers on big combos
- [x] All 4 platform types behave correctly
- [x] Background parallax scrolls during play
- [x] Sound plays on jump, score, combo, game over
- [x] HUD displays score, combo, level, player color
- [x] Game over screen shows final score and restart button
- [x] Touch controls work on mobile
- [x] Project builds with `npm run build`
