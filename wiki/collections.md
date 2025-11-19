# Collections

## Overview

Collections are data structures that store and organize entities in Kernox. They provide efficient ways to group entities by type or behavior, making it easy for Systems to process specific sets of entities. Collections are fundamental to the ECS pattern, as they bridge entities and systems.

## Collection Types

Kernox provides a base `AbstractCollection` class and concrete implementations like `ArrayList`. You can also create custom collection types for specialized use cases.

### AbstractCollection

The base class that all collections must extend:

```typescript
abstract class AbstractCollection {
  protected abstract entities: any;
  protected abstract __changed: boolean;

  abstract insert(entity: Entity): boolean;
  abstract remove(entity: Entity): boolean;
}
```

**Location**: `src/collection/AbstractCollection.ts`

### ArrayList

The default collection implementation, backed by a JavaScript array. Provides efficient iteration and flexible access patterns.

**Location**: `src/collection/ArrayList.ts`

## ArrayList API

### Core Methods

#### insert(entity)

Adds an entity to the collection.

```typescript
const players = app.collectionManager.get("Players");
const player = app.entityFactory.create("Player");

players.insert(player);  // Returns true if added, false if already exists
```

- Returns `true` if entity was added
- Returns `false` if entity already exists in collection
- Automatically links entity to collection
- Sets `__changed` flag to `true`

#### remove(entity)

Removes an entity from the collection.

```typescript
players.remove(player);  // Returns true if removed, false if not found
```

- Returns `true` if entity was removed
- Returns `false` if entity doesn't exist in collection
- Automatically unlinks entity from collection
- Sets `__changed` flag to `true`

#### has(entity)

Checks if an entity exists in the collection.

```typescript
if (players.has(player)) {
  console.log("Player is in collection");
}
```

#### size()

Returns the number of entities in the collection.

```typescript
const count = players.size();
console.log(`There are ${count} players`);
```

### Iteration Methods

#### Iterator Protocol

ArrayList implements the iterator protocol, so you can use `for...of` loops:

```typescript
const players = app.collectionManager.get<ArrayList<Player>>("Players");

for (const player of players) {
  console.log(`Player ${player.id} has ${player.hp} HP`);
}
```

#### asArray()

Returns a shallow copy of the entity array:

```typescript
const playerArray = players.asArray();

// Safe to mutate the array structure
playerArray.push(newPlayer);  // Doesn't affect the collection

// But entities are shared references
playerArray[0].hp -= 10;  // DOES affect the entity in the collection
```

Use cases:
- When you need array methods like `map`, `reduce`, `slice`
- To create a snapshot of the collection state
- When you need to modify the array structure without affecting the collection

### Access Methods

#### get(index)

Access an entity by index:

```typescript
const firstPlayer = players.get(0);
const lastPlayer = players.get(players.size() - 1);
```

Returns `undefined` if index is out of bounds.

#### filter(criteria)

Returns a filtered array of entities:

```typescript
// Get all players with low HP
const lowHpPlayers = players.filter(p => p.hp < 30);

// Get all players above level 5
const highLevelPlayers = players.filter(p => p.level > 5);
```

The returned array is a new array, but entities are shared references.

### Utility Methods

#### sort(criteria)

Sorts the collection in-place:

```typescript
// Sort by HP (ascending)
players.sort((a, b) => a.hp - b.hp);

// Sort by level (descending)
players.sort((a, b) => b.level - a.level);

// Sort by name alphabetically
players.sort((a, b) => a.name.localeCompare(b.name));
```

**Warning**: This mutates the collection structure. All systems will see the new order.

#### changed

Property that tracks if the collection was modified:

```typescript
if (players.changed) {
  console.log("Collection was modified");
  // React to changes...
}
```

Automatically set to `true` when entities are inserted or removed.

## CollectionManager

The CollectionManager (`src/collection/CollectionManager.ts`) handles collection creation and retrieval.

### get(name)

Retrieves a collection by name:

```typescript
const players = app.collectionManager.get("Players");

// With type safety
const players = app.collectionManager.get<ArrayList<Player>>("Players");
```

Returns the collection or `undefined` if not found.

### use(CollectionClass, context)

Registers a collection class:

```typescript
class CustomCollection extends ArrayList {
  // Custom implementation
}

app.collectionManager.use(CustomCollection, "myAddon");
```

Usually handled automatically by the addon system.

### addEntityTo(entity, collectionName)

Manually adds an entity to a collection:

```typescript
app.collectionManager.addEntityTo(player, "Players");
```

