# Architecture

## Overview

Kernox is built on the **Entity-Component-System (ECS)** architectural pattern, designed for building highly decoupled real-time applications in JavaScript/TypeScript. This architecture promotes separation of concerns and provides excellent performance for applications that need to process many objects each frame.

## Core Concepts

### Entity-Component-System Pattern

The ECS pattern separates data from behavior:

- **Entities**: Objects that exist in your application (e.g., players, enemies, projectiles)
- **Components**: Data containers that define properties (implemented as attributes in prototypes)
- **Systems**: Logic processors that operate on entities with specific components

This separation enables:
- Better code reusability
- Easier testing and debugging
- Improved performance through data-oriented design
- Flexible entity composition through multi-inheritance

## Architecture Diagram

```
=======================================================
|                      Kernox                         |
|  (Central Integration Point)                        |
=======================================================
            |
            |--> EntityFactory
            |    --> Creates entities from prototypes
            |         with multi-inheritance support
            |
            |--> CollectionManager
            |    --> Manages entity collections
            |         (ArrayList, HashMap, etc.)
            |
            |--> SystemManager
            |    --> Executes systems sequentially
            |         each frame
            |
            |--> EventBroker
            |    --> Dispatches events between systems
            |
            |--> AddonLoader
                 --> Loads and integrates addons
                      (bundles of resources)
```

## Main Components

### 1. Kernox (Core)

The main application class that orchestrates all other managers. It provides:

- **Execution loop**: Driven by `requestAnimationFrame` (frame rate depends on display refresh rate)
- **Addon integration**: Loads resources through the `use()` method
- **Manager access**: Provides getters to all manager instances
- **Frame tracking**: Monitors FPS, delta time, and frame count
- **Error handling**: Catches runtime errors, logs them, and pauses execution automatically

**Location**: `src/Kernox.ts`

### 2. EntityFactory

Handles entity creation and prototype management:

- Registers entity prototypes with attributes
- Creates entity instances from prototypes
- Supports multi-inheritance between prototypes
- Deep-copies prototype attributes to avoid shared references
- Maintains per-type object pools for entity recycling via `sendToRest()`

**Location**: `src/entity/EntityFactory.ts`

### 3. CollectionManager

Manages collections of entities:

- Creates and retrieves collections by name
- Supports different collection types (ArrayList, HashMap, custom collections)
- Automatically assigns entities to collections based on their prototype
- Implements a scene system: each scene has its own isolated collection instances
- Provides `CollectionProxy` wrappers that automatically update on scene changes

**Location**: `src/collection/CollectionManager.ts`

### 4. SystemManager

Executes application logic:

- Instantiates and initializes System classes
- Runs systems sequentially each frame
- Supports runtime registration (`use()`), removal (`unuse()`), and retrieval (`get()`) of systems

**Location**: `src/system/SystemManager.ts`

### 5. EventBroker

Facilitates communication between systems:

- Event-based pub/sub messaging via `dispatch()` and `attachToEvent()`
- Implicit namespace resolution when event names are unambiguous across addons

**Location**: `src/event/EventBroker.ts`

### 6. AddonLoader

Packages and loads application resources:

- Bundles prototypes, systems, and collections under a namespace
- Manages namespaces to prevent naming conflicts
- Registers resources in the order: collections → prototypes → systems

**Location**: `src/addon/AddonLoader.ts`

## Data Flow

### Application Lifecycle

1. **Initialization**
   ```typescript
   const app = new Kernox();
   app.use(myAddon);  // Load resources
   app.execute();     // Start execution loop
   ```

2. **Setup Phase** (happens once when addon is loaded via `use()`)
   - Register collection templates in CollectionManager
   - Register prototypes with EntityFactory
   - Instantiate and initialize Systems in SystemManager

3. **Execution Loop** (runs every frame)
   ```
   ========================================
   |  1. requestAnimationFrame callback   |
   |  2. Calculate delta time (dt)        |
   |                                      |
   |  3. SystemManager.execute()          |
   |     --> Execute each System in order |
   |  4. Schedule next frame              |
   ========================================
   ```

   If a runtime error is thrown during execution, it is caught, logged to the console, and `__paused` is set to `true`, halting the loop.

4. **System Execution** (each frame)
   - Systems can read/write entities in collections
   - Systems can dispatch events
   - Systems can listen to events from other systems

### Entity Lifecycle

```
Prototype Definition → Registration → Entity Creation → Collection Assignment → System Processing → Optional Pooling
```

1. **Define Prototype**: Create a `PrototypeSchema<T>` with attributes
2. **Register**: Call `entityFactory.prototype(schema)`
3. **Create Entity**: Call `entityFactory.create(type, params)`
4. **Auto-assign**: Entity is automatically added to its prototype's collections
5. **Process**: Systems iterate over collections and process entities
6. **Pool (optional)**: Call `entityFactory.sendToRest(entity)` to return it to the pool for reuse

## Namespace System

Kernox uses namespaces to prevent conflicts between addons. Each addon's `name` becomes its namespace, and all its resources are stored under `namespace.ResourceName`.

```typescript
// Explicit namespace
app.entityFactory.create("myAddon.Player", { hp: 100 });

// Implicit namespace resolution (when unambiguous across all loaded addons)
app.entityFactory.create("Player", { hp: 100 });
```

Resources (prototypes, collections, events) can be accessed with or without namespaces. If multiple addons define the same resource name, you must use the explicit namespace to avoid an ambiguity error.

## Performance Considerations

### Frame Budget

Each frame has ~16.67ms at 60 Hz to complete all processing:

- Entity iteration should be O(n)
- Avoid expensive operations in hot paths
- Use collections efficiently
- Use `sendToRest()` / `create()` for frequently created/destroyed entities to benefit from pooling

### Memory Management

- Entities are created with unique numeric IDs (auto-incremented)
- Collections hold references to entities, not copies
- Entity attributes are deep-copied from prototypes on creation
- Pooled entities are reset to prototype defaults before reuse

## Best Practices

1. **Separate Concerns**: Keep data (entities) separate from logic (systems)
2. **Single Responsibility**: Each system should handle one specific task
3. **Event-Driven**: Use events for cross-system communication
4. **Composition**: Build complex entities through prototype inheritance
5. **Namespace**: Use namespaces for addon isolation
6. **Modular**: Package related resources into addons

## Next Steps

- [Entities and Prototypes](./entities.md) - Learn how to define and create entities
- [Collections](./collections.md) - Understand entity storage and access
- [Systems](./systems.md) - Implement game logic and behavior
- [Events](./events.md) - Communication between systems
- [Addons](./addons.md) - Package and organize your application
