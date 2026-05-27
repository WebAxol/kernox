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

Systems use the `dispatchEvent()` method, which passes the event name **as-is** to the EventBroker — no namespace is prepended automatically:

```typescript
class CombatSystem extends System {
  execute() {
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) {
        // Dispatches the literal string "enemyKilled"
        this.dispatchEvent("enemyKilled", {
          enemy: enemy,
          position: enemy.position
        });

        this.enemies.remove(enemy);
      }
    }
  }
}
```

To target a specific addon's listeners, use an explicit namespace:

```typescript
this.dispatchEvent("myAddon.enemyKilled", { enemy });
```

### From the EventBroker Directly

```typescript
const app = new Kernox();

app.eventBroker.dispatch("gameStart", {
  difficulty: "hard"
});
```

### Event Payload

Events can carry any data in the second parameter:

```typescript
// Simple value
this.dispatchEvent("scoreChanged", { score: 1000 });

// Complex object
this.dispatchEvent("playerHit", {
  player: playerEntity,
  damage: 25,
  source: enemyEntity,
  critical: true
});

// No payload
this.dispatchEvent("gameOver", {});
```

## Listening to Events

### In Systems

Use `attachToEvent()` in the `init()` method. The system's addon namespace is prepended automatically unless you provide an explicit `namespace.name` form:

```typescript
class ScoreSystem extends System {
  private score = 0;

  init() {
    // Registers as "myAddon.enemyKilled"
    this.attachToEvent("enemyKilled", this.onEnemyKilled.bind(this));
    this.attachToEvent("itemCollected", this.onItemCollected.bind(this));
  }

  private onEnemyKilled(details: any) {
    this.score += 100;
    this.__kernox.eventBroker.dispatch("scoreChanged", { score: this.score });
  }

  private onItemCollected(details: any) {
    this.score += details.value;
    this.__kernox.eventBroker.dispatch("scoreChanged", { score: this.score });
  }
}
```

### Important: Bind Context

Always use `.bind(this)` when passing methods as event handlers:

```typescript
// Good — 'this' context is preserved
this.attachToEvent("gameStart", this.onGameStart.bind(this));

// Bad — 'this' will be undefined in the handler
this.attachToEvent("gameStart", this.onGameStart);

// Alternative — arrow function
this.attachToEvent("gameStart", (details) => {
  this.onGameStart(details);
});
```

### From the EventBroker Directly

```typescript
const app = new Kernox();

app.eventBroker.attachToEvent("playerDied", (details) => {
  console.log("Player died!", details);
});
```

## Namespace Resolution

### How Namespaces Work for Listeners

When a system calls `attachToEvent("eventName", handler)`, the system's addon namespace is prepended, storing the listener under `"addonName.eventName"`.

When a system calls `dispatchEvent("eventName", details)`, the name is passed **as-is** to `EventBroker.dispatch()`. The broker first looks for an exact match. If none is found, it searches all registered namespaces for `"namespace.eventName"` — if exactly one match exists, it is used. If multiple matches exist, an ambiguity error is thrown.

This means:

```typescript
// In "gameAddon" system:
this.attachToEvent("playerJump", handler);
// Listener stored as: "gameAddon.playerJump"

this.dispatchEvent("playerJump", {});
// Dispatches literal "playerJump"
// EventBroker finds no exact match, resolves to "gameAddon.playerJump" (if unambiguous)
```

### Explicit Namespace

Use explicit namespaces to be unambiguous:

```typescript
// Dispatch to a specific namespace
this.dispatchEvent("myAddon.playerJump", { height: 10 });

// Listen to a specific namespace
this.attachToEvent("otherAddon.enemySpawned", this.onSpawn.bind(this));
```

### Cross-Addon Communication

```typescript
class PhysicsSystem extends System {
  init() {
    // Listen to event from "game" addon explicitly
    this.attachToEvent("game.collision", this.onCollision.bind(this));
  }
}
```

### Ambiguous Events

If multiple addons have listeners registered under the same base event name, dispatching without a namespace throws:

