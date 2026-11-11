extends CharacterBody2D
class_name EnemyBase
## EnemyBase.gd — Base Enemy AI (Patrol, Chase, Attack, Death) for Worlds 1–5

@export var enemy_type: String = "slime"
@export var max_hp: int = 50
@export var contact_damage: int = 12
@export var move_speed: float = 95.0
@export var patrol_range: float = 140.0

var current_hp: int = 50
var start_x: float = 0.0
var direction: int = -1

func _ready() -> void:
	add_to_group("enemies")
	current_hp = max_hp
	start_x = global_position.x

func _physics_process(delta: float) -> void:
	if not is_on_floor() and enemy_type != "bat":
		velocity.y += 900.0 * delta

	velocity.x = direction * move_speed
	if absf(global_position.x - start_x) >= patrol_range:
		direction *= -1

	move_and_slide()

func take_damage(amount: int, _is_stone_power: bool = false) -> void:
	current_hp -= amount
	if current_hp <= 0:
		queue_free()
