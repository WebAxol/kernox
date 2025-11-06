import { AddonLoader } from "./addon/AddonLoader";
import { KernoAddon } from "./addon/KernoxAddon";
import { CollectionManager } from "./collection/CollectionManager";
import { EntityFactory } from "./entity/EntityFactory";
import { EventBroker } from "./event/EventBroker";
import { SystemManager } from "./system/SystemManager";
import { ArrayList } from "./collection/ArrayList";
import { System } from "./system/System";
/**
 * Top-level application component: central integration point that handles all resources, including entities,
 * collections, systems, and events.
 */
export declare class Kernox {
    private __entityFactory;
    private __collectionManager;
    private __systemManager;
    private __eventBroker;
    private __addonLoader;
    private __paused;
    private __started;
    private __frame;
    private __lastTime;
    private __dt;
    private __fps;
    /**
     * Kernox's top-level method, it starts the execution loop triggering subordinate systems.
     */
    execute(timeSpan?: number): void;
    /**
       * Integrates an 'addon' to the application instance, registering and setting up resources.
       * @param addon Object that packages resources belonging to a context: it can contain a list of systems, collections, event listeners
       * and entity prototypes, which will be registered.
       * @example
       * import { Kernox, KernoAddon } from "../../dist/kernox";
       
       const app = new Kernox();
  
       // Recommended setup structure:
       
       import { prototypes  }   from "./setup/prototypes";
       import { listeners   }   from "./setup/listeners";
       import { systems     }   from "./setup/systems";
       import { collections }   from "./setup/collections";
       
       // Resource bundler (Addon)
       
       const demoApp : KernoAddon = {
           name : "demoApp",
           prototypes,
           systems,
           collections,
           listeners
       };
            
      app.addonLoader.use(demoApp); // << Integrating addon to application
       */
    use(addon: KernoAddon): void;
    /**
     * Manages the construction and recycling of entities, and can assamble prototypes to define archetypes;
     * it creates an object pools for each archetype to allocate unused entities for posterior reusal.
     */
    get entityFactory(): EntityFactory;
    /**
     * Creates, retrieves and updates collections. A collection is a data structure containing entities; there are
     * several types of collections: linear (array), sorted (array), etc...
     */
    get collectionManager(): CollectionManager;
    /**
     * Vinculates and runs System instances sequentially.
     */
    get systemManager(): SystemManager;
    /**
     * Dispatches emitted events to subscribed systems, by calling their handler method.
     */
    get eventBroker(): EventBroker;
    get addonLoader(): AddonLoader;
    get started(): boolean;
    get frame(): number;
    get paused(): boolean;
    get dt(): number;
    get fps(): number;
}
export { ArrayList, System, KernoAddon };
