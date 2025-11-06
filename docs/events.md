# Events

## Overview

The event system in Kernox provides a decoupled communication mechanism between systems. Instead of systems directly calling each other's methods, they communicate by dispatching and listening to events through the `EventBroker`. This creates a flexible, maintainable architecture where systems remain independent.

## EventBroker

The `EventBroker` (`src/event/EventBroker.ts`) is a centralized pub/sub (publish-subscribe) system that manages event distribution.

### Core Methods

```typescript
class EventBroker {
  // Dispatch an event to all listeners
  dispatch(eventName: string, detail?: any): boolean;

  // Subscribe a handler to an event
  attachToEvent(eventName: string, handler: EventHandler): boolean;
}

type EventHandler = (event: any) => void;
```

**Location**: `src/event/EventBroker.ts`

## Dispatching Events

### From Systems

Systems use the `dispatchEvent()` method:

```typescript
class CombatSystem extends System {
  execute() {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) {
        this.dispatchEvent("enemyKilled", {
          enemy: enemy,
          position: enemy.position,
          score: enemy.scoreValue
        });

        this.enemies.remove(enemy);
      }
    }
  }
}
```

### From Kernox Instance

Directly from the EventBroker:

```typescript
const app = new Kernox();

// Dispatch a global event
app.eventBroker.dispatch("gameStart", {
  difficulty: "hard",
  playerName: "Hero"
});
```

### Event Payload

Events can carry any data in the `details` parameter:

```typescript
// Simple value
this.dispatchEvent("scoreChanged", { score: 1000 });

// Complex object
this.dispatchEvent("playerHit", {
  player: playerEntity,
  damage: 25,
  source: enemyEntity,
  timestamp: Date.now(),
  critical: true
});

// No payload
this.dispatchEvent("gameOver", {});
```

## Listening to Events

### In Systems

Use `attachToEvent()` in the `init()` method:

```typescript
class ScoreSystem extends System {
  private score = 0;

  init() {
    // Attach listeners
    this.attachToEvent("enemyKilled", this.onEnemyKilled.bind(this));
    this.attachToEvent("itemCollected", this.onItemCollected.bind(this));
  }

  private onEnemyKilled(details: any) {
    this.score += details.score;
    console.log(`Score: ${this.score}`);

    this.dispatchEvent("scoreChanged", { score: this.score });
  }

  private onItemCollected(details: any) {
    this.score += details.value;
    this.dispatchEvent("scoreChanged", { score: this.score });
  }
}
```

### Important: Bind Context

Always use `.bind(this)` when passing methods as event handlers:

```typescript
// Good - 'this' context is preserved
this.attachToEvent("gameStart", this.onGameStart.bind(this));

// Bad - 'this' will be undefined in the handler
this.attachToEvent("gameStart", this.onGameStart);

// Alternative - Arrow function
this.attachToEvent("gameStart", (details) => {
  this.onGameStart(details);
});
```

### From EventBroker

Subscribe directly:

```typescript
const app = new Kernox();

app.eventBroker.attachToEvent("playerDied", (details) => {
  console.log("Player died!", details);
  // Show game over screen
});
```

## Namespace Resolution

Events support namespaces to prevent conflicts between addons.

### Explicit Namespace

```typescript
// Dispatch with namespace
this.dispatchEvent("myAddon.playerJump", { height: 10 });

// Listen with namespace
this.attachToEvent("otherAddon.enemySpawned", this.onSpawn.bind(this));
```

### Implicit Namespace

Systems automatically use their addon's context:

```typescript
// In a system from "gameAddon"
this.dispatchEvent("playerJump", {});
// Actually dispatches: "gameAddon.playerJump"

this.attachToEvent("playerJump", handler);
// Actually listens to: "gameAddon.playerJump"
```

### Cross-Addon Communication

Listen to events from other addons using explicit namespaces:

```typescript
// In "physics" addon
class PhysicsSystem extends System {
  init() {
    // Listen to event from "game" addon
    this.attachToEvent("game.collision", this.onCollision.bind(this));
  }

  private onCollision(details: any) {
    // React to collision from game addon
    this.applyImpact(details.entity, details.force);
  }
}
```

### Ambiguous Events

If multiple addons define the same event name, you must use explicit namespaces:

```typescript
// Error: Multiple addons have "shoot" event
this.attachToEvent("shoot", handler);

// Fixed: Use explicit namespace
this.attachToEvent("player.shoot", handler);
this.attachToEvent("enemy.shoot", handler);
```

## Built-in Events

Kernox dispatches some events automatically:

### `__start`

Fired once when `app.execute()` is first called:

```typescript
class GameSystem extends System {
  init() {
    this.attachToEvent("__start", () => {
      console.log("Application started!");
      this.initializeGame();
    });
  }
}
```

### Custom Built-ins

You can create your own lifecycle events:

```typescript
class GameStateSystem extends System {
  private state = "menu";

  init() {
    // Listen to start event
    this.attachToEvent("__start", () => {
      this.dispatchEvent("gameReady", {});
    });
  }

  startGame() {
    this.state = "playing";
    this.dispatchEvent("gameStarted", {});
  }

  endGame() {
    this.state = "gameOver";
    this.dispatchEvent("gameEnded", { score: this.score });
  }
}
```