**Note**: Entities are usually assigned automatically based on their prototype's `collections` property.

## Defining Collections

### Basic Collection

```typescript
import { ArrayList } from "kernox";

// Extend ArrayList with optional custom behavior
class Players extends ArrayList {}
class Enemies extends ArrayList {}
class Projectiles extends ArrayList {}

export const collections = [Players, Enemies, Projectiles];
```

### Typed Collection

For better TypeScript support:

```typescript
import { ArrayList } from "kernox";
import type { Player } from "./prototypes";

class Players extends ArrayList<Player> {
  // Optional: Add custom methods
  getAlive() {
    return this.filter(p => p.hp > 0);
  }

  getTotalHP() {
    return this.asArray().reduce((sum, p) => sum + p.hp, 0);
  }
}
```

### Custom Collection Implementation

For specialized data structures:

```typescript
import { AbstractCollection } from "kernox";
import { Entity } from "kernox";

class SpatialGrid extends AbstractCollection {
  protected entities = new Map<string, Entity>();
  protected grid = new Map<string, Set<Entity>>();
  protected __changed = false;
  private cellSize = 64;

  insert(entity: Entity): boolean {
    if (this.entities.has(entity.id)) return false;

    this.entities.set(entity.id, entity);
    this.addToGrid(entity);
    this.__changed = true;
    return true;
  }

  remove(entity: Entity): boolean {
    if (!this.entities.has(entity.id)) return false;

    this.entities.delete(entity.id);
    this.removeFromGrid(entity);
    this.__changed = true;
    return true;
  }

  private addToGrid(entity: Entity): void {
    const cellKey = this.getCellKey(entity.position);
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set());
    }
    this.grid.get(cellKey)!.add(entity);
  }

  private removeFromGrid(entity: Entity): void {
    const cellKey = this.getCellKey(entity.position);
    const cell = this.grid.get(cellKey);
    if (cell) cell.delete(entity);
  }

  private getCellKey(position: { x: number; y: number }): string {
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    return `${x},${y}`;
  }

  getNearby(position: { x: number; y: number }): Entity[] {
    const cellKey = this.getCellKey(position);
    const cell = this.grid.get(cellKey);
    return cell ? Array.from(cell) : [];
  }
}
```

## Registering Collections

### Via Addon System (Recommended)

```typescript
import type { KernoAddon } from "kernox";
import { Players, Enemies, Projectiles } from "./collections";

const gameAddon: KernoAddon = {
  name: "myGame",
  collections: [Players, Enemies, Projectiles]
};

app.use(gameAddon);  // Collections are automatically registered
```

### Manual Registration

```typescript
app.collectionManager.use(Players, "myGame");
```

## Using Collections in Systems

Systems typically retrieve collections during initialization:

```typescript
import { System, ArrayList } from "kernox";
import type { Player } from "./prototypes";

class HealthSystem extends System {
  private players!: ArrayList<Player>;

  init() {
    this.players = this.getCollection<ArrayList<Player>>("Players");
  }

  execute() {
    for (const player of this.players) {
      // Regenerate health
      if (player.hp < 100) {
        player.hp += 1;
      }
    }
  }
}
```

## Common Patterns

### Pattern 1: Filtering and Processing

```typescript
class CombatSystem extends System {
  private enemies!: ArrayList<Enemy>;

  execute() {
    // Only process alive enemies
    const alive = this.enemies.filter(e => e.hp > 0);

    for (const enemy of alive) {
      // Update enemy behavior
      this.updateAI(enemy);
    }
  }
}
```

### Pattern 2: Collision Detection

```typescript
class CollisionSystem extends System {
  private projectiles!: ArrayList<Projectile>;
  private enemies!: ArrayList<Enemy>;

  execute() {
    for (const projectile of this.projectiles) {
      for (const enemy of this.enemies) {
        if (this.checkCollision(projectile, enemy)) {
          enemy.hp -= projectile.damage;
          this.projectiles.remove(projectile);
        }
      }
    }
  }

  private checkCollision(a: Entity, b: Entity): boolean {
    // Collision detection logic
    return false;
  }
}
```

### Pattern 3: Sorted Processing

```typescript
class RenderSystem extends System {
  private renderables!: ArrayList<Sprite>;

  execute() {
    // Sort by depth for proper layering
    this.renderables.sort((a, b) => a.depth - b.depth);

    for (const sprite of this.renderables) {
      this.draw(sprite);
    }
  }
}
```

### Pattern 4: Entity Cleanup

