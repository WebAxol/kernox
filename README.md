<div align="center">
<pre>
dP     dP                                              
88   .d8'                                              
88aaa8P'  .d8888b. 88d888b. 88d888b. .d8888b. dP.  .dP 
88   `8b. 88ooood8 88'  `88 88'  `88 88'  `88  `8bd8'  
88     88 88.  ... 88       88    88 88.  .88  .d88b.  
dP     dP `88888P' dP       dP    dP `88888P' dP'  `dP

----------------------------------------------------------------------
**Entity-Component-System-based JavaScript framework for real-time applications** 
</pre>
</div>

<p align="center">
<a href="https://github.com/WebAxol/Kernox/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/WebAxol/Kernox?color=yellow" alt="License: MIT" />
  </a>
  <a href="https://www.npmjs.com/package/kernox">
    <img src="https://img.shields.io/npm/v/kernox?color=crimson&label=npm&logo=npm" alt="npm version" />
  </a>
  <a href="https://bundlephobia.com/package/kernox">
    <img src="https://img.shields.io/bundlephobia/min/kernox" alt="minified size" />
  </a>
  <a href="https://bundlephobia.com/package/kernox">
    <img src="https://img.shields.io/bundlephobia/minzip/kernox" alt="minzipped size" />
  </a>
</p>

## Features

- **Entity-Component-System Architecture** - Highly decoupled design for scalable real-time applications
- **Prototype-Based Entities** - Define entity templates with multi-inheritance support
- **Scene Management** - Isolate entities across multiple game states (menus, levels, etc.)
- **Entity Pooling** - Automatic memory optimization through object reuse
- **Event System** - Decoupled communication via event broker
- **Addon System** - Modular organization with namespace support
- **TypeScript Support** - Full type safety with modern ES6+ syntax

## Installation

```bash
npm install kernox
```

## Quick Start

```typescript
import { Kernox, KernoAddon } from "kernox";
import { prototypes } from "./setup/prototypes.js";
import { systems } from "./setup/systems.js";
import { collections } from "./setup/collections.js";

// Bundle resources as an addon
const myApp: KernoAddon = {
  name: "myApp",
  prototypes,
  systems,
  collections
};

// Initialize and run
const app = new Kernox();
app.use(myApp);
app.execute();
```

## Core Concepts

### Entities and Prototypes

Define entity templates with attributes and collection assignments:

```typescript
import type { PrototypeSchema, Entity } from "kernox";

interface Player extends Entity {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  hp: number;
  level: number;
}

const playerPrototype: PrototypeSchema<Player> = {
  name: "Player",
  attributes: {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    hp: 100,
    level: 1
  },
  collections: new Set(["Players", "Kinetics", "Renderables"])
};
```

**Multi-Inheritance:**

```typescript
const enemyPrototype: PrototypeSchema<Enemy> = {
  name: "Enemy",
  attributes: { damage: 10 },
  collections: new Set(["Enemies"]),
  inherits: [kineticPrototype, spritePrototype]  // Inherit from multiple prototypes
};
```

[Learn more about entities →](wiki/entities.md)

### Collections

Group entities for efficient processing:

```typescript
import { ArrayList } from "kernox";

// Define typed collections
class Players extends ArrayList<Player> {}
class Enemies extends ArrayList<Enemy> {}
class Projectiles extends ArrayList<Projectile> {}

export const collections = [Players, Enemies, Projectiles];
```

**Usage:**

```typescript
const players = app.collectionManager.get<Players>("Players");

for (const player of players) {
  console.log(`Player ${player.id} has ${player.hp} HP`);
}

// Array methods
const alive = players.filter(p => p.hp > 0);
const count = players.size();
```

[Learn more about collections →](wiki/collections.md)

### Systems

Process entities each frame:

```typescript
import { System } from "kernox";
import type { Kinetics } from "./collections";

class MovementSystem extends System {
  private kinetics!: Kinetics;

  init() {
    this.kinetics = this.getCollection<Kinetics>("Kinetics");
  }