## Common Event Patterns

### Pattern 1: Event Chain

One event triggers another:

```typescript
class SpawnSystem extends System {
  init() {
    this.attachToEvent("enemyKilled", this.onEnemyKilled.bind(this));
  }

  private onEnemyKilled(details: any) {
    // Spawn power-up when enemy dies
    if (Math.random() < 0.3) {
      const powerUp = this.spawnPowerUp(details.position);
      this.dispatchEvent("powerUpSpawned", { powerUp });
    }
  }
}

class EffectsSystem extends System {
  init() {
    this.attachToEvent("powerUpSpawned", this.onPowerUpSpawned.bind(this));
  }

  private onPowerUpSpawned(details: any) {
    // Create visual effect
    this.createSparkles(details.powerUp.position);
  }
}
```

### Pattern 2: State Changes

Notify state transitions:

```typescript
class PlayerSystem extends System {
  private health = 100;

  execute() {
    if (this.health <= 0 && this.wasAlive) {
      this.wasAlive = false;
      this.dispatchEvent("playerDied", {
        position: this.player.position
      });
    }
  }
}

class UISystem extends System {
  init() {
    this.attachToEvent("playerDied", () => {
      this.showGameOverScreen();
    });
  }
}

class AudioSystem extends System {
  init() {
    this.attachToEvent("playerDied", () => {
      this.playSound("death");
    });
  }
}
```

### Pattern 3: Command Pattern

Use events as commands:

```typescript
class InputSystem extends System {
  init() {
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case " ":
          this.dispatchEvent("shoot", {});
          break;
        case "r":
          this.dispatchEvent("reload", {});
          break;
        case "Escape":
          this.dispatchEvent("pause", {});
          break;
      }
    });
  }
}

class WeaponSystem extends System {
  init() {
    this.attachToEvent("shoot", this.shoot.bind(this));
    this.attachToEvent("reload", this.reload.bind(this));
  }

  private shoot(details: any) {
    if (this.ammo > 0) {
      this.ammo--;
      this.createBullet();
    }
  }

  private reload(details: any) {
    this.ammo = this.maxAmmo;
    this.dispatchEvent("reloadComplete", {});
  }
}
```

### Pattern 4: Aggregation

Collect data from multiple systems:

```typescript
class StatsSystem extends System {
  private stats = {
    enemiesKilled: 0,
    itemsCollected: 0,
    damageTaken: 0
  };

  init() {
    this.attachToEvent("enemyKilled", () => this.stats.enemiesKilled++);
    this.attachToEvent("itemCollected", () => this.stats.itemsCollected++);
    this.attachToEvent("playerHit", (d) => this.stats.damageTaken += d.damage);

    this.attachToEvent("gameOver", () => {
      this.dispatchEvent("finalStats", { stats: this.stats });
    });
  }
}
```

### Pattern 5: Event Queue

Defer processing to next frame:

```typescript
class EventQueueSystem extends System {
  private queue: Array<{ event: string; details: any }> = [];

  init() {
    this.attachToEvent("deferredAction", (details) => {
      this.queue.push({
        event: details.eventName,
        details: details.data
      });
    });
  }

  execute() {
    // Process all queued events
    while (this.queue.length > 0) {
      const { event, details } = this.queue.shift()!;
      this.dispatchEvent(event, details);
    }
  }
}
```

## Event Best Practices

### 1. Descriptive Names

Use clear, action-based names:

```typescript
// Good
this.dispatchEvent("playerJumped", {});
this.dispatchEvent("enemySpawned", {});
this.dispatchEvent("itemCollected", {});
this.dispatchEvent("gameOver", {});

// Avoid
this.dispatchEvent("update", {});
this.dispatchEvent("thing", {});
this.dispatchEvent("event1", {});
```

### 2. Include Relevant Data

Provide all necessary information:

```typescript
// Good - Complete information
this.dispatchEvent("entityDamaged", {
  entity: target,
  damage: amount,
  source: attacker,
  damageType: "fire",
  critical: isCritical
});

// Bad - Insufficient data
this.dispatchEvent("damaged", { amount: 10 });
```

### 3. Document Events

Comment your events:

```typescript
/**
 * Fired when a player collects an item
 * @event itemCollected
 * @param {Entity} player - The player entity
 * @param {Entity} item - The collected item
 * @param {string} itemType - Type of item collected
 * @param {number} value - Point value of the item
 */
this.dispatchEvent("itemCollected", {
  player,
  item,
  itemType: item.type,
  value: item.points
});
```

### 4. Avoid Over-Dispatching

Don't fire events every frame unless necessary:

```typescript
// Bad - Fires every frame
execute() {
  this.dispatchEvent("playerMoved", { position: this.player.position });
}

// Good - Only when significant
execute() {
  if (this.player.position.x !== this.lastX) {
    this.dispatchEvent("playerMoved", { position: this.player.position });
    this.lastX = this.player.position.x;
  }
}

// Better - Use direct access instead
execute() {
  // Other systems can just read player.position directly
  this.player.position.x += this.player.velocity.x;
}
```

