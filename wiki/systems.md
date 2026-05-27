# Systems

## Overview

Systems are where all the logic lives in Kernox. Following the ECS pattern, Systems are classes that process entities from collections each frame. They encapsulate specific behaviors like movement, rendering, collision detection, AI, and more.

## System Class

The base `System` class (`src/system/System.ts`) provides the foundation for all game logic.

### Core Structure

```typescript
class System {
  protected __paused: boolean = false;

  constructor(
    public readonly __kernox: Kernox,
    protected __context: string
  ) {}

  // Lifecycle methods
  init(): void {}      // Called once during setup
  execute(): void {}   // Called every frame

  // Utility properties
  get context(): string;
  get paused(): boolean;
  set paused(state: boolean);

  // Event methods
  attachToEvent(eventName: string, handler: EventHandler): boolean;
  dispatchEvent(eventName: string, details: object): void;

  // Collection access
  getCollection<T>(collectionName: string): T;
}
```

**Location**: `src/system/System.ts`

## Lifecycle

### 1. Construction

Systems are instantiated by the SystemManager when an addon is loaded:

```typescript
const system = new MovementSystem(kernox, "myAddon");
```

**Parameters**:
- `__kernox`: Reference to the main Kernox instance
- `__context`: The addon namespace this system belongs to

### 2. Initialization (init)

Called once immediately after instantiation, before the first frame:

```typescript
class MovementSystem extends System {
  private kinetics!: ArrayList<Kinetic>;

  init() {
    // Retrieve collections
    this.kinetics = this.getCollection("Kinetics");

    // Set up event listeners
    this.attachToEvent("jump", this.onJump.bind(this));
  }
}
```

**Use cases**:
- Retrieve collections from CollectionManager
- Subscribe to events
- Initialize system state
- Set up external resources (DOM elements, WebGL contexts, etc.)

### 3. Execution (execute)

Called every frame by the SystemManager (when not paused):

```typescript
class MovementSystem extends System {
  private kinetics!: ArrayList<Kinetic>;

  execute() {
    for (const entity of this.kinetics) {
      entity.position.x += entity.velocity.x;
      entity.position.y += entity.velocity.y;
    }
  }
}
```

## Creating Systems

### Basic System

```typescript
import { System, ArrayList } from "kernox";
import type { Enemy } from "./prototypes";

class EnemyAISystem extends System {
  private enemies!: ArrayList<Enemy>;

  init() {
    this.enemies = this.getCollection("Enemies");
  }

  execute() {
    for (const enemy of this.enemies) {
      const player = this.getPlayer();
      if (player) {
        this.moveTowards(enemy, player);
      }
    }
  }

  private moveTowards(enemy: Enemy, target: Entity) {
    const dx = target.position.x - enemy.position.x;
    const dy = target.position.y - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      enemy.velocity.x = (dx / distance) * enemy.speed;
      enemy.velocity.y = (dy / distance) * enemy.speed;
    }
  }

  private getPlayer(): Entity | undefined {
    const players = this.getCollection<ArrayList>("Players");
    return players.get(0);
  }
}

export default EnemyAISystem;
```

### System with State

```typescript
class SpawnSystem extends System {
  private enemies!: ArrayList<Enemy>;
  private spawnTimer = 0;
  private spawnInterval = 2000;
  private maxEnemies = 10;

  init() {
    this.enemies = this.getCollection("Enemies");
  }

  execute() {
    const dt = this.__kernox.dt;
    this.spawnTimer += dt;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      if (this.enemies.size() < this.maxEnemies) {
        this.spawnEnemy();
      }
    }
  }

  private spawnEnemy() {
    this.__kernox.entityFactory.create("Enemy", {
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      hp: 50
    });
  }
}
```

### System with Events

