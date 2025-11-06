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
- `__context`: Namespace from the addon

### 2. Initialization (init)

Called once after all systems are instantiated but before the first frame:

```typescript
class MovementSystem extends System {
  private kinetics!: ArrayList<Kinetic>;

  init() {
    // Retrieve collections
    this.kinetics = this.getCollection("Kinetics");

    // Set up event listeners
    this.attachToEvent("jump", this.onJump.bind(this));

    // Initialize state
    console.log("MovementSystem initialized");
  }
}
```

**Use cases**:
- Retrieve collections from CollectionManager
- Subscribe to events
- Initialize system state
- Set up external resources (DOM elements, WebGL contexts, etc.)

### 3. Execution (execute)

Called every frame (typically 60 FPS) by the SystemManager:

```typescript
class MovementSystem extends System {
  private kinetics!: ArrayList<Kinetic>;

  execute() {
    // Process all kinetic entities
    for (const entity of this.kinetics) {
      entity.position.x += entity.velocity.x;
      entity.position.y += entity.velocity.y;
    }
  }
}
```

**Use cases**:
- Update entity state
- Process game logic
- Render graphics
- Handle input
- Dispatch events

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
      // Simple AI: move towards player
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
  private spawnInterval = 2000;  // 2 seconds
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
    const enemy = this.__kernox.entityFactory.create("Enemy", {
      position: this.getRandomPosition(),
      hp: 50
    });

    this.dispatchEvent("enemySpawned", { enemy });
  }

  private getRandomPosition() {
    return {
      x: Math.random() * 800,
      y: Math.random() * 600
    };
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

    // Listen to player shoot event
    this.attachToEvent("playerShoot", this.onPlayerShoot.bind(this));
  }

  execute() {
    // Check collisions
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

    const projectile = this.__kernox.entityFactory.create("Projectile", {
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
      this.dispatchEvent("enemyKilled", { enemy });
    }
  }

  private checkCollision(a: Entity, b: Entity): boolean {
    // Collision detection logic
    return false;
  }
}
```

### System with Multiple Collections

```typescript
class PhysicsSystem extends System {
  private kinetics!: ArrayList<Kinetic>;
  private collidables!: ArrayList<Collidable>;
  private gravity = { x: 0, y: 9.8 };

  init() {
    this.kinetics = this.getCollection("Kinetics");
    this.collidables = this.getCollection("Collidables");
  }

  execute() {
    const dt = this.__kernox.dt / 1000;  // Convert to seconds

    // Apply gravity and velocity
    for (const entity of this.kinetics) {
      entity.velocity.x += this.gravity.x * dt;
      entity.velocity.y += this.gravity.y * dt;

      entity.position.x += entity.velocity.x * dt;
      entity.position.y += entity.velocity.y * dt;
    }

    // Handle collisions
    this.resolveCollisions();
  }

  private resolveCollisions() {
    for (let i = 0; i < this.collidables.size(); i++) {
      for (let j = i + 1; j < this.collidables.size(); j++) {
        const a = this.collidables.get(i);
        const b = this.collidables.get(j);

        if (this.checkCollision(a, b)) {
          this.separateEntities(a, b);
        }
      }
    }
  }

  private checkCollision(a: Entity, b: Entity): boolean {
    // Implementation
    return false;
  }

  private separateEntities(a: Entity, b: Entity) {
    // Implementation
  }
}
```

## System Methods

### getCollection(name)

Retrieves a collection with namespace resolution:

```typescript
init() {
  // Implicit namespace (uses system's context)
  this.players = this.getCollection("Players");

  // Explicit namespace
  this.enemies = this.getCollection("otherAddon.Enemies");

  // With type safety
  this.players = this.getCollection<ArrayList<Player>>("Players");
}
```

Throws an error if collection is not found.

### attachToEvent(eventName, handler)

Subscribes to an event:

```typescript
init() {
  // Listen to events in same context
  this.attachToEvent("gameStart", this.onGameStart.bind(this));

  // Listen to events from other contexts
  this.attachToEvent("input.keyPress", this.onKeyPress.bind(this));
}

private onGameStart(details: any) {
  console.log("Game started!", details);
}

