extends Node
## GameManager.gd — Global State, 5 Worlds & 13-Monster Progression Registry (Godot 4)

signal coins_updated(new_total: int)
signal potions_updated(new_total: int)
signal level_completed(level_num: int, stars: int, coins_earned: int)
signal boss_intro_triggered(boss_name: String, difficulty: String, intro_text: String)
signal boss_defeated(boss_name: String)

var current_level: int = 1

const WORLDS := {
	1: { "name": "World 1 – The Forgotten Forest", "difficulty": "Beginner", "levels": [1, 2, 3] },
	2: { "name": "World 2 – The Cursed Caves", "difficulty": "Medium", "levels": [4, 5, 6] },
	3: { "name": "World 3 – The Frozen Mountains", "difficulty": "Hard", "levels": [7, 8, 9] },
	4: { "name": "World 4 – The Dark Kingdom", "difficulty": "Very Hard", "levels": [10, 11, 12] },
	5: { "name": "World 5 – The Witch's Castle", "difficulty": "Final Boss", "levels": [13] }
}

const MONSTERS := {
	"forest_goblin": { "level": 1, "name": "Forest Goblin", "difficulty": "Easy", "hp": 100, "attack": "Short sword", "special": "Quick movement", "is_boss": false },
	"shadow_wolf": { "level": 2, "name": "Shadow Wolf", "difficulty": "Easy–Medium", "hp": 180, "attack": "Bite and jumping attack", "special": "Fast dash", "is_boss": false },
	"tree_guardian": { "level": 3, "name": "Ancient Tree Guardian", "difficulty": "Medium", "hp": 350, "attack": "Ground smash and root attack", "special": "Roots trap warrior temporarily", "is_boss": true },
	"skeleton_knight": { "level": 4, "name": "Skeleton Knight", "difficulty": "Medium", "hp": 400, "attack": "Sword and shield", "special": "Shield defence", "is_boss": false },
	"spider_queen": { "level": 5, "name": "Venom Spider Queen", "difficulty": "Medium", "hp": 550, "attack": "Poison and web shooting", "special": "Poison reduces health over time", "is_boss": true },
	"dark_witch": { "level": 6, "name": "The Dark Witch", "difficulty": "Hard", "hp": 1000, "attack": "Dark magic and fireballs", "special": "Curse magic (Escapes at 35% HP)", "is_boss": true },
	"ice_golem": { "level": 7, "name": "Ice Golem", "difficulty": "Hard", "hp": 850, "attack": "Ice punches", "special": "Freezes the ground", "is_boss": false },
	"frost_wyvern": { "level": 8, "name": "Frost Wyvern", "difficulty": "Hard", "hp": 1100, "attack": "Flying strikes and ice breath", "special": "Aerial attacks", "is_boss": false },
	"three_headed_beast": { "level": 9, "name": "Three-Headed Frost Beast", "difficulty": "Very Hard", "hp": 1600, "attack": "Three different attack patterns", "special": "Ice storm and multiple bites", "is_boss": true },
	"shadow_assassin": { "level": 10, "name": "Shadow Assassin", "difficulty": "Very Hard", "hp": 1400, "attack": "Dual blades", "special": "Disappears and attacks from behind", "is_boss": false },
	"demon_knight": { "level": 11, "name": "Demon Knight", "difficulty": "Very Hard", "hp": 2000, "attack": "Heavy sword and fire", "special": "Powerful ground shockwaves", "is_boss": true },
	"cursed_dragon": { "level": 12, "name": "Cursed Dragon", "difficulty": "Extreme", "hp": 2800, "attack": "Fire breath and flying attacks", "special": "Multiple combat phases", "is_boss": true },
	"witch_queen": { "level": 13, "name": "The Witch Queen", "difficulty": "Final Boss", "hp": 5000, "attack": "Dark magic, fireballs and lightning", "special": "Dark shield + Teleport + Full Kingdom Curse", "is_boss": true }
}

const LEVELS := {
	1: { "world": 1, "title": "The Forgotten Outpost", "monster": "forest_goblin", "minion": "forest_goblin", "boss": "" },
	2: { "world": 1, "title": "Shadow Wolf Den", "monster": "shadow_wolf", "minion": "forest_goblin", "boss": "" },
	3: { "world": 1, "title": "The Ancient Grove", "monster": "tree_guardian", "minion": "shadow_wolf", "boss": "tree_guardian" },
	4: { "world": 2, "title": "Crypt of the Shield", "monster": "skeleton_knight", "minion": "skeleton_knight", "boss": "" },
	5: { "world": 2, "title": "Lair of the Spider Queen", "monster": "spider_queen", "minion": "skeleton_knight", "boss": "spider_queen" },
	6: { "world": 2, "title": "Altar of the Dark Witch", "monster": "dark_witch", "minion": "skeleton_knight", "boss": "dark_witch" },
	7: { "world": 3, "title": "Glacier Gorge", "monster": "ice_golem", "minion": "ice_golem", "boss": "" },
	8: { "world": 3, "title": "Wyvern Ridge", "monster": "frost_wyvern", "minion": "ice_golem", "boss": "" },
	9: { "world": 3, "title": "Summit of the Frost Beast", "monster": "three_headed_beast", "minion": "frost_wyvern", "boss": "three_headed_beast" },
	10: { "world": 4, "title": "Streets of Shadow", "monster": "shadow_assassin", "minion": "shadow_assassin", "boss": "" },
	11: { "world": 4, "title": "Citadel of Hellfire", "monster": "demon_knight", "minion": "shadow_assassin", "boss": "demon_knight" },
	12: { "world": 4, "title": "Dragon's Gate", "monster": "cursed_dragon", "minion": "demon_knight", "boss": "cursed_dragon" },
	13: { "world": 5, "title": "Throne of the Witch Queen", "monster": "witch_queen", "minion": "demon_knight", "boss": "witch_queen" }
}

func start_level(level_num: int) -> void:
	current_level = clampi(level_num, 1, 13)
	get_tree().change_scene_to_file("res://scenes/levels/BaseLevel.tscn")

func go_to_main_menu() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/ui/MainMenu.tscn")
