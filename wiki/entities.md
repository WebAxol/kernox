# Entities and Prototypes

## Overview

Entities are the fundamental objects in Kernox applications. They represent anything that exists in your application: players, enemies, projectiles, UI elements, etc. Unlike traditional OOP, entities in Kernox are data containers without behavior - all logic is handled by Systems.

## Entity Class

The `Entity` class (`src/entity/Entity.ts`) is the base class for all entities. It provides:

- **Unique ID**: Each entity has an auto-generated string ID
- **Type**: The prototype name used to create the entity
- **Collection membership**: Tracks which collections contain this entity
- **Child entities**: Support for entity hierarchies

### Core Methods

```typescript
class Entity {
  get id(): string;              // Unique identifier
  get type(): string;            // Prototype name

  belongsTo(name: string): boolean;        // Check collection membership
  collections(): Set<string>;               // Get all collections

  linkTo(collectionName: string): void;     // Add to collection
  unlinkFrom(collectionName: string): void; // Remove from collection

  appendChild(name: string, child: Entity): void;  // Add child entity
  getChild(name: string): Entity | undefined;      // Retrieve child
  deleteChild(name: string): void;                  // Remove child
}
```

## Prototypes

Prototypes are templates that define entity types. They specify:

1. **Attributes**: The properties an entity will have
2. **Collections**: Which collections the entity should belong to
3. **Inheritance**: Other prototypes to inherit from

### PrototypeSchema Interface

```typescript
interface PrototypeSchema<T> {
  name: string;                    // Unique type name
  attributes: T;                    // Default attribute values
  collections?: Set<string>;        // Collection names
  inherits?: PrototypeSchema<any>[]; // Parent prototypes
}
```

## Defining Prototypes

### Simple Prototype

```typescript
import type { Entity, PrototypeSchema } from "kernox";

// Define the entity interface (optional but recommended for TypeScript)
interface Player extends Entity {
  hp: number;
  level: number;
  name: string;
}

// Define the prototype
const playerPrototype: PrototypeSchema<Player> = {
  name: "Player",
  attributes: {
    hp: 100,
    level: 1,
    name: "Unnamed"
  } as Player,
  collections: new Set(["Players"])
};
```

### Prototype with Multi-Inheritance

Kernox supports multiple inheritance, allowing you to compose entities from multiple base prototypes:

```typescript
import type { Entity, PrototypeSchema } from "kernox";

// Define base prototypes
interface Kinetic extends Entity {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
}

const kineticPrototype: PrototypeSchema<Kinetic> = {
  name: "Kinetic",
  attributes: {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }
  } as Kinetic,
  collections: new Set(["Kinetics"])
};

interface Sprite extends Entity {
  position: { x: number; y: number };
  dimensions: { x: number; y: number };
  url: string;
}

const spritePrototype: PrototypeSchema<Sprite> = {
  name: "Sprite",
  attributes: {
    position: { x: 0, y: 0 },
    dimensions: { x: 32, y: 32 },
    url: "/assets/default.png"
  } as Sprite,
  collections: new Set(["Renderables"])
};

// Combine prototypes through inheritance
interface Player extends Kinetic, Sprite {
  hp: number;
  level: number;
}

const playerPrototype: PrototypeSchema<Player> = {
  name: "Player",
  attributes: {
    hp: 100,
    level: 1
  } as Player,
  collections: new Set(["Players"]),
  inherits: [kineticPrototype, spritePrototype]
};

// The resulting Player entity will have:
// - position, velocity (from Kinetic)
// - dimensions, url (from Sprite)
// - hp, level (from Player)
// And will be in collections: Kinetics, Renderables, Players
```

### Inheritance Resolution

When multiple parent prototypes define the same attribute:

1. Child prototype attributes take precedence
2. Later parents override earlier parents
3. All collections from parents are merged with the child's collections

## Registering Prototypes

Before creating entities, you must register prototypes with the EntityFactory:

```typescript
import { Kernox } from "kernox";

const app = new Kernox();

// Register a single prototype
app.entityFactory.prototype(playerPrototype);

// Or register with an explicit namespace
app.entityFactory.prototype(playerPrototype, "myGame");
```

Usually, prototypes are registered automatically when using the addon system:

```typescript
import type { KernoAddon } from "kernox";

const gameAddon: KernoAddon = {
  name: "myGame",
  prototypes: [
    kineticPrototype,
    spritePrototype,
    playerPrototype
  ]
};

app.use(gameAddon);  // Automatically registers all prototypes
```

## Creating Entities

Once a prototype is registered, create entities using the EntityFactory:

### Basic Creation

```typescript
// Create with default values
const player = app.entityFactory.create("Player");

// Create with custom values
const player = app.entityFactory.create("Player", {
  hp: 150,
  level: 5,
  name: "Hero"
});
```

### With Namespaces

If using namespaced addons:

```typescript
// Explicit namespace
const player = app.entityFactory.create("myGame.Player", { hp: 150 });

// Implicit namespace (works if unambiguous)
const player = app.entityFactory.create("Player", { hp: 150 });
```

### Type Safety

Use TypeScript generics for type-safe entity access:

```typescript
interface Player extends Entity {
  hp: number;
  level: number;
}

const player = app.entityFactory.create<Player>("Player", {
  hp: 150,
  level: 5
});

console.log(player.hp);    // TypeScript knows this is a number
console.log(player.level); // TypeScript knows this is a number
```