private onKeyPress(details: any) {
  console.log("Key pressed:", details.key);
}
```

### dispatchEvent(eventName, details)

Emits an event to all listeners:

```typescript
execute() {
  if (this.checkVictory()) {
    this.dispatchEvent("gameWon", {
      score: this.score,
      time: this.elapsedTime
    });
  }
}
```

### Pausing Systems

Control system execution:

```typescript
// Pause a system
system.paused = true;

// Resume a system
system.paused = false;

// Check if paused
if (system.paused) {
  console.log("System is paused");
}
```

Paused systems' `execute()` methods are not called.

## Accessing Kernox Properties

Systems have access to the main Kernox instance via `this.__kernox`:

```typescript
execute() {
  // Current frame number
  const frame = this.__kernox.frame;

  // Delta time (milliseconds since last frame)
  const dt = this.__kernox.dt;

  // Current FPS
  const fps = this.__kernox.fps;

  // Is app paused?
  const paused = this.__kernox.paused;

  // Has execution started?
  const started = this.__kernox.started;

  // Access managers
  const entity = this.__kernox.entityFactory.create("Player");
  const collection = this.__kernox.collectionManager.get("Players");
  this.__kernox.eventBroker.dispatch("test", {});
}
```

## Execution Order

Systems execute in the order they are defined in the addon:

```typescript
const gameAddon: KernoAddon = {
  name: "game",
  systems: [
    InputSystem,       // 1st - Handle input
    AISystem,          // 2nd - Update AI
    PhysicsSystem,     // 3rd - Apply physics
    CollisionSystem,   // 4th - Resolve collisions
    AnimationSystem,   // 5th - Update animations
    RenderSystem       // 6th - Render everything
  ]
};
```

**Best Practice**: Order systems by their dependencies:
1. Input handling
2. Game logic / AI
3. Physics
4. Collision resolution
5. Animation updates
6. Rendering

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

    if (this.keys.has(" ")) {
      this.dispatchEvent("playerShoot", {
        position: this.player.position,
        direction: { x: 1, y: 0 }
      });
    }
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
    // Clear canvas
    this.ctx.clearRect(0, 0, 800, 600);

    // Sort by depth
    const sorted = this.renderables.asArray();
    sorted.sort((a, b) => a.depth - b.depth);

    // Render all sprites
    for (const sprite of sorted) {
      this.drawSprite(sprite);
    }
  }

  private drawSprite(sprite: Sprite) {
    const img = this.getImage(sprite.url);
    if (img) {
      this.ctx.drawImage(
        img,
        sprite.position.x,
        sprite.position.y,
        sprite.dimensions.x,
        sprite.dimensions.y
      );
    }
  }

  private getImage(url: string): HTMLImageElement | null {
    // Image caching logic
    return null;
  }
}
```

### Pattern 3: Timer System

```typescript
class TimerSystem extends System {
  private elapsed = 0;
  private gameTime = 0;
  private isPaused = false;

  init() {
    this.attachToEvent("gamePause", () => this.isPaused = true);
    this.attachToEvent("gameResume", () => this.isPaused = false);
  }

  execute() {
    if (!this.isPaused) {
      const dt = this.__kernox.dt;
      this.gameTime += dt;
      this.elapsed += dt;

      // Every second
      if (this.elapsed >= 1000) {
        this.elapsed -= 1000;
        this.dispatchEvent("secondElapsed", {
          gameTime: this.gameTime
        });
      }
    }
  }
}
```

### Pattern 4: State Machine System

```typescript
enum GameState {
  Menu,
  Playing,
  Paused,
  GameOver
}

class GameStateSystem extends System {
  private state = GameState.Menu;

  init() {
    this.attachToEvent("startGame", () => this.setState(GameState.Playing));
    this.attachToEvent("pauseGame", () => this.setState(GameState.Paused));
    this.attachToEvent("resumeGame", () => this.setState(GameState.Playing));
    this.attachToEvent("gameOver", () => this.setState(GameState.GameOver));
  }

  execute() {
    switch (this.state) {
      case GameState.Menu:
        this.updateMenu();
        break;
      case GameState.Playing:
        this.updateGame();
        break;
      case GameState.Paused:
        // Don't update
        break;
      case GameState.GameOver:
        this.updateGameOver();
        break;
    }
  }

  private setState(newState: GameState) {
    this.state = newState;
    this.dispatchEvent("stateChanged", { state: newState });
  }

  private updateMenu() { /* ... */ }
  private updateGame() { /* ... */ }
  private updateGameOver() { /* ... */ }
}
```