```
Error: Ambiguous event 'shoot' was requested: a namespace must be specified before it
```

**Solution**: Use explicit namespace when dispatching:
```typescript
this.dispatchEvent("player.shoot", {});
```

## Built-in Events

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

## Common Event Patterns

### Pattern 1: Event Chain

```typescript
class SpawnSystem extends System {
  init() {
    this.attachToEvent("enemyKilled", this.onEnemyKilled.bind(this));
  }

  private onEnemyKilled(details: any) {
    if (Math.random() < 0.3) {
      const powerUp = this.spawnPowerUp(details.position);
      this.__kernox.eventBroker.dispatch("powerUpSpawned", { powerUp });
    }
  }
}
```

### Pattern 2: State Changes

```typescript
class PlayerSystem extends System {
  private wasAlive = true;

  execute() {
    if (this.player.hp <= 0 && this.wasAlive) {
      this.wasAlive = false;
      this.__kernox.eventBroker.dispatch("playerDied", {
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
```

### Pattern 3: Command Pattern

```typescript
class InputSystem extends System {
  init() {
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case " ":
          this.__kernox.eventBroker.dispatch("shoot", {});
          break;
        case "Escape":
          this.__kernox.eventBroker.dispatch("pause", {});
          break;
      }
    });
  }
}

class WeaponSystem extends System {
  init() {
    this.attachToEvent("shoot", this.shoot.bind(this));
  }

  private shoot(details: any) {
    if (this.ammo > 0) {
      this.ammo--;
      this.createBullet();
    }
  }
}
```

### Pattern 4: Aggregation

```typescript
class StatsSystem extends System {
  private stats = { enemiesKilled: 0, damageTaken: 0 };

  init() {
    this.attachToEvent("enemyKilled", () => this.stats.enemiesKilled++);
    this.attachToEvent("playerHit", (d) => this.stats.damageTaken += d.damage);
  }
}
```

## Event Best Practices

### 1. Descriptive Names

```typescript
// Good
this.dispatchEvent("playerJumped", {});
this.dispatchEvent("enemySpawned", {});

// Avoid
this.dispatchEvent("update", {});
this.dispatchEvent("event1", {});
```

### 2. Include Relevant Data

```typescript
// Good
this.dispatchEvent("entityDamaged", {
  entity: target,
  damage: amount,
  source: attacker
});

// Bad
this.dispatchEvent("damaged", { amount: 10 });
```

### 3. Avoid Over-Dispatching

Don't fire events every frame unless necessary:

```typescript
// Bad — fires every frame
execute() {
  this.dispatchEvent("playerMoved", { position: this.player.position });
}

// Better — other systems can read player.position directly
execute() {
  this.player.position.x += this.player.velocity.x;
}
```

### 4. Prefer Explicit Namespaces When Dispatching

Since `dispatchEvent()` does not prepend a namespace, using explicit namespaces avoids ambiguity errors when multiple addons are loaded:

```typescript
// Safer in multi-addon apps
this.dispatchEvent("myAddon.enemyKilled", { enemy });
```

## Performance Considerations

Events have minimal overhead, but avoid dispatching inside tight per-entity loops:

```typescript
// Avoid — dispatches once per entity per frame
for (const entity of this.entities) {
  this.dispatchEvent("entityUpdate", { entity });
}

// Better — process entities directly
for (const entity of this.entities) {
  entity.position.x += entity.velocity.x;
}
```

## Troubleshooting

### Event Not Received

**Check**:
1. Event name spelling matches exactly
2. Handler is bound: `.bind(this)`
3. Listener is attached before the event is dispatched
4. Namespaces are consistent — remember `attachToEvent` prepends the addon namespace, but `dispatchEvent` does not

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

**Solution**: Use an explicit namespace when dispatching:
```typescript
this.dispatchEvent("player.shoot", {});
```

## Next Steps

- [Systems](./systems.md) - Learn how systems use events
- [Architecture](./architecture.md) - Understand event flow in the application
- [Addons](./addons.md) - See how namespaces work with addons
