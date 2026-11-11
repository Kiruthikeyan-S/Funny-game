// ============================================================================
// THE CURSED KINGDOM — PIXEL-ART SPRITE & SCENE RENDERER
// ============================================================================

const PixelSprites = {
  // Helper to draw crisp pixel rectangles
  rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  },

  // Draw the Playable Warrior (Sir Kael)
  drawWarrior(ctx, p, time) {
    ctx.save();
    ctx.translate(Math.round(p.x + p.w / 2), Math.round(p.y + p.h / 2));
    if (p.facing < 0) ctx.scale(-1, 1);

    const walkOffset = p.onGround && Math.abs(p.vx) > 0.3 ? Math.sin(time * 0.018) * 4 : 0;

    // Hurt flash
    if (p.invulnTimer > 0 && Math.floor(p.invulnTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Ancient Stone Aura when Stone is charged
    if (p.stoneEnergy >= 100) {
      ctx.fillStyle = "rgba(255, 42, 85, 0.22)";
      ctx.beginPath();
      ctx.arc(0, 0, 28 + Math.sin(time * 0.01) * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Red Royal Cape
    this.rect(ctx, -16, -8, 8, 24 + walkOffset * 0.5, "#c9184a");
    this.rect(ctx, -18, 4, 6, 14, "#800f2f");

    // Legs / Boots
    this.rect(ctx, -8, 12 + walkOffset, 6, 12, "#495057");
    this.rect(ctx, 2, 12 - walkOffset, 6, 12, "#343a40");
    this.rect(ctx, -8, 20 + walkOffset, 8, 4, "#ffd152");
    this.rect(ctx, 2, 20 - walkOffset, 8, 4, "#ffd152");

    // Torso Armor (Silver + Royal Blue)
    this.rect(ctx, -10, -8, 20, 20, "#3a506b");
    this.rect(ctx, -8, -6, 16, 14, "#adb5bd");
    // Golden Chest Emblem
    this.rect(ctx, -2, -2, 6, 6, "#ffd152");

    // Knight Helmet & Crimson Plume
    this.rect(ctx, -12, -26, 10, 6, "#e63946"); // Plume
    this.rect(ctx, -9, -22, 18, 15, "#dee2e6"); // Helm
    this.rect(ctx, -1, -16, 10, 4, "#1b263b"); // Visor slit
    this.rect(ctx, 2, -15, 4, 2, "#38e4ae"); // Glowing eye

    // Shield (when blocking, hold in front; otherwise at side)
    if (p.blocking) {
      this.rect(ctx, 8, -14, 8, 26, "#ffd152");
      this.rect(ctx, 10, -12, 5, 22, "#1d3557");
      ctx.strokeStyle = "#38e4ae";
      ctx.lineWidth = 2;
      ctx.strokeRect(7, -16, 12, 30);
    } else {
      this.rect(ctx, -12, -4, 6, 16, "#ffd152");
      this.rect(ctx, -11, -2, 4, 12, "#1d3557");
    }

    // Sword & Attack Slash Animation
    if (p.attackTimer > 0) {
      const swordColor = p.comboStep === 3 ? "#ff2a55" : p.comboStep === 2 ? "#ffd152" : "#e0fbfc";
      // Extended blade
      this.rect(ctx, 8, -6, 10, 4, "#ffd152"); // Hilt
      this.rect(ctx, 16, -8, 32, 7, swordColor);
      this.rect(ctx, 20, -6, 26, 3, "#ffffff");

      // Pixel Slash Arc
      ctx.fillStyle = p.comboStep === 3 ? "rgba(255, 42, 85, 0.55)" : "rgba(255, 209, 82, 0.45)";
      ctx.beginPath();
      ctx.arc(16, -4, 38, -0.9, 0.9);
      ctx.fill();
    } else {
      // Sword held ready
      this.rect(ctx, 6, 0, 6, 4, "#ffd152");
      this.rect(ctx, 10, -18, 5, 20, "#e9ecef");
    }

    ctx.restore();
  },

  // Draw Enemies & Bosses
  drawEnemy(ctx, e, time) {
    ctx.save();
    ctx.translate(Math.round(e.x + e.w / 2), Math.round(e.y + e.h / 2));
    if (e.vx > 0) ctx.scale(-1, 1);

    const bob = Math.sin(time * 0.01 + e.x * 0.05) * 3;

    if (e.hurtTimer > 0) {
      ctx.filter = "brightness(2.2)";
    }

    switch (e.type) {
      case "slime": {
        this.rect(ctx, -16, 0 + bob * 0.5, 32, 18 - bob * 0.5, "#38b000");
        this.rect(ctx, -12, -6 + bob * 0.5, 24, 8, "#70e000");
        this.rect(ctx, -8, 2, 4, 4, "#111");
        this.rect(ctx, 2, 2, 4, 4, "#111");
        break;
      }
      case "wolf": {
        this.rect(ctx, -20, -4, 34, 14, "#6c757d");
        this.rect(ctx, -24, -12, 16, 12, "#495057");
        this.rect(ctx, -20, -16, 4, 5, "#adb5bd");
        this.rect(ctx, -22, -8, 4, 3, "#ff2a55"); // Red cursed eye
        this.rect(ctx, -16, 10 + bob, 5, 8, "#343a40");
        this.rect(ctx, 6, 10 - bob, 5, 8, "#343a40");
        break;
      }
      case "forest_guard": {
        this.rect(ctx, -16, -20, 32, 40, "#2d6a4f");
        this.rect(ctx, -12, -16, 24, 14, "#52b788");
        this.rect(ctx, -8, -10, 5, 4, "#ffd152");
        this.rect(ctx, 3, -10, 5, 4, "#ffd152");
        this.rect(ctx, -22, -6, 8, 20, "#7f4f24");
        break;
      }
      case "bat": {
        const wingY = Math.sin(time * 0.025) * 8;
        this.rect(ctx, -8, -8, 16, 16, "#3c096c");
        this.rect(ctx, -22, -6 + wingY, 14, 8, "#7b2cbf");
        this.rect(ctx, 8, -6 + wingY, 14, 8, "#7b2cbf");
        this.rect(ctx, -5, -3, 3, 3, "#ff2a55");
        this.rect(ctx, 2, -3, 3, 3, "#ff2a55");
        break;
      }
      case "skeleton": {
        this.rect(ctx, -9, -22, 18, 14, "#f8f9fa");
        this.rect(ctx, -6, -17, 4, 4, "#e63946");
        this.rect(ctx, 2, -17, 4, 4, "#e63946");
        this.rect(ctx, -7, -6, 14, 18, "#dee2e6");
        this.rect(ctx, -20, -8, 12, 4, "#adb5bd"); // Bone sword
        this.rect(ctx, -6, 12 + bob, 4, 10, "#ced4da");
        this.rect(ctx, 2, 12 - bob, 4, 10, "#ced4da");
        break;
      }
      case "ice_beast": {
        this.rect(ctx, -18, -16, 36, 32, "#48cae4");
        this.rect(ctx, -14, -22, 28, 10, "#90e0ef");
        this.rect(ctx, -10, -10, 5, 5, "#ff2a55");
        this.rect(ctx, 4, -10, 5, 5, "#ff2a55");
        this.rect(ctx, -16, 16, 8, 6, "#caf0f8");
        this.rect(ctx, 8, 16, 8, 6, "#caf0f8");
        break;
      }
      case "ice_golem": {
        this.rect(ctx, -22, -26, 44, 50, "#0077b6");
        this.rect(ctx, -16, -20, 32, 24, "#00b4d8");
        this.rect(ctx, -10, -14, 6, 6, "#ffd152");
        this.rect(ctx, 4, -14, 6, 6, "#ffd152");
        break;
      }
      case "shadow_knight": {
        this.rect(ctx, -12, -24, 24, 46, "#240046");
        this.rect(ctx, -10, -20, 20, 14, "#5a189a");
        this.rect(ctx, -6, -15, 5, 3, "#ff2a55");
        this.rect(ctx, -24, -4, 14, 5, "#f72585"); // Dark blade
        break;
      }
      case "bone_captain":
      case "mountain_guardian":
      case "final_guardian": {
        const mainColor =
          e.type === "bone_captain" ? "#e9ecef" :
          e.type === "mountain_guardian" ? "#00b4d8" : "#7209b7";
        const trimColor =
          e.type === "bone_captain" ? "#e63946" :
          e.type === "mountain_guardian" ? "#caf0f8" : "#ffd152";

        this.rect(ctx, -26, -34, 52, 68, mainColor);
        this.rect(ctx, -20, -44, 40, 14, trimColor);
        this.rect(ctx, -14, -24, 8, 8, "#ff2a55");
        this.rect(ctx, 6, -24, 8, 8, "#ff2a55");
        this.rect(ctx, -40, -10 + bob, 16, 32, trimColor);
        break;
      }
      case "witch_encounter":
      case "witch_final": {
        // Curse Barrier Shield (if active in Level 13)
        if (e.shieldActive) {
          ctx.strokeStyle = "#f72585";
          ctx.lineWidth = 4;
          ctx.fillStyle = "rgba(157, 78, 221, 0.28)";
          ctx.beginPath();
          ctx.arc(0, -4, 48 + Math.sin(time * 0.015) * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Witch Morgana Robes
        this.rect(ctx, -18, -18 + bob, 36, 46, "#3c096c");
        this.rect(ctx, -14, -14 + bob, 28, 38, "#7209b7");
        // Witch Face & Glowing Eyes
        this.rect(ctx, -10, -30 + bob, 20, 14, "#e0aaff");
        this.rect(ctx, -6, -25 + bob, 4, 4, "#ff0055");
        this.rect(ctx, 2, -25 + bob, 4, 4, "#ff0055");
        // Pointed Witch Hat
        this.rect(ctx, -20, -34 + bob, 40, 5, "#240046");
        this.rect(ctx, -12, -46 + bob, 24, 12, "#3c096c");
        this.rect(ctx, -6, -56 + bob, 12, 10, "#5a189a");
        // Cursed Staff
        this.rect(ctx, -26, -32 + bob, 4, 54, "#ffd152");
        this.rect(ctx, -30, -40 + bob, 12, 12, "#f72585");
        break;
      }
    }

    // Mini health bar above normal enemies
    if (!e.isBoss && e.hp < e.maxHp) {
      this.rect(ctx, -16, -e.h / 2 - 10, 32, 5, "#1b142b");
      this.rect(ctx, -15, -e.h / 2 - 9, 30 * Math.max(0, e.hp / e.maxHp), 3, "#ff4d6d");
    }

    ctx.restore();
  },

  // Draw the Ancient Magical Stone Relic
  drawAncientStone(ctx, x, y, time, scale = 1) {
    ctx.save();
    ctx.translate(x, y + Math.sin(time * 0.006) * 5);
    ctx.scale(scale, scale);

    // Outer Aura
    ctx.fillStyle = "rgba(255, 209, 82, 0.25)";
    ctx.beginPath();
    ctx.arc(0, 0, 24 + Math.sin(time * 0.012) * 4, 0, Math.PI * 2);
    ctx.fill();

    // Golden Amulet Frame
    this.rect(ctx, -12, -16, 24, 32, "#ffd152");
    this.rect(ctx, -16, -10, 32, 20, "#ffaa00");
    // Glowing Crimson Core
    this.rect(ctx, -8, -10, 16, 20, "#e63946");
    this.rect(ctx, -4, -6, 8, 12, "#ffccd5");

    ctx.restore();
  },

  // Render Story Cutscene Slides on #story-canvas
  drawStoryScene(ctx, sceneType, time) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Starry dark background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#120924");
    grad.addColorStop(1, "#2c1654");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Floor
    this.rect(ctx, 0, h - 36, w, 36, "#1f1538");
    this.rect(ctx, 0, h - 36, w, 4, "#ffd152");

    if (sceneType === "castle_curse") {
      // Castle towers & Witch's purple curse clouds
      this.rect(ctx, 260, 60, 160, 144, "#2b2540");
      this.rect(ctx, 240, 40, 40, 164, "#3b3355");
      this.rect(ctx, 400, 40, 40, 164, "#3b3355");
      // Witch floating above castle
      this.drawEnemy(ctx, { x: 480, y: 65, w: 40, h: 60, vx: -1, type: "witch_final", shieldActive: true }, time);
    } else if (sceneType === "king_throne") {
      // King Aldric on Throne + Ancient Stone
      this.rect(ctx, 130, 80, 70, 124, "#800f2f"); // Throne
      this.rect(ctx, 150, 96, 30, 18, "#ffd152"); // Crown
      this.rect(ctx, 146, 114, 38, 60, "#c9184a"); // Royal robe
      this.drawAncientStone(ctx, 340, 120, time, 1.5);
      this.drawWarrior(ctx, { x: 480, y: 150, w: 36, h: 48, facing: -1, vx: 0, onGround: true, stoneEnergy: 100 }, time);
    } else if (sceneType === "warrior_journey") {
      this.drawWarrior(ctx, { x: 160, y: 150, w: 36, h: 48, facing: 1, vx: 2, onGround: true, attackTimer: 10, comboStep: 2, stoneEnergy: 50 }, time);
      this.drawEnemy(ctx, { x: 340, y: 170, w: 32, h: 24, vx: -1, type: "slime", hp: 20, maxHp: 20 }, time);
      this.drawEnemy(ctx, { x: 440, y: 156, w: 32, h: 44, vx: -1, type: "skeleton", hp: 30, maxHp: 30 }, time);
      this.drawEnemy(ctx, { x: 540, y: 156, w: 36, h: 44, vx: -1, type: "ice_beast", hp: 40, maxHp: 40 }, time);
    } else {
      // Level 6 & 13 confrontation
      this.drawWarrior(ctx, { x: 180, y: 150, w: 36, h: 48, facing: 1, vx: 0, onGround: true, stoneEnergy: 100 }, time);
      this.drawAncientStone(ctx, 330, 110, time, 1.4);
      this.drawEnemy(ctx, { x: 470, y: 136, w: 44, h: 64, vx: -1, type: "witch_final", shieldActive: true }, time);
    }
  }
};