### Pattern 5: Cleanup System

```typescript
class CleanupSystem extends System {
  private all!: ArrayList[];

  init() {
    this.all = [
      this.getCollection("Projectiles"),
      this.getCollection("Enemies"),
      this.getCollection("Effects")
    ];
  }

  execute() {
    for (const collection of this.all) {
      const toRemove = collection.filter(e => e.shouldDestroy);

      for (const entity of toRemove) {
        collection.remove(entity);
        this.dispatchEvent("entityDestroyed", { entity });
      }
    }
  }
}
```

## Performance Tips

### 1. Cache Collection References

```typescript
// Good - Cache in init()
init() {
  this.players = this.getCollection("Players");
}

execute() {
  for (const player of this.players) { /* ... */ }
}

// Bad - Fetch every frame
execute() {
  const players = this.getCollection("Players");
  for (const player of players) { /* ... */ }
}
```

### 2. Early Exit

```typescript
execute() {
  // Skip if collection is empty
  if (this.enemies.size() === 0) return;

  // Skip if not enough time passed
  if (this.__kernox.dt < this.minFrameTime) return;

  // Process...
}
```

### 3. Throttling

```typescript
class ExpensiveSystem extends System {
  private timer = 0;
  private interval = 100;  // Run every 100ms

  execute() {
    this.timer += this.__kernox.dt;

    if (this.timer >= this.interval) {
      this.timer -= this.interval;
      this.doExpensiveWork();
    }
  }
}
```

### 4. Spatial Partitioning

For collision detection with many entities:

```typescript
class CollisionSystem extends System {
  private grid = new SpatialGrid(64);  // 64px cells

  execute() {
    // Only check nearby entities
    for (const entity of this.collidables) {
      const nearby = this.grid.getNearby(entity.position);

      for (const other of nearby) {
        if (this.checkCollision(entity, other)) {
          this.handleCollision(entity, other);
        }
      }
    }
  }
}
```

## Best Practices

### 1. Single Responsibility

Each system should handle one specific concern:

```typescript
// Good - Focused systems
class MovementSystem extends System { /* Only movement */ }
class RenderSystem extends System { /* Only rendering */ }
class CollisionSystem extends System { /* Only collisions */ }

// Avoid - God system
class GameSystem extends System {
  // Movement, rendering, collision, AI, everything...
}
```

### 2. Use Events for Communication

```typescript
// Good - Systems communicate via events
class SpawnSystem extends System {
  execute() {
    if (this.shouldSpawn()) {
      const enemy = this.spawnEnemy();
      this.dispatchEvent("enemySpawned", { enemy });
    }
  }
}

class ScoreSystem extends System {
  init() {
    this.attachToEvent("enemyKilled", this.onEnemyKilled.bind(this));
  }

  private onEnemyKilled(details: any) {
    this.score += 100;
  }
}
```

### 3. Initialize in init()

```typescript
// Good
init() {
  this.players = this.getCollection("Players");
  this.attachToEvent("gameStart", this.onGameStart.bind(this));
}

// Avoid - Initialization in execute()
execute() {
  if (!this.initialized) {
    this.players = this.getCollection("Players");
    this.initialized = true;
  }
}
```

### 4. Keep execute() Fast

```typescript
// Good - Fast iteration
execute() {
  for (const entity of this.collection) {
    entity.position.x += entity.velocity.x;
  }
}

// Avoid - Heavy work every frame
execute() {
  for (const entity of this.collection) {
    this.doComplexCalculation();     // Too slow!
    this.loadResourceFromDisk();     // Way too slow!
  }
}
```

### 5. Type Your Collections

```typescript
// Good - Type safety
init() {
  this.players = this.getCollection<ArrayList<Player>>("Players");
}

execute() {
  for (const player of this.players) {
    player.hp += 1;  // TypeScript knows about 'hp'
  }
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
Error: Collection 'Players' was not found
```

**Solution**: Ensure collection is registered before systems init.

### Event Not Received

**Check**:
1. Is event name spelled correctly?
2. Is event being dispatched in correct namespace?
3. Is handler bound correctly? Use `.bind(this)`

## Next Steps

- [Events](./events.md) - Learn about event-driven communication
- [Collections](./collections.md) - Understand how to work with entity collections
- [Entities](./entities.md) - See how to create and manage entities
- [Architecture](./architecture.md) - Understand the overall system design
