extends Node
## GameManager.gd — Global State, 5 Worlds & 13 Levels Registry (Godot 4)

signal coins_updated(new_total: int)
signal level_completed(level_num: int, stars: int, coins_earned: int)

var current_level: int = 1

const WORLDS := {
	1: { "name": "World 1 – The Forgotten Forest", "levels": [1, 2, 3] },
	2: { "name": "World 2 – The Dark Caves", "levels": [4, 5] },
	3: { "name": "World 3 – The Witch's Territory", "levels": [6] },
	4: { "name": "World 4 – The Frozen Mountains", "levels": [7, 8, 9] },
	5: { "name": "World 5 – The Cursed Kingdom", "levels": [10, 11, 12, 13] }
}

const LEVELS := {
	1: { "world": 1, "title": "The Beginning", "enemies": ["slime", "wolf"], "boss": "" },
	2: { "world": 1, "title": "Forest Monsters", "enemies": ["slime", "wolf"], "boss": "" },
	3: { "world": 1, "title": "The Hidden Ruins", "enemies": ["slime", "wolf", "forest_guard"], "boss": "" },
	4: { "world": 2, "title": "Underground Passage", "enemies": ["bat", "skeleton"], "boss": "" },
	5: { "world": 2, "title": "The Skeleton Fortress", "enemies": ["skeleton", "bat"], "boss": "bone_captain" },
	6: { "world": 3, "title": "The Witch's Castle", "enemies": ["skeleton", "shadow_knight"], "boss": "witch_encounter" },
	7: { "world": 4, "title": "Frozen Valley", "enemies": ["ice_beast", "wolf"], "boss": "" },
	8: { "world": 4, "title": "Ice Monster's Cave", "enemies": ["ice_beast", "ice_golem"], "boss": "" },
	9: { "world": 4, "title": "The Mountain Guardian", "enemies": ["ice_beast", "ice_golem"], "boss": "mountain_guardian" },
	10: { "world": 5, "title": "The Burning Lands", "enemies": ["shadow_knight", "bat"], "boss": "" },
	11: { "world": 5, "title": "The Shadow Temple", "enemies": ["shadow_knight", "ice_golem"], "boss": "" },
	12: { "world": 5, "title": "The Final Guardian", "enemies": ["shadow_knight", "skeleton"], "boss": "final_guardian" },
	13: { "world": 5, "title": "The Witch's Final Battle", "enemies": ["shadow_knight", "bat"], "boss": "witch_final" }
}

func start_level(level_num: int) -> void:
	current_level = clampi(level_num, 1, 13)
	get_tree().change_scene_to_file("res://scenes/levels/BaseLevel.tscn")

func go_to_main_menu() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/ui/MainMenu.tscn")