```typescript
class CleanupSystem extends System {
  private entities!: ArrayList<Entity>;

  execute() {
    const toRemove = this.entities.filter(e => e.shouldDestroy);

    for (const entity of toRemove) {
      this.entities.remove(entity);
    }
  }
}
```

### Pattern 5: Multiple Collections

```typescript
class SpawnSystem extends System {
  private players!: ArrayList<Player>;
  private enemies!: ArrayList<Enemy>;
  private projectiles!: ArrayList<Projectile>;

  init() {
    this.players = this.getCollection("Players");
    this.enemies = this.getCollection("Enemies");
    this.projectiles = this.getCollection("Projectiles");
  }

  execute() {
    // Spawn enemies when needed
    if (this.enemies.size() < 5) {
      const enemy = this.__kernox.entityFactory.create("Enemy");
      this.enemies.insert(enemy);
    }
  }
}
```

## Performance Considerations

### Iteration Performance

- `for...of` loop: **Best** - Direct iterator access
- `asArray()` + loop: Slight overhead from array copy
- `filter()` + loop: Additional overhead from filtering

```typescript
// Fastest
for (const entity of collection) { /* ... */ }

// Good
const array = collection.asArray();
for (const entity of array) { /* ... */ }

// Slower (but fine for smaller sets)
const filtered = collection.filter(e => e.active);
for (const entity of filtered) { /* ... */ }
```

### Memory Considerations

- Collections store references, not copies
- Removing from a collection doesn't destroy the entity
- Entity is kept alive as long as any reference exists

### Change Tracking

Use the `changed` flag for optimization:

```typescript
class RenderSystem extends System {
  private renderables!: ArrayList<Sprite>;
  private needsReorder = false;

  execute() {
    // Only resort if collection changed
    if (this.renderables.changed || this.needsReorder) {
      this.renderables.sort((a, b) => a.depth - b.depth);
      this.needsReorder = false;
    }

    for (const sprite of this.renderables) {
      this.draw(sprite);
    }
  }
}
```

## Best Practices

### 1. Name Collections by Role

```typescript
// Good - Describes what entities do
class Renderables extends ArrayList {}
class Collidables extends ArrayList {}
class Controllables extends ArrayList {}

// Avoid - Too generic
class Entities extends ArrayList {}
class Things extends ArrayList {}
```

### 2. Use Type Parameters

```typescript
// Good - Type safe
class Players extends ArrayList<Player> {}

// Avoid - No type safety
class Players extends ArrayList {}
```

### 3. Single Responsibility

Keep collections focused:

```typescript
// Good - Focused collections
class Players extends ArrayList<Player> {}
class Enemies extends ArrayList<Enemy> {}

// Avoid - Mixed collection
class Characters extends ArrayList {}  // Contains both players and enemies
```

### 4. Minimal Custom Logic

Keep collections simple data structures:

```typescript
// Good - Simple helper methods
class Players extends ArrayList<Player> {
  getAlive() {
    return this.filter(p => p.hp > 0);
  }
}

// Avoid - Complex game logic in collections
class Players extends ArrayList<Player> {
  updateAI() { /* Complex logic */ }
  handleCombat() { /* Should be in System */ }
}
```

### 5. Avoid Premature Optimization

Start with ArrayList, optimize later:

```typescript
// Start with this
class Enemies extends ArrayList<Enemy> {}

// Optimize only if needed
class Enemies extends SpatialHashGrid<Enemy> {}
```

## Troubleshooting

### Collection Not Found

```typescript
const players = this.getCollection("Players");  // undefined
```

**Solution**: Ensure collection class is registered in your addon's `collections` array.

### Entity Not Added to Collection

**Check**:
1. Is the collection name in the prototype's `collections` Set?
2. Is the prototype registered before creating entities?
3. Is the entity being created after `app.use()` is called?

### Iterator Not Working

```typescript
for (const entity of collection) {  // Error
```

**Solution**: Ensure collection extends `ArrayList` or implements `Symbol.iterator`.

## Scene Management System

Kernox implements a scene-based architecture where scenes are managed through separate collection instances. This allows for complete entity isolation between different game states (menus, levels, etc.).

### Scene Architecture

Rather than having a dedicated Scene class, scenes are implemented as isolated contexts:

- Collections are registered as templates (constructors)
- Each scene has its own instances of all registered collections
- When switching scenes, new instances are created if they don't exist
- The active scene's collections are returned when requested via `get()`

**Location**: `src/collection/CollectionManager.ts:11-28`

