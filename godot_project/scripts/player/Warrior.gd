extends CharacterBody2D
class_name Warrior
## Warrior.gd — Main Playable Hero (Movement, Jump, 3-Hit Sword Combo, Shield Block & Ancient Stone Power)

signal health_changed(current_hp: int, max_hp: int)
signal stone_energy_changed(energy: float)
signal player_died

@export var base_speed: float = 240.0
@export var jump_velocity: float = -420.0
@export var gravity: float = 980.0

var max_hp: int = 100
var current_hp: int = 100
var stone_energy: float = 100.0
var sword_damage: int = 25

var jumps_remaining: int = 2
var facing_dir: int = 1
var is_blocking: bool = false
var combo_step: int = 0
var combo_timer: float = 0.0
var attack_cooldown: float = 0.0

func _ready() -> void:
	var armor_lvl: int = int(SaveManager.upgrades.get("armor", 1))
	var sword_lvl: int = int(SaveManager.upgrades.get("sword", 1))
	var boots_lvl: int = int(SaveManager.upgrades.get("boots", 1))

	max_hp = 100 + (armor_lvl - 1) * 25
	current_hp = max_hp
	sword_damage = 25 + (sword_lvl - 1) * 8
	base_speed = 240.0 + (boots_lvl - 1) * 18.0
	emit_signal("health_changed", current_hp, max_hp)

func _physics_process(delta: float) -> void:
	# Recharge Ancient Stone energy
	var stone_lvl: int = int(SaveManager.upgrades.get("stone", 1))
	stone_energy = minf(100.0, stone_energy + (6.0 + stone_lvl * 2.0) * delta)
	emit_signal("stone_energy_changed", stone_energy)

	if combo_timer > 0.0:
		combo_timer -= delta
	else:
		combo_step = 0

	if attack_cooldown > 0.0:
		attack_cooldown -= delta

	# Gravity
	if not is_on_floor():
		velocity.y += gravity * delta
	else:
		jumps_remaining = 2

	# Shield Block
	is_blocking = Input.is_key_pressed(KEY_L) or Input.is_key_pressed(KEY_SHIFT)

	# Jump / Double Jump
	if (Input.is_action_just_pressed("ui_accept") or Input.is_key_pressed(KEY_K)) and jumps_remaining > 0:
		velocity.y = jump_velocity
		jumps_remaining -= 1

	# Horizontal Movement
	var move_dir := Input.get_axis("ui_left", "ui_right")
	if move_dir != 0:
		facing_dir = 1 if move_dir > 0 else -1
		var speed_factor := 0.45 if is_blocking else 1.0
		velocity.x = move_dir * base_speed * speed_factor
	else:
		velocity.x = move_toward(velocity.x, 0, base_speed)

	# Sword Attack
	if Input.is_key_pressed(KEY_J) and attack_cooldown <= 0.0:
		perform_sword_attack()

	# Ancient Stone Special Ability
	if Input.is_key_pressed(KEY_U) and stone_energy >= 100.0:
		activate_ancient_stone()

	move_and_slide()

func perform_sword_attack() -> void:
	combo_step = (combo_step % 3) + 1
	combo_timer = 0.65
	attack_cooldown = 0.25
	var dmg_mult := 1.5 if combo_step == 3 else (1.2 if combo_step == 2 else 1.0)
	var total_dmg := int(round(sword_damage * dmg_mult))

	for enemy in get_tree().get_nodes_in_group("enemies"):
		if enemy.global_position.distance_to(global_position) <= 68.0:
			enemy.take_damage(total_dmg, false)

func activate_ancient_stone() -> void:
	stone_energy = 0.0
	emit_signal("stone_energy_changed", stone_energy)
	var stone_lvl: int = int(SaveManager.upgrades.get("stone", 1))
	var stone_dmg := 80 + stone_lvl * 25

	for enemy in get_tree().get_nodes_in_group("enemies"):
		if enemy.global_position.distance_to(global_position) <= 260.0:
			enemy.take_damage(stone_dmg, true) # true = Ancient Stone damage (breaks Witch's Curse Barrier!)

func take_damage(amount: int) -> void:
	var final_dmg := int(amount * 0.2) if is_blocking else amount
	current_hp = maxi(0, current_hp - final_dmg)
	emit_signal("health_changed", current_hp, max_hp)
	if current_hp <= 0:
		emit_signal("player_died")
