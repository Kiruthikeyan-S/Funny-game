// ============================================================================
// THE CURSED KINGDOM — UI CONTROLLER (ALL 6 SCREENS + STORY + ARMORY)
// ============================================================================

const UIController = {
  currentStoryIndex: 0,
  toastTimeout: null,

  init() {
    this.bindMenuButtons();
    this.applySettings();
    this.refreshMainMenu();
    GameEngine.init();
    this.startStoryCanvasLoop();
  },

  showScreen(screenId) {
    document.querySelectorAll(".ui-screen").forEach((el) => {
      el.classList.remove("active");
    });
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
  },

  refreshMainMenu() {
    const unlocked = SaveSystem.data.unlockedLevel || 1;
    const tag = document.getElementById("continue-level-tag");
    if (tag) tag.textContent = `(LV ${unlocked})`;
  },

  bindMenuButtons() {
    // Screen 1: Main Menu
    document.getElementById("btn-new-game").addEventListener("click", () => {
      SoundFX.checkpoint();
      this.openStoryScreen(0, true);
    });

    document.getElementById("btn-continue").addEventListener("click", () => {
      SoundFX.checkpoint();
      GameEngine.startLevel(SaveSystem.data.unlockedLevel || 1);
    });

    document.getElementById("btn-level-select").addEventListener("click", () => {
      SoundFX.coin();
      this.openLevelSelect();
    });

    document.getElementById("btn-armory").addEventListener("click", () => {
      SoundFX.coin();
      this.openArmory();
    });

    document.getElementById("btn-story-intro").addEventListener("click", () => {
      SoundFX.coin();
      this.openStoryScreen(0, false);
    });

    document.getElementById("btn-settings").addEventListener("click", () => {
      SoundFX.coin();
      this.showScreen("screen-settings");
    });

    // Story Cutscene controls
    document.getElementById("btn-skip-story").addEventListener("click", () => {
      if (this.launchLevelAfterStory) {
        GameEngine.startLevel(1);
      } else {
        this.showScreen("screen-main-menu");
      }
    });

    document.getElementById("btn-story-prev").addEventListener("click", () => {
      if (this.currentStoryIndex > 0) {
        this.currentStoryIndex--;
        this.renderStorySlide();
      }
    });

    document.getElementById("btn-story-next").addEventListener("click", () => {
      if (this.currentStoryIndex < STORY_SLIDES.length - 1) {
        this.currentStoryIndex++;
        this.renderStorySlide();
      } else if (this.launchLevelAfterStory) {
        GameEngine.startLevel(1);
      } else {
        this.showScreen("screen-main-menu");
      }
    });

    // Screen 2: Level Select
    document.getElementById("btn-map-back").addEventListener("click", () => {
      GameEngine.state = "MENU";
      this.refreshMainMenu();
      this.showScreen("screen-main-menu");
    });

    document.getElementById("btn-unlock-all").addEventListener("click", () => {
      SaveSystem.unlockAll();
      SoundFX.victory();
      this.openLevelSelect();
    });

    // Armory
    document.getElementById("btn-armory-back").addEventListener("click", () => {
      if (GameEngine.state === "COMPLETE") {
        this.showScreen("screen-level-complete");
      } else {
        this.refreshMainMenu();
        this.showScreen("screen-main-menu");
      }
    });

    // Screen 3: HUD Pause & Dialogue
    document.getElementById("btn-pause").addEventListener("click", () => {
      this.pauseGame();
    });

    document.getElementById("btn-dialogue-dismiss").addEventListener("click", () => {
      document.getElementById("hud-dialogue-banner").classList.add("hidden");
    });

    // Screen 4: Pause Menu
    document.getElementById("btn-resume").addEventListener("click", () => {
      this.resumeGame();
    });

    document.getElementById("btn-restart").addEventListener("click", () => {
      if (GameEngine.currentLevelData) {
        GameEngine.startLevel(GameEngine.currentLevelData.level);
      }
    });

    document.getElementById("btn-pause-settings").addEventListener("click", () => {
      this.showScreen("screen-settings");
    });

    document.getElementById("btn-pause-map").addEventListener("click", () => {
      GameEngine.state = "MENU";
      this.openLevelSelect();
    });

    document.getElementById("btn-pause-menu").addEventListener("click", () => {
      GameEngine.state = "MENU";
      this.refreshMainMenu();
      this.showScreen("screen-main-menu");
    });

    // Screen 5: Level Complete
    document.getElementById("btn-next-level").addEventListener("click", () => {
      const cur = GameEngine.currentLevelData ? GameEngine.currentLevelData.level : 1;
      const next = Math.min(13, cur + 1);
      GameEngine.startLevel(next);
    });

    document.getElementById("btn-replay-level").addEventListener("click", () => {
      const cur = GameEngine.currentLevelData ? GameEngine.currentLevelData.level : 1;
      GameEngine.startLevel(cur);
    });

    document.getElementById("btn-complete-armory").addEventListener("click", () => {
      this.openArmory();
    });

    document.getElementById("btn-complete-map").addEventListener("click", () => {
      GameEngine.state = "MENU";
      this.openLevelSelect();
    });

    // Screen 6: Ending Screen
    document.getElementById("btn-ending-map").addEventListener("click", () => {
      GameEngine.state = "MENU";
      this.openLevelSelect();
    });

    document.getElementById("btn-ending-menu").addEventListener("click", () => {
      GameEngine.state = "MENU";
      this.refreshMainMenu();
      this.showScreen("screen-main-menu");
    });

    // Settings Modal
    document.getElementById("btn-settings-close").addEventListener("click", () => {
      if (GameEngine.state === "PAUSED") {
        this.showScreen("screen-pause");
      } else {
        this.showScreen("screen-main-menu");
      }
    });

    document.getElementById("toggle-sfx").addEventListener("change", (e) => {
      SaveSystem.data.settings.sfx = e.target.checked;
      SaveSystem.save();
    });

    document.getElementById("toggle-touch").addEventListener("change", (e) => {
      SaveSystem.data.settings.touch = e.target.checked;
      SaveSystem.save();
      this.applySettings();
    });

    document.getElementById("toggle-crt").addEventListener("change", (e) => {
      SaveSystem.data.settings.crt = e.target.checked;
      SaveSystem.save();
      this.applySettings();
    });

    document.getElementById("btn-reset-save").addEventListener("click", () => {
      SaveSystem.reset();
      this.applySettings();
      this.refreshMainMenu();
      SoundFX.defeat();
      this.showScreen("screen-main-menu");
    });
  },

  applySettings() {
    const s = SaveSystem.data.settings;
    document.getElementById("toggle-sfx").checked = Boolean(s.sfx);
    document.getElementById("toggle-touch").checked = Boolean(s.touch);
    document.getElementById("toggle-crt").checked = Boolean(s.crt);

    const touchEl = document.getElementById("touch-controls");
    if (touchEl) {
      touchEl.style.display = s.touch ? "flex" : "none";
    }
    const crtEl = document.getElementById("crt-overlay");
    if (crtEl) {
      crtEl.classList.toggle("disabled", !s.crt);
    }
  },

  // Story Intro Screen
  openStoryScreen(startIndex = 0, launchAfter = false) {
    this.currentStoryIndex = startIndex;
    this.launchLevelAfterStory = launchAfter;
    this.renderStorySlide();
    this.showScreen("screen-story");
  },

  renderStorySlide() {
    const slide = STORY_SLIDES[this.currentStoryIndex];
    document.getElementById("story-title").textContent = slide.title;
    document.getElementById("story-speaker").textContent = slide.speaker;
    document.getElementById("story-text").textContent = slide.text;

    const dotsWrap = document.getElementById("story-dots");
    dotsWrap.innerHTML = "";
    STORY_SLIDES.forEach((_, idx) => {
      const d = document.createElement("div");
      d.className = "story-dot" + (idx === this.currentStoryIndex ? " active" : "");
      dotsWrap.appendChild(d);
    });

    const nextBtn = document.getElementById("btn-story-next");
    if (this.currentStoryIndex === STORY_SLIDES.length - 1) {
      nextBtn.textContent = this.launchLevelAfterStory ? "BEGIN QUEST \u00BB" : "DONE";
    } else {
      nextBtn.textContent = "NEXT \u00BB";
    }
  },

  startStoryCanvasLoop() {
    const storyCanvas = document.getElementById("story-canvas");
    const endingCanvas = document.getElementById("ending-canvas");
    const sCtx = storyCanvas ? storyCanvas.getContext("2d") : null;
    const eCtx = endingCanvas ? endingCanvas.getContext("2d") : null;

    const renderCutscenes = (time) => {
      if (sCtx && document.getElementById("screen-story").classList.contains("active")) {
        const slide = STORY_SLIDES[this.currentStoryIndex] || STORY_SLIDES[0];
        PixelSprites.drawStoryScene(sCtx, slide.scene, time);
      }
      if (eCtx && document.getElementById("screen-ending").classList.contains("active")) {
        PixelSprites.drawStoryScene(eCtx, "king_throne", time);
      }
      requestAnimationFrame(renderCutscenes);
    };
    requestAnimationFrame(renderCutscenes);
  },

  // Screen 2: 5 Worlds / 13 Levels Map
  openLevelSelect() {
    document.getElementById("map-total-coins").textContent = SaveSystem.data.coins;
    document.getElementById("map-total-stars").textContent = SaveSystem.getTotalStars();

    const container = document.getElementById("worlds-container");
    container.innerHTML = "";

    WORLDS_DATA.forEach((world) => {
      const card = document.createElement("div");
      card.className = "world-card" + (world.isBossWorld ? " world-boss" : "");

      const header = document.createElement("div");
      header.className = "world-header";
      header.innerHTML = `
        <span class="world-title">${world.name}</span>
        <span class="world-enemies">${world.enemiesText}</span>
      `;
      card.appendChild(header);

      const row = document.createElement("div");
      row.className = "levels-row";

      const worldLevels = LEVELS_DATA.filter((l) => l.world === world.id);
      worldLevels.forEach((lvl) => {
        const isUnlocked = lvl.level <= SaveSystem.data.unlockedLevel;
        const starsEarned = SaveSystem.data.stars[lvl.level] || 0;

        const node = document.createElement("div");
        node.className =
          "level-node" +
          (!isUnlocked ? " locked" : "") +
          (lvl.boss ? " boss-node" : "");

        let starsHtml = "";
        for (let s = 1; s <= 3; s++) {
          starsHtml += `<span class="${s <= starsEarned ? "lit" : ""}">&#9733;</span>`;
        }

        node.innerHTML = `
          <div class="level-node-top">
            <span class="level-num">LEVEL ${lvl.level} ${lvl.boss ? "&#9760;" : ""}</span>
            <span class="level-stars">${isUnlocked ? starsHtml : "&#128274;"}</span>
          </div>
          <div class="level-name">${lvl.name}</div>
          <div class="level-tag">${lvl.subtitle}</div>
        `;

        if (isUnlocked) {
          node.addEventListener("click", () => {
            SoundFX.checkpoint();
            GameEngine.startLevel(lvl.level);
          });
        }
        row.appendChild(node);
      });

      card.appendChild(row);
      container.appendChild(card);
    });

    this.showScreen("screen-level-select");
  },

  // Royal Armory / Upgrades
  openArmory() {
    document.getElementById("armory-coins").textContent = SaveSystem.data.coins;
    const list = document.getElementById("upgrades-list");
    list.innerHTML = "";

    UPGRADES_DATA.forEach((u) => {
      const currentTier = SaveSystem.data.upgrades[u.id] || 1;
      const isMax = currentTier >= u.maxLevel;
      const cost = u.baseCost * currentTier;

      let pipsHtml = "";
      for (let i = 1; i <= u.maxLevel; i++) {
        pipsHtml += `<div class="upgrade-pip ${i <= currentTier ? "filled" : ""}"></div>`;
      }

      const card = document.createElement("div");
      card.className = "upgrade-card";
      card.innerHTML = `
        <div>
          <h3>${u.name} (TIER ${currentTier}/${u.maxLevel})</h3>
          <p>${u.desc}</p>
        </div>
        <div class="upgrade-level-bar">${pipsHtml}</div>
        <button class="pixel-btn small ${isMax ? "" : "accent"}" ${isMax ? "disabled" : ""}>
          ${isMax ? "MAX LEVEL" : `UPGRADE (${cost} COINS)`}
        </button>
      `;

      if (!isMax) {
        card.querySelector("button").addEventListener("click", () => {
          if (SaveSystem.data.coins >= cost) {
            SaveSystem.data.coins -= cost;
            SaveSystem.data.upgrades[u.id] = currentTier + 1;
            SaveSystem.save();
            SoundFX.checkpoint();
            this.openArmory();
          } else {
            SoundFX.defeat();
          }
        });
      }

      list.appendChild(card);
    });

    this.showScreen("screen-armory");
  },

  // Screen 3: Gameplay HUD
  showHUD(lvl, world) {
    this.showScreen("screen-hud");
    document.getElementById("hud-world-label").textContent = `WORLD ${world.id}`;
    document.getElementById("hud-level-title").textContent = `LV ${lvl.level}: ${lvl.name.toUpperCase()}`;
    document.getElementById("hud-weapon-tier").textContent = `LV${SaveSystem.data.upgrades.sword || 1}`;
  },

  updateHUD(player, stats, lvl, boss) {
    const hpPct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    document.getElementById("hud-hp-fill").style.width = `${hpPct}%`;
    document.getElementById("hud-hp-text").textContent = `${Math.ceil(player.hp)}/${player.maxHp}`;

    const stonePct = Math.max(0, Math.min(100, player.stoneEnergy));
    document.getElementById("hud-stone-fill").style.width = `${stonePct}%`;
    document.getElementById("hud-stone-text").textContent =
      stonePct >= 100 ? "READY [U]" : `${Math.floor(stonePct)}%`;

    const progressPct = Math.max(0, Math.min(100, (player.x / lvl.length) * 100));
    document.getElementById("hud-progress-fill").style.width = `${progressPct}%`;
    document.getElementById("hud-coins").textContent = SaveSystem.data.coins + stats.coinsCollected;

    const bossBox = document.getElementById("hud-boss-box");
    if (boss && boss.hp > 0) {
      bossBox.classList.remove("hidden");
      document.getElementById("hud-boss-name").textContent = boss.name;
      const bPct = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));
      document.getElementById("hud-boss-fill").style.width = `${bPct}%`;
      const shieldTag = document.getElementById("hud-boss-shield-tag");
      shieldTag.classList.toggle("hidden", !boss.shieldActive);
    } else {
      bossBox.classList.add("hidden");
    }
  },

  showDialogue(speaker, line) {
    const banner = document.getElementById("hud-dialogue-banner");
    document.getElementById("dialogue-speaker").textContent = speaker;
    document.getElementById("dialogue-line").textContent = line;
    banner.classList.remove("hidden");
  },

  showToast(message) {
    const toast = document.getElementById("hud-toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add("hidden");
    }, 2400);
  },

  // Screen 4: Pause
  pauseGame() {
    if (GameEngine.state !== "PLAYING") return;
    GameEngine.state = "PAUSED";
    const lvl = GameEngine.currentLevelData;
    document.getElementById("pause-level-name").textContent = `Level ${lvl.level}: ${lvl.name}`;
    this.showScreen("screen-pause");
  },

  resumeGame() {
    if (GameEngine.state !== "PAUSED") return;
    GameEngine.state = "PLAYING";
    this.showScreen("screen-hud");
  },

  // Screen 5: Level Completion
  showLevelComplete(victory, lvl, stars, coins, enemies, hpRatio) {
    document.getElementById("complete-badge").textContent = victory
      ? `LEVEL ${lvl.level} COMPLETED`
      : `LEVEL ${lvl.level} FAILED`;
    document.getElementById("complete-title").textContent = victory ? "VICTORY!" : "FALLEN IN BATTLE";
    document.getElementById("complete-story-note").textContent = victory
      ? lvl.clearNote
      : "The curse overwhelmed you. Upgrade your gear in the Royal Armory or try again!";

    const starsBox = document.getElementById("complete-stars");
    starsBox.innerHTML = "";
    for (let i = 1; i <= 3; i++) {
      const sp = document.createElement("span");
      sp.className = "star" + (i <= stars ? " earned" : "");
      sp.innerHTML = "&#9733;";
      starsBox.appendChild(sp);
    }

    document.getElementById("complete-coins").textContent = `+${coins}`;
    document.getElementById("complete-enemies").textContent = String(enemies);
    document.getElementById("complete-hp").textContent = `${Math.round(hpRatio * 100)}%`;

    const nextBtn = document.getElementById("btn-next-level");
    nextBtn.style.display = victory && lvl.level < 13 ? "block" : "none";

    this.showScreen("screen-level-complete");
  },

  // Screen 6: Final Ending
  showEndingScreen() {
    document.getElementById("ending-stars").textContent = `${SaveSystem.getTotalStars()}/39`;
    document.getElementById("ending-coins").textContent = String(SaveSystem.data.coins);
    this.showScreen("screen-ending");
  }
};

window.addEventListener("DOMContentLoaded", () => {
  UIController.init();
});