### Switching Scenes

Use `switchScene()` to change between scenes:

```typescript
// Create entities in scene1
app.collectionManager.switchScene("scene1");
app.entityFactory.create("Circle", { color: "red" });

// Switch to scene2 - entities from scene1 are preserved but not visible
app.collectionManager.switchScene("scene2");
app.entityFactory.create("Circle", { color: "blue" });

// Switch back to scene1 - original entities still exist
app.collectionManager.switchScene("scene1");
```

**Key Points:**
- Scenes are created lazily when first accessed
- Each scene maintains completely separate entity sets
- Switching away from a scene preserves all its entities
- The "default" scene is created automatically

### Getting Active Scene

```typescript
const currentScene = app.collectionManager.getActiveScene();
console.log(`Currently in: ${currentScene}`);
```

### Entity Isolation

Entities created in one scene don't affect other scenes:

```typescript
// Create entities in default scene
app.entityFactory.create("Player");
app.entityFactory.create("Player");

const defaultPlayers = app.collectionManager.get("Players");
console.log(defaultPlayers.size());  // 2

// Switch to level1 scene
app.collectionManager.switchScene("level1");
const level1Players = app.collectionManager.get("Players");
console.log(level1Players.size());  // 0 (empty collection)
```

**Location**: `src/__tests__/CollectionManager/sceneIsolation.test.ts:20-38`

### CollectionProxy for Scene-Aware Systems

Systems should use CollectionProxy wrappers to automatically track scene changes:

```typescript
import { System } from "kernox";
import { CollectionProxy } from "kernox";
import type { Renderables } from "./collections";

class RenderingSystem extends System {
  private renderables!: CollectionProxy<Renderables>;

  init() {
    // Get smart wrapper that auto-updates on scene changes
    this.renderables = this.__kernox.collectionManager.getSmartWrapper<Renderables>("Renderables");
  }

  execute() {
    // Wrapper always points to active scene's collection
    for (const entity of this.renderables) {
      this.draw(entity);
    }
  }
}
```

**Key Benefits:**
- No manual reference updates when scenes change
- One wrapper instance per collection name
- Proxies all collection methods to the active collection

**Location**: `src/collection/CollectionProxy.ts`, `src/__demo__/systems/RenderingSystem.ts:1-22`

### Multi-Scene Setup Pattern

```typescript
const scenes = ["menu", "level1", "level2", "gameOver"];

// Pre-populate all scenes
scenes.forEach(sceneName => {
  app.collectionManager.switchScene(sceneName);
  initializeScene(sceneName);
});

// Start with menu
app.collectionManager.switchScene("menu");
```

### Scene Design Principles

**Scene Isolation:**
- Complete separation - each scene has its own collection instances
- No cross-scene pollution - entities in one scene don't affect another
- State preservation - switching away from a scene preserves all its entities

**Lazy Instantiation:**
- Scenes are created only when first accessed
- Collection instances are created per scene only when needed
- Minimal memory footprint for unused scenes

**Template-Based Architecture:**
- Collections are registered once as templates (constructors)
- Each scene instantiates its own copies from these templates
- Ensures consistency across all scenes

**Automatic Updates:**
- Systems use CollectionProxy wrappers for scene-aware collection access
- Proxies automatically update when scenes change
- No manual reference management required

### Entity Pooling and Scenes

Entity pools are **global** (not per-scene). When an entity is returned to the pool via `sendToRest()`, it can be reused in any scene:

```typescript
// Remove entity from collections in current scene
app.entityFactory.sendToRest(entity);

// Entity is available for reuse in any scene
app.collectionManager.switchScene("level2");
const newEntity = app.entityFactory.create("Enemy");  // May reuse pooled entity
```

**Location**: `src/entity/EntityFactory.ts:155-178`

### Scene Management API Reference

**switchScene(sceneName: string)** - `src/collection/CollectionManager.ts:180`
- Switches to a different scene
- Creates the scene and its collections if they don't exist

**getActiveScene(): string** - `src/collection/CollectionManager.ts:208-214`
- Returns the name of the currently active scene

**getSmartWrapper<T>(collectionName): CollectionProxy<T>** - `src/collection/CollectionManager.ts:70-99`
- Gets or creates a CollectionProxy for scene-aware collection access
- Wrapper automatically updates when scenes change

## Next Steps

- [Systems](./systems.md) - Learn how to process collections
- [Entities](./entities.md) - Understand entity creation and prototypes
- [Architecture](./architecture.md) - See how collections fit in the big picture
