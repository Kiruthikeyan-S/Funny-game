extends EnemyBase
class_name WitchBoss
## WitchBoss.gd — Handles Level 6 Story Encounter & Level 13 Final Boss Battle

signal curse_barrier_broken
signal witch_escaped_level_6
signal witch_defeated_final

@export var is_final_battle: bool = false
var curse_barrier_active: bool = false

func _ready() -> void:
	super._ready()
	max_hp = 750 if is_final_battle else 420
	current_hp = max_hp
	curse_barrier_active = is_final_battle

func take_damage(amount: int, is_stone_power: bool = false) -> void:
	if curse_barrier_active:
		if is_stone_power:
			curse_barrier_active = false
			emit_signal("curse_barrier_broken")
		else:
			# Normal sword attacks are blocked until the Ancient Stone shatters the barrier
			return

	current_hp -= amount

	# Level 6 Major Story Encounter: Witch unleashes her curse and escapes at 35% HP
	if not is_final_battle and float(current_hp) / float(max_hp) <= 0.35:
		emit_signal("witch_escaped_level_6")
		queue_free()
		return

	if current_hp <= 0:
		emit_signal("witch_defeated_final")
		queue_free()