```typescript
class CombatSystem extends System {
  private projectiles!: ArrayList<Projectile>;
  private enemies!: ArrayList<Enemy>;

  init() {
    this.projectiles = this.getCollection("Projectiles");
    this.enemies = this.getCollection("Enemies");

    this.attachToEvent("playerShoot", this.onPlayerShoot.bind(this));
  }

  execute() {
    for (const projectile of this.projectiles) {
      for (const enemy of this.enemies) {
        if (this.checkCollision(projectile, enemy)) {
          this.handleHit(projectile, enemy);
        }
      }
    }
  }

  private onPlayerShoot(details: any) {
    const { position, direction } = details;
    this.__kernox.entityFactory.create("Projectile", {
      position: { ...position },
      velocity: {
        x: direction.x * 500,
        y: direction.y * 500
      }
    });
  }

  private handleHit(projectile: Projectile, enemy: Enemy) {
    enemy.hp -= projectile.damage;
    this.projectiles.remove(projectile);

    if (enemy.hp <= 0) {
      this.enemies.remove(enemy);
      this.__kernox.eventBroker.dispatch("enemyKilled", { enemy });
    }
  }
}
```

## System Methods

### getCollection(name)

Retrieves a collection with namespace resolution. The system's own addon namespace is prepended automatically unless you provide an explicit `namespace.name` form.

```typescript
init() {
  // Resolves to "myAddon.Players"
  this.players = this.getCollection("Players");

  // Explicit namespace — accesses another addon's collection
  this.enemies = this.getCollection("otherAddon.Enemies");

  // With type safety
  this.players = this.getCollection<ArrayList<Player>>("Players");
}
```

Throws an error if the collection is not found.

### attachToEvent(eventName, handler)

Subscribes to an event. The system's addon namespace is prepended automatically unless you provide an explicit `namespace.name` form.

```typescript
init() {
  // Registers listener as "myAddon.gameStart"
  this.attachToEvent("gameStart", this.onGameStart.bind(this));

  // Explicit namespace — listens to another addon's event
  this.attachToEvent("input.keyPress", this.onKeyPress.bind(this));
}
```

### dispatchEvent(eventName, details)

Dispatches an event through the EventBroker. The event name is passed **as-is** — no namespace is prepended automatically. Use an explicit `namespace.name` form when targeting a specific addon's listeners.

```typescript
execute() {
  // Dispatches the literal string "gameWon"
  this.dispatchEvent("gameWon", { score: this.score });

  // Dispatches to a specific namespace
  this.dispatchEvent("myAddon.gameWon", { score: this.score });
}
```

### Pausing Systems

Control system execution:

```typescript
// Pause a system
system.paused = true;

// Resume a system
system.paused = false;
```

Paused systems' `execute()` methods are not called.

## SystemManager

The `SystemManager` (`src/system/SystemManager.ts`) manages system registration and execution.

### use(SystemClass, namespace)

Registers and initializes a system. Called automatically by the addon loader.

### unuse(systemName)

Removes a system from the execution list and registry at runtime:

```typescript
app.systemManager.unuse("myAddon.DebugSystem");
```

### get(systemName)

Retrieves a registered system instance by its full namespaced name:

```typescript
const debugSystem = app.systemManager.get<DebugSystem>("myAddon.DebugSystem");
```

Returns `undefined` if not found.

## Accessing Kernox Properties

Systems have access to the main Kernox instance via `this.__kernox`:

```typescript
execute() {
  const frame   = this.__kernox.frame;    // Current frame number
  const dt      = this.__kernox.dt;       // Delta time in milliseconds since last frame
  const fps     = this.__kernox.fps;      // Current FPS
  const paused  = this.__kernox.paused;   // Whether the app is paused
  const started = this.__kernox.started;  // Whether execute() has been called

  // Access managers
  this.__kernox.entityFactory.create("Player");
  this.__kernox.collectionManager.get("Players");
  this.__kernox.eventBroker.dispatch("test", {});
}
```

## Execution Order

Systems execute in the order they are defined in the addon:

```typescript
const gameAddon: KernoAddon = {
  name: "game",
  systems: [
    InputSystem,       // 1st
    AISystem,          // 2nd
    PhysicsSystem,     // 3rd
    CollisionSystem,   // 4th
    AnimationSystem,   // 5th
    RenderSystem       // 6th
  ]
};
```

When multiple addons are loaded, systems from all addons execute in the order they were registered across all `app.use()` calls.

## Common Patterns

### Pattern 1: Input System

