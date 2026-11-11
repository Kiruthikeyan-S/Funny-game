extends Control
## MainMenu.gd — Screen 1 Main Menu Controller for Godot 4

func _on_new_game_pressed() -> void:
	GameManager.start_level(1)

func _on_continue_pressed() -> void:
	GameManager.start_level(SaveManager.unlocked_level)

func _on_level_select_pressed() -> void:
	GameManager.start_level(SaveManager.unlocked_level)