  execute() {
    for (const entity of this.kinetics) {
      entity.position.x += entity.velocity.x;
      entity.position.y += entity.velocity.y;
    }
  }
}
```

[Learn more about systems →](wiki/systems.md)

### Scene Management

Isolate entities across different game states:

```typescript
// Switch to menu scene
app.collectionManager.switchScene("menu");
app.entityFactory.create("Button", { text: "Start Game" });

// Switch to level1 - menu entities are preserved but hidden
app.collectionManager.switchScene("level1");
app.entityFactory.create("Player", { position: { x: 100, y: 100 } });

// Switch back to menu - entities still exist
app.collectionManager.switchScene("menu");
```

**Scene-Aware Systems:**

```typescript
class RenderSystem extends System {
  private renderables!: CollectionProxy<Renderables>;

  init() {
    // Automatically updates when scenes change
    this.renderables = this.__kernox.collectionManager.getSmartWrapper<Renderables>("Renderables");
  }

  execute() {
    for (const entity of this.renderables) {
      this.draw(entity);
    }
  }
}
```

[Learn more about scene management →](wiki/collections.md#scene-management-system)

### Events

Decouple communication between systems:

```typescript
// Define event
interface PlayerDiedEvent {
  playerId: string;
  position: { x: number; y: number };
}

// Emit event
this.__kernox.eventBroker.emit<PlayerDiedEvent>("player:died", {
  playerId: player.id,
  position: player.position
});

// Subscribe to event
this.__kernox.eventBroker.subscribe<PlayerDiedEvent>("player:died", (data) => {
  console.log(`Player ${data.playerId} died at`, data.position);
  this.spawnExplosion(data.position);
});
```

[Learn more about events →](wiki/events.md)

### Entity Pooling

Optimize memory usage through automatic entity recycling:

```typescript
// Create entity (may reuse pooled entity)
const enemy = app.entityFactory.create("Enemy", {
  position: { x: 100, y: 100 }
});

// Return entity to pool for reuse
app.entityFactory.sendToRest(enemy);

// Next create() call may reuse the pooled entity
const newEnemy = app.entityFactory.create("Enemy");
```

Each entity type has its own pool. Entities are automatically removed from all collections before pooling.

### Addon System

Organize code into modular, reusable packages:

```typescript
import type { KernoAddon } from "kernox";

const gameAddon: KernoAddon = {
  name: "myGame",
  prototypes: [playerPrototype, enemyPrototype],
  systems: [MovementSystem, CombatSystem, RenderSystem],
  collections: [Players, Enemies, Projectiles]
};

// Load addon with automatic namespace registration
app.use(gameAddon);

// Access namespaced resources
app.entityFactory.create("myGame.Player");
const players = app.collectionManager.get("myGame.Players");
```

[Learn more about addons →](wiki/addons.md)

## Creating Entities

```typescript
// Create from prototype
const player = app.entityFactory.create("Player", {
  position: { x: 100, y: 200 },
  hp: 80
});

// With namespace
const enemy = app.entityFactory.create("myGame.Enemy");

// Entities are automatically added to their prototype's collections
```

## Application Lifecycle

```typescript
const app = new Kernox();

// Register addons
app.use(gameAddon);

// Start execution loop
app.execute();

// Stop execution
app.stop();
```

## Demo

Clone the repository and run the demo:

```bash
git clone https://github.com/WebAxol/Kernox.git
cd Kernox
npm install
npm start
```

Then visit [localhost:2025](http://localhost:2025)

![Kernox Demo](demo/demo.gif)

## Documentation

For detailed documentation, see the [wiki](wiki/) directory:

- [Architecture Overview](wiki/architecture.md)
- [Entities](wiki/entities.md)
- [Collections](wiki/collections.md)
- [Systems](wiki/systems.md)
- [Events](wiki/events.md)
- [Addons](wiki/addons.md)

## Contributing

Contributions are welcome! Please send pull requests to the `dev` branch.

```bash
git clone https://github.com/WebAxol/Kernox.git
cd Kernox
npm install
npm test
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