```typescript
class InputSystem extends System {
  private keys = new Set<string>();
  private player!: Player;

  init() {
    const players = this.getCollection<ArrayList<Player>>("Players");
    this.player = players.get(0);

    window.addEventListener("keydown", (e) => this.keys.add(e.key));
    window.addEventListener("keyup", (e) => this.keys.delete(e.key));
  }

  execute() {
    const speed = 5;

    if (this.keys.has("ArrowLeft")) this.player.velocity.x = -speed;
    else if (this.keys.has("ArrowRight")) this.player.velocity.x = speed;
    else this.player.velocity.x = 0;

    if (this.keys.has("ArrowUp")) this.player.velocity.y = -speed;
    else if (this.keys.has("ArrowDown")) this.player.velocity.y = speed;
    else this.player.velocity.y = 0;
  }
}
```

### Pattern 2: Rendering System

```typescript
class RenderSystem extends System {
  private renderables!: ArrayList<Sprite>;
  private ctx!: CanvasRenderingContext2D;

  init() {
    this.renderables = this.getCollection("Renderables");
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.ctx = canvas.getContext("2d")!;
  }

  execute() {
    this.ctx.clearRect(0, 0, 800, 600);

    const sorted = this.renderables.asArray();
    sorted.sort((a, b) => a.depth - b.depth);

    for (const sprite of sorted) {
      this.drawSprite(sprite);
    }
  }
}
```

### Pattern 3: Timer System

```typescript
class TimerSystem extends System {
  private elapsed = 0;

  execute() {
    this.elapsed += this.__kernox.dt;

    if (this.elapsed >= 1000) {
      this.elapsed -= 1000;
      this.__kernox.eventBroker.dispatch("secondElapsed", {});
    }
  }
}
```

### Pattern 4: Cleanup System

```typescript
class CleanupSystem extends System {
  private projectiles!: ArrayList<Projectile>;

  init() {
    this.projectiles = this.getCollection("Projectiles");
  }

  execute() {
    const toRemove = this.projectiles.filter(e => e.shouldDestroy);
    for (const entity of toRemove) {
      this.__kernox.entityFactory.sendToRest(entity);
    }
  }
}
```

## Performance Tips

### 1. Cache Collection References

```typescript
// Good — cache in init()
init() {
  this.players = this.getCollection("Players");
}

// Bad — fetches every frame
execute() {
  const players = this.getCollection("Players");
}
```

### 2. Early Exit

```typescript
execute() {
  if (this.enemies.size() === 0) return;
  // ...
}
```

### 3. Throttling

```typescript
class ExpensiveSystem extends System {
  private timer = 0;
  private interval = 100;

  execute() {
    this.timer += this.__kernox.dt;
    if (this.timer >= this.interval) {
      this.timer -= this.interval;
      this.doExpensiveWork();
    }
  }
}
```

## Best Practices

### 1. Single Responsibility

```typescript
// Good
class MovementSystem extends System { /* Only movement */ }
class RenderSystem extends System { /* Only rendering */ }

// Avoid
class GameSystem extends System { /* Everything */ }
```

### 2. Initialize in init()

```typescript
// Good
init() {
  this.players = this.getCollection("Players");
}

// Avoid
execute() {
  if (!this.initialized) {
    this.players = this.getCollection("Players");
    this.initialized = true;
  }
}
```

### 3. Type Your Collections

```typescript
init() {
  this.players = this.getCollection<ArrayList<Player>>("Players");
}
```

## Troubleshooting

### System Not Executing

**Check**:
1. Is system registered in addon's `systems` array?
2. Is `app.execute()` called?
3. Is system paused? Check `system.paused`

### Collection Not Found

```
Error: Collection 'Players' is not registered.
```

**Solution**: Ensure collection is registered before systems are initialized.

### Event Not Received

**Check**:
1. Is event name spelled correctly?
2. Is the listener registered with the correct namespace?
3. Is handler bound correctly? Use `.bind(this)`

## Next Steps

- [Events](./events.md) - Learn about event-driven communication
- [Collections](./collections.md) - Understand how to work with entity collections
- [Entities](./entities.md) - See how to create and manage entities
- [Architecture](./architecture.md) - Understand the overall system design