### 5. Type-Safe Events

Define event types for TypeScript:

```typescript
// Event type definitions
type GameEvents = {
  playerDied: { player: Player; position: Vector2D };
  enemyKilled: { enemy: Enemy; score: number };
  itemCollected: { item: Item; player: Player };
};

// Type-safe dispatch
class CombatSystem extends System {
  private dispatchTypedEvent<K extends keyof GameEvents>(
    event: K,
    details: GameEvents[K]
  ) {
    this.dispatchEvent(event, details);
  }

  execute() {
    // TypeScript will check the details object
    this.dispatchTypedEvent("enemyKilled", {
      enemy: enemyEntity,
      score: 100
    });
  }
}
```

## Performance Considerations

### Event Overhead

Events have minimal overhead, but consider:

```typescript
// Fast - Few listeners, infrequent events
this.dispatchEvent("gameOver", {});

// Slower - Many listeners, every frame
for (const entity of this.entities) {
  this.dispatchEvent("entityUpdate", { entity });  // Avoid!
}
```

### Event Listener Count

Keep listener count reasonable:

```typescript
// Good - Few targeted listeners
this.attachToEvent("playerDied", handler1);
this.attachToEvent("enemySpawned", handler2);

// Bad - Hundreds of listeners
for (let i = 0; i < 1000; i++) {
  this.attachToEvent("update", handlers[i]);  // Too many!
}
```

### Memory Leaks

Event handlers are stored as references. Systems are typically long-lived, so this isn't usually an issue. But be careful with dynamic systems:

```typescript
// If you create/destroy systems dynamically, handlers remain
// For long-running apps, consider implementing detachFromEvent()
```

## Debugging Events

### Log Events

```typescript
class DebugSystem extends System {
  init() {
    const events = [
      "playerDied",
      "enemyKilled",
      "itemCollected",
      "gameOver"
    ];

    for (const event of events) {
      this.attachToEvent(event, (details) => {
        console.log(`[Event] ${event}`, details);
      });
    }
  }
}
```

### Event Monitor

```typescript
class EventMonitorSystem extends System {
  private eventLog: Array<{ event: string; details: any; time: number }> = [];

  init() {
    // Monkey-patch dispatch to log all events
    const original = this.__kernox.eventBroker.dispatch.bind(
      this.__kernox.eventBroker
    );

    this.__kernox.eventBroker.dispatch = (event: string, details: any) => {
      this.eventLog.push({
        event,
        details,
        time: Date.now()
      });

      return original(event, details);
    };
  }

  getLog() {
    return this.eventLog;
  }
}
```

## Comparison with Direct Calls

### Using Events (Decoupled)

```typescript
class CombatSystem extends System {
  execute() {
    if (enemy.hp <= 0) {
      // Don't know who's listening, don't care
      this.dispatchEvent("enemyKilled", { enemy });
    }
  }
}

class ScoreSystem extends System {
  init() {
    this.attachToEvent("enemyKilled", (d) => this.score += 100);
  }
}

class QuestSystem extends System {
  init() {
    this.attachToEvent("enemyKilled", (d) => this.checkQuests(d.enemy));
  }
}

// Easy to add more systems that react to enemy deaths
```

### Direct Calls (Coupled)

```typescript
class CombatSystem extends System {
  constructor(
    kernox: Kernox,
    private scoreSystem: ScoreSystem,  // Tight coupling
    private questSystem: QuestSystem   // Tight coupling
  ) {
    super(kernox, "game");
  }

  execute() {
    if (enemy.hp <= 0) {
      // Must know about all dependent systems
      this.scoreSystem.addScore(100);
      this.questSystem.checkQuest(enemy);
    }
  }
}

// Hard to add new systems without modifying CombatSystem
```

## When to Use Events vs. Direct Access

### Use Events For:

- Cross-system notifications
- One-to-many communication
- State change announcements
- Decoupled architectures
- Plugin systems

### Use Direct Access For:

- Reading entity properties
- Accessing collections
- Performance-critical paths
- Frame-by-frame updates

```typescript
// Events - Good for notifications
this.dispatchEvent("playerDied", { player });

// Direct access - Good for continuous updates
execute() {
  for (const entity of this.kinetics) {
    entity.position.x += entity.velocity.x;  // Direct access
  }
}
```

## Troubleshooting

### Event Not Received

**Check**:
1. Event name spelling matches
2. Handler is bound: `.bind(this)`
3. Listener attached before event dispatched
4. Namespaces match (or use explicit namespace)

### Handler 'this' is undefined

```typescript
// Wrong
this.attachToEvent("test", this.handler);

// Fixed
this.attachToEvent("test", this.handler.bind(this));
```

### Event Ambiguity Error

```
Error: Ambiguous event 'shoot' was requested
```

**Solution**: Use explicit namespace:
```typescript
this.attachToEvent("player.shoot", handler);
```

## Next Steps

- [Systems](./systems.md) - Learn how systems use events
- [Architecture](./architecture.md) - Understand event flow in the application
- [Addons](./addons.md) - See how namespaces work with addons