## Deep Copy Behavior

When entities are created, all attributes are **deep-copied** from the prototype. This means:

- Primitive values are copied
- Objects are recursively cloned
- Arrays are cloned
- Class instances are instantiated and cloned

This ensures entities don't share references:

```typescript
const prototype: PrototypeSchema<any> = {
  name: "Test",
  attributes: {
    position: { x: 0, y: 0 }
  }
};

app.entityFactory.prototype(prototype);

const entity1 = app.entityFactory.create("Test");
const entity2 = app.entityFactory.create("Test");

entity1.position.x = 10;
console.log(entity2.position.x); // Still 0, not 10
```

## Entity Lifecycle

```
1. Prototype Definition
   “
2. Registration (entityFactory.prototype())
   “
3. Entity Creation (entityFactory.create())
   “
4. Automatic Collection Assignment
   “
5. Processing by Systems
   “
6. Optional: Rest/Pooling (sendToRest())
```

## Working with Entities

### Accessing Entity Properties

```typescript
const player = app.entityFactory.create<Player>("Player");

// Read properties
console.log(player.hp);
console.log(player.id);
console.log(player.type);

// Modify properties
player.hp -= 10;
player.level += 1;
```

### Collection Membership

```typescript
// Check if entity belongs to a collection
if (player.belongsTo("Players")) {
  console.log("Entity is a player");
}

// Get all collections
const collections = player.collections();
console.log(Array.from(collections)); // ["Players", "Kinetics", "Renderables"]

// Manually manage collection membership (usually not needed)
player.linkTo("SpecialEntities");
player.unlinkFrom("Renderables");
```

### Entity Hierarchies

Create parent-child relationships:

```typescript
const player = app.entityFactory.create("Player");
const weapon = app.entityFactory.create("Weapon");

// Attach weapon as child
player.appendChild("weapon", weapon);

// Access child
const playerWeapon = player.getChild("weapon");

// Remove child
player.deleteChild("weapon");
```

## Best Practices

### 1. Use TypeScript Interfaces

Define interfaces for type safety:

```typescript
interface Enemy extends Entity {
  hp: number;
  damage: number;
  aggressive: boolean;
}

const enemy = app.entityFactory.create<Enemy>("Enemy");
// Now TypeScript knows about hp, damage, aggressive
```

### 2. Organize by Feature

Group related prototypes:

```typescript
// physics-prototypes.ts
export const kineticPrototype = { /* ... */ };
export const colliderPrototype = { /* ... */ };

// character-prototypes.ts
export const playerPrototype = { /* ... */ };
export const enemyPrototype = { /* ... */ };
```

### 3. Use Composition

Prefer multiple small prototypes over large monolithic ones:

```typescript
// Good: Composable
const warrior = {
  name: "Warrior",
  inherits: [kinetic, sprite, damageable, attacker]
};

// Avoid: Monolithic
const warrior = {
  name: "Warrior",
  attributes: { /* 50+ properties */ }
};
```

### 4. Consistent Naming

Use clear, descriptive names:

```typescript
// Good
const playerPrototype: PrototypeSchema<Player> = { name: "Player", /* ... */ };
const enemyPrototype: PrototypeSchema<Enemy> = { name: "Enemy", /* ... */ };

// Avoid
const p1 = { name: "P1", /* ... */ };
const thing = { name: "Thing", /* ... */ };
```

### 5. Default Values

Provide sensible defaults in prototypes:

```typescript
const bulletPrototype: PrototypeSchema<Bullet> = {
  name: "Bullet",
  attributes: {
    speed: 500,        // Pixels per second
    damage: 10,        // Damage points
    lifetime: 3000,    // Milliseconds
    active: true       // Initial state
  }
};
```

## Common Patterns

### Factory Pattern

Create specialized factory functions:

```typescript
function createEnemy(x: number, y: number, level: number) {
  return app.entityFactory.create<Enemy>("Enemy", {
    position: { x, y },
    hp: 50 * level,
    damage: 5 * level,
    level
  });
}

const enemy = createEnemy(100, 200, 3);
```

### Entity Pools

For frequently created/destroyed entities:

```typescript
class BulletPool {
  private pool: Bullet[] = [];

  acquire(x: number, y: number): Bullet {
    if (this.pool.length > 0) {
      const bullet = this.pool.pop()!;
      bullet.position.x = x;
      bullet.position.y = y;
      bullet.active = true;
      return bullet;
    }
    return app.entityFactory.create<Bullet>("Bullet", {
      position: { x, y }
    });
  }

  release(bullet: Bullet): void {
    bullet.active = false;
    this.pool.push(bullet);
  }
}
```

## Troubleshooting

### Type Not Found

```
Error: Cannot create entity of null type 'Player'
```

**Solution**: Make sure the prototype is registered before creating entities.

### Ambiguous Type

```
Error: Ambiguous entity type 'Player' was requested
```

**Solution**: Use an explicit namespace: `app.entityFactory.create("myAddon.Player")`

### Shared References

If entities share object references (shouldn't happen):

**Check**: Ensure you're using the EntityFactory's `create()` method, which performs deep copying.

## Next Steps

- [Collections](./collections.md) - Learn how entities are stored and accessed
- [Systems](./systems.md) - Process entities with game logic
- [Architecture](./architecture.md) - Understand the overall structure
