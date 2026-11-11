// ============================================================================
// THE CURSED KINGDOM — 2D ACTION-ADVENTURE PLATFORMER ENGINE
// ============================================================================

const GameEngine = {
  canvas: null,
  ctx: null,
  state: "MENU", // MENU | PLAYING | PAUSED | COMPLETE
  currentLevelData: null,
  worldTheme: null,
  time: 0,
  cameraX: 0,

  keys: {
    left: false,
    right: false,
    jump: false,
    attack: false,
    block: false,
    stone: false
  },

  player: null,
  platforms: [],
  enemies: [],
  projectiles: [],
  coins: [],
  checkpoints: [],
  particles: [],
  stoneWaves: [],
  goalPortal: null,
  activeBoss: null,

  levelStats: {
    coinsCollected: 0,
    enemiesDefeated: 0,
    checkpointX: 120,
    checkpointY: 360
  },

  init() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.bindInputs();
    requestAnimationFrame((ts) => this.loop(ts));
  },

  bindInputs() {
    window.addEventListener("keydown", (e) => {
      const code = e.code;
      if (code === "ArrowLeft" || code === "KeyA") this.keys.left = true;
      if (code === "ArrowRight" || code === "KeyD") this.keys.right = true;
      if (code === "ArrowUp" || code === "KeyW" || code === "KeyK") {
        if (!this.keys.jump) this.triggerJump();
        this.keys.jump = true;
      }
      if (code === "KeyJ" || code === "KeyZ" || code === "Space") {
        this.triggerAttack();
        this.keys.attack = true;
      }
      if (code === "KeyL" || code === "KeyX" || code === "ShiftLeft" || code === "ShiftRight") {
        this.keys.block = true;
      }
      if (code === "KeyU" || code === "KeyE") {
        this.triggerStonePower();
      }
      if (code === "Escape" || code === "KeyP") {
        if (this.state === "PLAYING") UIController.pauseGame();
        else if (this.state === "PAUSED") UIController.resumeGame();
      }
    });

    window.addEventListener("keyup", (e) => {
      const code = e.code;
      if (code === "ArrowLeft" || code === "KeyA") this.keys.left = false;
      if (code === "ArrowRight" || code === "KeyD") this.keys.right = false;
      if (code === "ArrowUp" || code === "KeyW" || code === "KeyK") this.keys.jump = false;
      if (code === "KeyJ" || code === "KeyZ" || code === "Space") this.keys.attack = false;
      if (code === "KeyL" || code === "KeyX" || code === "ShiftLeft" || code === "ShiftRight") {
        this.keys.block = false;
      }
    });

    // Touch / Mouse Hold Helper
    const bindHold = (id, keyName, onPress) => {
      const el = document.getElementById(id);
      if (!el) return;
      const start = (ev) => {
        ev.preventDefault();
        el.classList.add("pressed");
        if (keyName) this.keys[keyName] = true;
        if (onPress) onPress();
      };
      const end = (ev) => {
        ev.preventDefault();
        el.classList.remove("pressed");
        if (keyName) this.keys[keyName] = false;
      };
      el.addEventListener("pointerdown", start);
      el.addEventListener("pointerup", end);
      el.addEventListener("pointerleave", end);
      el.addEventListener("pointercancel", end);
    };

    bindHold("touch-left", "left");
    bindHold("touch-right", "right");
    bindHold("touch-jump", "jump", () => this.triggerJump());
    bindHold("touch-attack", "attack", () => this.triggerAttack());
    bindHold("touch-block", "block");
    bindHold("touch-stone", null, () => this.triggerStonePower());
  },

  startLevel(levelNumber) {
    const lvl = LEVELS_DATA.find((l) => l.level === levelNumber) || LEVELS_DATA[0];
    this.currentLevelData = lvl;
    this.worldTheme = WORLDS_DATA.find((w) => w.id === lvl.world) || WORLDS_DATA[0];

    const upg = SaveSystem.data.upgrades;
    const maxHp = 100 + (upg.armor - 1) * 25;

    this.player = {
      x: 110,
      y: 360,
      w: 36,
      h: 48,
      vx: 0,
      vy: 0,
      speed: 4.3 + (upg.boots - 1) * 0.35,
      jumpForce: -11.8 - (upg.boots - 1) * 0.4,
      facing: 1,
      onGround: false,
      jumpsLeft: 2,
      hp: maxHp,
      maxHp: maxHp,
      stoneEnergy: 100,
      attackDamage: 24 + (upg.sword - 1) * 7,
      attackTimer: 0,
      attackCooldown: 0,
      comboStep: 1,
      comboWindow: 0,
      blocking: false,
      invulnTimer: 0
    };

    this.levelStats = {
      coinsCollected: 0,
      enemiesDefeated: 0,
      checkpointX: 110,
      checkpointY: 360
    };

    this.cameraX = 0;
    this.platforms = [];
    this.enemies = [];
    this.projectiles = [];
    this.coins = [];
    this.checkpoints = [];
    this.particles = [];
    this.stoneWaves = [];
    this.activeBoss = null;

    this.buildLevelGeometry(lvl);
    this.state = "PLAYING";

    UIController.showHUD(lvl, this.worldTheme);
    if (lvl.introDialogue) {
      UIController.showDialogue(lvl.introSpeaker, lvl.introDialogue);
    }
  },

  buildLevelGeometry(lvl) {
    const groundY = 460;
    // Main ground segments with occasional hazard gaps (with bridges/platforms above)
    let cursor = 0;
    while (cursor < lvl.length + 500) {
      const segW = 480 + ((cursor * 17) % 260);
      this.platforms.push({ x: cursor, y: groundY, w: segW, h: 90, type: "ground" });
      cursor += segW + (cursor > 400 && cursor < lvl.length - 500 ? 95 : 0);
    }

    // Elevated platforms, coins & potions
    const stepCount = Math.floor(lvl.length / 260);
    for (let i = 1; i < stepCount; i++) {
      const px = i * 260 + ((i * 53) % 70);
      const py = i % 2 === 0 ? 350 : 275;
      const pw = 130 + ((i * 29) % 60);
      this.platforms.push({ x: px, y: py, w: pw, h: 18, type: "ledge" });

      // Coins arc above platform
      for (let c = 0; c < 3; c++) {
        this.coins.push({
          x: px + 24 + c * 34,
          y: py - 32,
          r: 9,
          collected: false,
          type: c === 1 && i % 4 === 0 ? "potion" : "coin"
        });
      }
    }

    // Mid-level Checkpoints
    const cpX = Math.floor(lvl.length * 0.5);
    this.checkpoints.push({ x: cpX, y: groundY - 56, w: 28, h: 56, activated: false });

    // Spawn Enemies across level
    const spacing = Math.floor((lvl.length - 650) / Math.max(1, lvl.enemyCount));
    for (let i = 0; i < lvl.enemyCount; i++) {
      const etype = lvl.enemyTypes[i % lvl.enemyTypes.length];
      const ex = 420 + i * spacing;
      const isFlying = etype === "bat";
      const ey = isFlying ? 310 : groundY - 44;
      const baseHp = 42 + lvl.level * 10;

      this.enemies.push({
        type: etype,
        x: ex,
        y: ey,
        startX: ex,
        w: 36,
        h: isFlying ? 28 : 44,
        vx: -1.4 - (lvl.world * 0.18),
        hp: baseHp,
        maxHp: baseHp,
        damage: 10 + lvl.world * 3,
        hurtTimer: 0,
        attackCooldown: 0,
        isBoss: false
      });
    }

    // Spawn Boss at the end of Boss Levels (5, 6, 9, 12, 13)
    if (lvl.boss) {
      const b = lvl.boss;
      const bossObj = {
        type: b.type,
        name: b.name,
        x: lvl.length - 260,
        y: groundY - 68,
        startX: lvl.length - 300,
        w: 54,
        h: 68,
        vx: -b.speed,
        hp: b.hp,
        maxHp: b.hp,
        damage: b.damage,
        hurtTimer: 0,
        attackCooldown: 60,
        isBoss: true,
        shieldActive: Boolean(b.needsStone),
        escapeThreshold: b.escapeThreshold || 0
      };
      this.enemies.push(bossObj);
      this.activeBoss = bossObj;
    }

    // End-of-Level Portal / Ancient Altar
    this.goalPortal = {
      x: lvl.length - 90,
      y: groundY - 76,
      w: 52,
      h: 76
    };
  },

  triggerJump() {
    if (this.state !== "PLAYING" || !this.player) return;
    if (this.player.jumpsLeft > 0) {
      this.player.vy = this.player.jumpForce;
      this.player.onGround = false;
      this.player.jumpsLeft--;
      SoundFX.jump();
      this.spawnParticles(this.player.x + 18, this.player.y + 46, "#caf0f8", 6);
    }
  },

  triggerAttack() {
    if (this.state !== "PLAYING" || !this.player) return;
    const p = this.player;
    if (p.attackCooldown > 0) return;

    if (p.comboWindow > 0) {
      p.comboStep = (p.comboStep % 3) + 1;
    } else {
      p.comboStep = 1;
    }

    p.attackTimer = 14;
    p.attackCooldown = 16;
    p.comboWindow = 38;
    SoundFX.sword(p.comboStep);

    // Hitbox check in front of Warrior
    const reach = 58;
    const hx = p.facing > 0 ? p.x + p.w - 4 : p.x - reach + 4;
    const hy = p.y - 8;
    const hw = reach;
    const hh = p.h + 14;

    const dmgMult = p.comboStep === 3 ? 1.5 : p.comboStep === 2 ? 1.2 : 1.0;
    const totalDmg = Math.round(p.attackDamage * dmgMult);

    this.enemies.forEach((e) => {
      if (this.rectsOverlap(hx, hy, hw, hh, e.x, e.y, e.w, e.h)) {
        if (e.shieldActive) {
          // Witch's Curse Barrier blocks normal sword hits in Level 13!
          SoundFX.block();
          this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, "#f72585", 10);
          UIController.showToast("CURSE BARRIER! PRESS [U] / STONE POWER TO SHATTER!");
          return;
        }
        e.hp -= totalDmg;
        e.hurtTimer = 8;
        e.x += p.facing * (e.isBoss ? 8 : 22);
        p.stoneEnergy = Math.min(100, p.stoneEnergy + 10);
        SoundFX.hitEnemy();
        this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, "#ffd152", 10);
      }
    });
  },

  triggerStonePower() {
    if (this.state !== "PLAYING" || !this.player) return;
    const p = this.player;
    if (p.stoneEnergy < 100) {
      UIController.showToast("ANCIENT STONE CHARGING (" + Math.floor(p.stoneEnergy) + "%)");
      return;
    }

    p.stoneEnergy = 0;
    SoundFX.stonePower();

    const stoneLevel = SaveSystem.data.upgrades.stone || 1;
    const stoneDamage = 75 + stoneLevel * 22;

    this.stoneWaves.push({
      x: p.x + p.w / 2,
      y: p.y + p.h / 2,
      r: 20,
      maxR: 260,
      alpha: 1
    });

    this.spawnParticles(p.x + p.w / 2, p.y + p.h / 2, "#ff2a55", 28);

    // Damage all nearby enemies & shatter Witch's Curse Barrier!
    this.enemies.forEach((e) => {
      const dist = Math.hypot((e.x + e.w / 2) - (p.x + p.w / 2), (e.y + e.h / 2) - (p.y + p.h / 2));
      if (dist <= 270) {
        if (e.shieldActive) {
          e.shieldActive = false;
          UIController.showToast("ANCIENT STONE SHATTERED THE WITCH'S CURSE BARRIER!");
          this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, "#38e4ae", 30);
        }
        e.hp -= stoneDamage;
        e.hurtTimer = 14;
      }
    });
  },

  update() {
    if (this.state !== "PLAYING" || !this.player) return;
    const p = this.player;
    const stoneUpgrade = SaveSystem.data.upgrades.stone || 1;

    // Recharge Ancient Stone slowly over time
    p.stoneEnergy = Math.min(100, p.stoneEnergy + 0.12 + stoneUpgrade * 0.04);

    p.blocking = this.keys.block;
    const moveFactor = p.blocking ? 0.45 : 1;

    if (this.keys.left) {
      p.vx = -p.speed * moveFactor;
      p.facing = -1;
    } else if (this.keys.right) {
      p.vx = p.speed * moveFactor;
      p.facing = 1;
    } else {
      p.vx *= 0.72;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    // Timers
    if (p.attackTimer > 0) p.attackTimer--;
    if (p.attackCooldown > 0) p.attackCooldown--;
    if (p.comboWindow > 0) p.comboWindow--;
    if (p.invulnTimer > 0) p.invulnTimer--;

    // Gravity & movement
    p.x += p.vx;
    p.x = Math.max(20, Math.min(this.currentLevelData.length - 40, p.x));

    p.vy += 0.56;
    p.y += p.vy;
    p.onGround = false;

    // Platform collisions
    for (const plat of this.platforms) {
      if (
        p.x + p.w > plat.x &&
        p.x < plat.x + plat.w &&
        p.y + p.h >= plat.y &&
        p.y + p.h - p.vy <= plat.y + 14 &&
        p.vy >= 0
      ) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.jumpsLeft = 2;
      }
    }

    // Fall into pit check
    if (p.y > 580) {
      this.damagePlayer(25);
      p.x = this.levelStats.checkpointX;
      p.y = this.levelStats.checkpointY - 20;
      p.vy = 0;
    }

    // Camera follow
    const targetCam = p.x - this.canvas.width * 0.35;
    const maxCam = Math.max(0, this.currentLevelData.length - this.canvas.width);
    this.cameraX += (Math.max(0, Math.min(maxCam, targetCam)) - this.cameraX) * 0.12;

    // Checkpoints
    this.checkpoints.forEach((cp) => {
      if (!cp.activated && this.rectsOverlap(p.x, p.y, p.w, p.h, cp.x, cp.y, cp.w, cp.h)) {
        cp.activated = true;
        this.levelStats.checkpointX = cp.x;
        this.levelStats.checkpointY = cp.y;
        p.hp = Math.min(p.maxHp, p.hp + 30);
        SoundFX.checkpoint();
        UIController.showToast("CHECKPOINT SAVED! +30 HP");
        this.spawnParticles(cp.x + 14, cp.y + 20, "#38e4ae", 18);
      }
    });

    // Coins & Potions
    this.coins.forEach((c) => {
      if (!c.collected && this.rectsOverlap(p.x, p.y, p.w, p.h, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)) {
        c.collected = true;
        if (c.type === "potion") {
          p.hp = Math.min(p.maxHp, p.hp + 25);
          UIController.showToast("HEALTH POTION +25 HP");
          this.spawnParticles(c.x, c.y, "#ff4d6d", 10);
        } else {
          this.levelStats.coinsCollected += 5;
          this.spawnParticles(c.x, c.y, "#ffd152", 8);
        }
        SoundFX.coin();
      }
    });

    // Update Enemies & Boss
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.hurtTimer > 0) e.hurtTimer--;

      // Level 6 Witch Story Encounter check (escapes at 35% HP)
      if (e.isBoss && e.escapeThreshold > 0 && e.hp <= e.maxHp * e.escapeThreshold) {
        this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, "#f72585", 36);
        this.enemies.splice(i, 1);
        this.activeBoss = null;
        UIController.showDialogue(
          "THE WITCH MORGANA",
          "Enough! Taste my Dark Curse! Without the awakened Stone from the Frozen Mountains, you can never defeat me!"
        );
        continue;
      }

      if (e.hp <= 0) {
        this.levelStats.enemiesDefeated++;
        this.levelStats.coinsCollected += e.isBoss ? 50 : 8;
        this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, "#ff2a55", e.isBoss ? 35 : 14);
        if (e.isBoss) this.activeBoss = null;
        this.enemies.splice(i, 1);
        continue;
      }

      // Enemy Patrol / Chase AI
      const distToPlayer = (p.x + p.w / 2) - (e.x + e.w / 2);
      if (Math.abs(distToPlayer) < 320) {
        const dir = distToPlayer > 0 ? 1 : -1;
        e.x += dir * Math.abs(e.vx);
      } else {
        e.x += e.vx;
        if (Math.abs(e.x - e.startX) > 140) e.vx *= -1;
      }

      // Boss Ranged Curse Orbs
      if (e.isBoss) {
        e.attackCooldown--;
        if (e.attackCooldown <= 0 && Math.abs(distToPlayer) < 480) {
          e.attackCooldown = e.type.includes("witch") ? 75 : 95;
          const dir = distToPlayer >= 0 ? 1 : -1;
          this.projectiles.push({
            x: e.x + e.w / 2,
            y: e.y + 24,
            vx: dir * 5.2,
            r: 9,
            damage: e.damage,
            color: e.type.includes("witch") ? "#f72585" : "#48cae4"
          });
        }
      }

      // Contact Damage with Warrior
      if (this.rectsOverlap(p.x, p.y, p.w, p.h, e.x, e.y, e.w, e.h)) {
        this.damagePlayer(e.damage);
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx;
      if (this.rectsOverlap(p.x, p.y, p.w, p.h, proj.x - proj.r, proj.y - proj.r, proj.r * 2, proj.r * 2)) {
        this.damagePlayer(proj.damage);
        this.projectiles.splice(i, 1);
        continue;
      }
      if (Math.abs(proj.x - p.x) > 800) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update Stone Shockwaves
    for (let i = this.stoneWaves.length - 1; i >= 0; i--) {
      const wv = this.stoneWaves[i];
      wv.r += 14;
      wv.alpha -= 0.045;
      if (wv.alpha <= 0) this.stoneWaves.splice(i, 1);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Check Goal Portal (if Boss is defeated or escaped)
    if (
      this.goalPortal &&
      this.rectsOverlap(p.x, p.y, p.w, p.h, this.goalPortal.x, this.goalPortal.y, this.goalPortal.w, this.goalPortal.h)
    ) {
      if (this.activeBoss) {
        UIController.showToast("DEFEAT THE BOSS BEFORE ENTERING THE PORTAL!");
      } else {
        this.completeLevel(true);
      }
    }

    UIController.updateHUD(this.player, this.levelStats, this.currentLevelData, this.activeBoss);
  },

  damagePlayer(rawAmount) {
    const p = this.player;
    if (p.invulnTimer > 0) return;

    let dmg = rawAmount;
    if (p.blocking) {
      dmg = Math.max(2, Math.round(rawAmount * 0.2));
      SoundFX.block();
      this.spawnParticles(p.x + p.w / 2, p.y + 20, "#38e4ae", 8);
    } else {
      SoundFX.hurtPlayer();
      this.spawnParticles(p.x + p.w / 2, p.y + 20, "#e63946", 12);
    }

    p.hp = Math.max(0, p.hp - dmg);
    p.invulnTimer = 38;

    if (p.hp <= 0) {
      this.completeLevel(false);
    }
  },

  completeLevel(victory) {
    this.state = "COMPLETE";
    const lvl = this.currentLevelData;

    if (victory) {
      SoundFX.victory();
      const hpRatio = this.player.hp / this.player.maxHp;
      const stars = hpRatio >= 0.7 ? 3 : hpRatio >= 0.35 ? 2 : 1;
      const bonusCoins = 20 + lvl.level * 5;
      const totalLevelCoins = this.levelStats.coinsCollected + bonusCoins;

      SaveSystem.recordLevelWin(lvl.level, stars, totalLevelCoins);

      if (lvl.level === 13) {
        UIController.showEndingScreen();
      } else {
        UIController.showLevelComplete(true, lvl, stars, totalLevelCoins, this.levelStats.enemiesDefeated, hpRatio);
      }
    } else {
      SoundFX.defeat();
      UIController.showLevelComplete(false, lvl, 0, this.levelStats.coinsCollected, this.levelStats.enemiesDefeated, 0);
    }
  },

  spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.7) * 6,
        color,
        size: 3 + Math.random() * 4,
        life: 16 + Math.random() * 14
      });
    }
  },

  rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  },

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const theme = this.worldTheme || WORLDS_DATA[0];

    // Sky Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, theme.skyTop);
    grad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Parallax Distant Mountains / Castle Silhouettes
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    for (let i = 0; i < 8; i++) {
      const mx = ((i * 220 - this.cameraX * 0.2) % (w + 220)) - 110;
      ctx.beginPath();
      ctx.moveTo(mx, h - 80);
      ctx.lineTo(mx + 110, h - 240 - (i % 3) * 35);
      ctx.lineTo(mx + 220, h - 80);
      ctx.fill();
    }

    if (this.state === "MENU") {
      // Animated Main Menu Backdrop
      ctx.fillStyle = theme.groundColor;
      ctx.fillRect(0, 460, w, 80);
      ctx.fillStyle = theme.groundTop;
      ctx.fillRect(0, 460, w, 8);
      PixelSprites.drawWarrior(
        ctx,
        { x: 180, y: 412, w: 36, h: 48, facing: 1, vx: 1, onGround: true, stoneEnergy: 100, attackTimer: 0 },
        this.time
      );
      PixelSprites.drawAncientStone(ctx, 480, 390, this.time, 1.4);
      PixelSprites.drawEnemy(
        ctx,
        { x: 740, y: 396, w: 48, h: 64, vx: -1, type: "witch_final", shieldActive: true, isBoss: true },
        this.time
      );
      return;
    }

    ctx.save();
    ctx.translate(-Math.round(this.cameraX), 0);

    // Draw Platforms
    for (const plat of this.platforms) {
      ctx.fillStyle = theme.groundColor;
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      ctx.fillStyle = theme.groundTop;
      ctx.fillRect(plat.x, plat.y, plat.w, 6);
    }

    // Draw Checkpoints
    for (const cp of this.checkpoints) {
      ctx.fillStyle = "#495057";
      ctx.fillRect(cp.x + 10, cp.y, 8, cp.h);
      ctx.fillStyle = cp.activated ? "#38e4ae" : "#ffd152";
      ctx.fillRect(cp.x + 18, cp.y + 4, 22, 14);
    }

    // Draw Goal Portal / Ancient Shrine
    if (this.goalPortal) {
      const gp = this.goalPortal;
      ctx.fillStyle = "#ffd152";
      ctx.fillRect(gp.x - 4, gp.y, gp.w + 8, gp.h);
      ctx.fillStyle = this.activeBoss ? "#4a154b" : "#38e4ae";
      ctx.fillRect(gp.x + 4, gp.y + 8, gp.w - 8, gp.h - 8);
      PixelSprites.drawAncientStone(ctx, gp.x + gp.w / 2, gp.y - 18, this.time, 0.9);
    }

    // Draw Coins & Health Potions
    for (const c of this.coins) {
      if (c.collected) continue;
      const bobY = Math.sin(this.time * 0.008 + c.x) * 3;
      if (c.type === "potion") {
        ctx.fillStyle = "#ff2a55";
        ctx.fillRect(c.x - 7, c.y - 7 + bobY, 14, 14);
        ctx.fillStyle = "#fff";
        ctx.fillRect(c.x - 3, c.y - 11 + bobY, 6, 4);
      } else {
        ctx.fillStyle = "#ffd152";
        ctx.beginPath();
        ctx.arc(c.x, c.y + bobY, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Enemies & Boss
    for (const e of this.enemies) {
      PixelSprites.drawEnemy(ctx, e, this.time);
    }

    // Draw Projectiles
    for (const proj of this.projectiles) {
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Warrior
    if (this.player) {
      PixelSprites.drawWarrior(ctx, this.player, this.time);
    }

    // Draw Ancient Stone Shockwaves
    for (const wv of this.stoneWaves) {
      ctx.strokeStyle = `rgba(255, 209, 82, ${wv.alpha})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 42, 85, ${wv.alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(wv.x, wv.y, wv.r * 0.82, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw Particles
    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
    }

    ctx.restore();
  },

  loop(timestamp) {
    this.time = timestamp || 0;
    this.update();
    this.render();
    requestAnimationFrame((ts) => this.loop(ts));
  }
};
