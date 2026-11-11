extends Node
## SaveManager.gd — Persistent JSON Save System for The Cursed Kingdom (Godot 4)

const SAVE_PATH := "user://cursed_kingdom_save.json"

var unlocked_level: int = 1
var coins: int = 50
var stars: Dictionary = {} # { "1": 3, "2": 2, ... }
var upgrades: Dictionary = {
	"sword": 1,
	"armor": 1,
	"stone": 1,
	"boots": 1
}
var settings: Dictionary = {
	"sfx": true,
	"touch_controls": true
}

func _ready() -> void:
	load_game()

func save_game() -> void:
	var data := {
		"unlocked_level": unlocked_level,
		"coins": coins,
		"stars": stars,
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
			coins = int(parsed.get("coins", 50))
			stars = parsed.get("stars", {})
			upgrades.merge(parsed.get("upgrades", {}), true)
			settings.merge(parsed.get("settings", {}), true)

func record_level_victory(level_num: int, earned_stars: int, earned_coins: int) -> void:
	coins += earned_coins
	var key := str(level_num)
	var prev_stars := int(stars.get(key, 0))
	if earned_stars > prev_stars:
		stars[key] = earned_stars
	if level_num >= unlocked_level and level_num < 13:
		unlocked_level = level_num + 1
	save_game()

func reset_progress() -> void:
	unlocked_level = 1
	coins = 50
	stars.clear()
	upgrades = { "sword": 1, "armor": 1, "stone": 1, "boots": 1 }
	save_game()
