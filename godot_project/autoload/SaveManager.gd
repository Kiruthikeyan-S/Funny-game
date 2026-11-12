extends Node
## SaveManager.gd — Persistent JSON Save & Warrior Upgrade System for The Cursed Kingdom (Godot 4)

const SAVE_PATH := "user://cursed_kingdom_save.json"

var unlocked_level: int = 1
var coins: int = 250
var potions: int = 3
var stars: Dictionary = {} # { "1": 3, "2": 2, ... }
var defeated_monsters: Array = []
var upgrades: Dictionary = {
	"weapon": 1,
	"armor": 1,
	"health": 1,
	"skill": 1
}
var settings: Dictionary = {
	"music": true,
	"sfx": true,
	"music_vol": 80,
	"sfx_vol": 70,
	"touch_controls": true
}

const UPGRADE_COSTS := {
	"weapon": [0, 120, 240, 400, 600],
	"armor": [0, 110, 220, 380, 550],
	"health": [0, 100, 210, 350, 520],
	"skill": [0, 130, 260, 420, 620]
}

func _ready() -> void:
	load_game()

func save_game() -> void:
	var data := {
		"unlocked_level": unlocked_level,
		"coins": coins,
		"potions": potions,
		"stars": stars,
		"defeated_monsters": defeated_monsters,
		"upgrades": upgrades,
		"settings": settings
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data, "\t"))
		file.close()

func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		save_game()
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var parsed = JSON.parse_string(file.get_as_text())
		file.close()
		if typeof(parsed) == TYPE_DICTIONARY:
			unlocked_level = int(parsed.get("unlocked_level", 1))
			coins = int(parsed.get("coins", 250))
			potions = int(parsed.get("potions", 3))
			stars = parsed.get("stars", {})
			defeated_monsters = parsed.get("defeated_monsters", [])
			upgrades.merge(parsed.get("upgrades", {}), true)
			settings.merge(parsed.get("settings", {}), true)

func purchase_upgrade(category: String) -> bool:
	if not UPGRADE_COSTS.has(category):
		return false
	var current_tier := int(upgrades.get(category, 1))
	var costs: Array = UPGRADE_COSTS[category]
	if current_tier >= costs.size():
		return false
	var cost := int(costs[current_tier])
	if coins < cost:
		return false
	coins -= cost
	upgrades[category] = current_tier + 1
	save_game()
	return true

func buy_potion(cost: int = 60) -> bool:
	if coins < cost:
		return false
	coins -= cost
	potions += 1
	save_game()
	return true

func record_level_victory(level_num: int, earned_stars: int, earned_coins: int, monster_id: String = "") -> void:
	coins += earned_coins
	var key := str(level_num)
	var prev_stars := int(stars.get(key, 0))
	if earned_stars > prev_stars:
		stars[key] = earned_stars
	if monster_id != "" and not defeated_monsters.has(monster_id):
		defeated_monsters.append(monster_id)
	if level_num >= unlocked_level and level_num < 13:
		unlocked_level = level_num + 1
	save_game()

func reset_progress() -> void:
	unlocked_level = 1
	coins = 250
	potions = 3
	stars.clear()
	defeated_monsters.clear()
	upgrades = { "weapon": 1, "armor": 1, "health": 1, "skill": 1 }
	save_game()
