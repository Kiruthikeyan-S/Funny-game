# The Cursed Kingdom — 2D Pixel-Art Action Adventure

> **A brave warrior must recover an ancient magical stone, survive 13 dangerous levels across 5 worlds, defeat the Witch Morgana, and break the dark curse destroying his kingdom.**

---

## 1. Storyline & Main Characters

- **The King (King Aldric)**: Rules the kingdom and dispatches his strongest warrior on a perilous quest after the Witch curses the royal castle.
- **The Warrior (Sir Kael)**: Main playable character equipped with a Royal Greatsword (3-hit combo), Paladin Shield (block & damage reduction), double jump, and the **Ancient Stone Power**.
- **The Witch (Morgana)**: Main antagonist who commands monsters across the realm. Encountered at **Level 6 (The Witch's Castle)** where she reveals her curse power, and faced in the ultimate showdown at **Level 13 (The Witch's Final Battle)**.
- **The Ancient Magical Stone**: A golden relic with a blazing crimson gemstone capable of shattering the Witch's Curse Barrier at Level 13.

---

## 2. The 13-Level Game Plan (5 Worlds)

| World | Environment | Levels | Enemies & Bosses |
| :--- | :--- | :--- | :--- |
| **World 1** | **The Forgotten Forest** | **Level 1**: The Beginning<br>**Level 2**: Forest Monsters<br>**Level 3**: The Hidden Ruins | Slimes, Forest Wolves, Forest Guards |
| **World 2** | **The Dark Caves** | **Level 4**: Underground Passage<br>**Level 5**: The Skeleton Fortress | Cave Bats, Skeletons, **Boss: Bone Captain Vorg** |
| **World 3** | **The Witch's Territory** | **Level 6**: The Witch's Castle *(Major Story Encounter)* | Shadow Knights, **Boss: The Witch Morgana** *(Reveals curse & escapes at 35% HP)* |
| **World 4** | **The Frozen Mountains** | **Level 7**: Frozen Valley<br>**Level 8**: Ice Monster's Cave<br>**Level 9**: The Mountain Guardian | Ice Beasts, Ice Golems, **Boss: Frost Titan Ymir** *(Awakens the Ancient Stone)* |
| **World 5** | **The Cursed Kingdom** | **Level 10**: The Burning Lands<br>**Level 11**: The Shadow Temple<br>**Level 12**: The Final Guardian<br>**Level 13**: The Witch's Final Battle | Shadow Knights, **Boss: Dread Arch-Knight Malak**, **Final Boss: High Witch Morgana** *(Use Ancient Stone Power to shatter her Curse Barrier)* |

---

## 3. All 6 UI Screens + Armory & Cutscenes

1. **Main Menu (`#screen-main-menu`)**: New Game, Continue, Level Selection (13 Levels), Royal Armory & Upgrades, Story Chronicles, Settings.
2. **Story Intro Cutscene (`#screen-story`)**: 4-chapter illustrated pixel-art chronicle of King Aldric, Sir Kael, the Witch, and the Ancient Stone.
3. **Level Selection (`#screen-level-select`)**: Interactive 5-World, 13-Level map with star ratings (`0–3` stars), coin counter, and an **Unlock All 13** button for instant testing.
4. **Gameplay HUD (`#screen-hud`)**:
   - **Top-left**: Warrior portrait, weapon tier badge, HP bar, and Ancient Stone energy gauge.
   - **Top-center**: Dynamic Boss Health Bar & Curse Barrier indicator.
   - **Top-right**: World/Level title, level progress bar, coins counter, and Pause button.
   - **Bottom-left & Bottom-right**: On-screen mobile touch gamepad (Left/Right D-Pad + Sword, Jump, Shield, and Stone Power buttons).
5. **Pause Menu (`#screen-pause`)**: Resume, Restart Level, Settings, Level Selection, Main Menu.
6. **Level Completion (`#screen-level-complete`) & Final Ending (`#screen-ending`)**: Victory summary, stars earned, coins collected, story progression notes, and the Level 13 Kingdom Restored ending & credits screen.

---

## 4. Controls (PC Keyboard & Mobile Touch)

- **Move Left / Right**: `A` / `D` or `Left` / `Right` Arrow keys (or on-screen `←` `→` buttons)
- **Jump / Double Jump**: `W` / `K` / `Up Arrow` (or on-screen `JUMP` button)
- **Sword Attack (3-Hit Combo)**: `J` / `Z` / `Spacebar` (or on-screen `SWORD` button)
- **Shield Block**: `L` / `X` / `Shift` (or on-screen `SHIELD` button)
- **Ancient Stone Power**: `U` / `E` (or on-screen `STONE` button — shatters the Witch's Curse Barrier in Level 13!)
- **Pause**: `ESC` or `P`

---

## 5. Project Structure (Web/Mobile HTML5 + Godot 4 Starter)

```text
├── index.html                          # Playable 2D Pixel-Art Game & All 6 UI Screens
├── css/
│   └── style.css                       # Medieval fantasy pixel-art UI theme & responsive layout
├── js/
│   ├── data.js                         # 5 Worlds, 13 Levels, Story slides, Armory & SaveSystem
│   ├── audio.js                        # Web Audio API retro chiptune sound effects
│   ├── sprites.js                      # Procedural pixel-art sprites (Warrior, King, Witch, Enemies)
│   ├── engine.js                       # 2D platformer physics, combat, checkpoints & boss AI
│   └── ui.js                           # Screen navigation, HUD, Armory & Cutscene controller
└── godot_project/                      # Godot 4 + GDScript Starter Project
    ├── project.godot                   # Godot 4.2 Mobile/PC configuration
    ├── autoload/
    │   ├── GameManager.gd              # Global 5-World / 13-Level manager
    │   └── SaveManager.gd              # JSON save system (user://cursed_kingdom_save.json)
    ├── scripts/
    │   ├── player/Warrior.gd           # CharacterBody2D movement, combo, block & Stone power
    │   ├── enemies/EnemyBase.gd        # Base enemy patrol & combat AI
    │   ├── enemies/WitchBoss.gd        # Level 6 escape & Level 13 Curse Barrier boss logic
    │   └── ui/MainMenu.gd              # Main menu controller
    └── scenes/
        ├── ui/MainMenu.tscn            # Godot 4 Main Menu scene
        └── levels/BaseLevel.tscn       # Godot 4 playable level scene
```

---

## 6. How to Run

### Play Immediately (Web / PC / Mobile Browser)
Open `index.html` directly in any modern browser, or serve locally:
```bash
npx serve .
```

### Open in Godot 4 Engine
1. Open **Godot Engine 4.2+**.
2. Click **Import** and select `godot_project/project.godot`.
3. Press **F5** to run the project.
