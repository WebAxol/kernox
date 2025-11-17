import { AbstractCollection } from "./AbstractCollection.js";
import { Entity } from "../entity/Entity.js";
import { ArrayList } from "./ArrayList.js";
import { isSubclassOf } from "../utils/isSubclassOf.js";
import { Kernox } from "../Kernox.js";

export class CollectionManager {

    /**
     * Scene system: allows having multiple instances of collections, each of which
     * has a subset of entities belonging to the active scene.
     * 
     * - Collections are registered as templates (constructors)
     * - Each scene has its own instances of all registered collections
     * - When switching scenes, new instances are created if they don't exist
     * - The active scene's collections are returned when requested via "get()"
     */

    // Collection templates (constructors) registered via use()
    private collectionTemplates : Map<string, new () => AbstractCollection> = new Map();
    
    // Scene-specific collection instances: Map<sceneName, Map<collectionName, instance>>
    private sceneCollections : Map<string, Map<string, AbstractCollection>> = new Map();
    
    // Active scene name (default is "default")
    private activeScene : string = "default";
    
    private toRemove    : Set<Entity> = new Set();

    constructor( private __kernox : Kernox ) {
        // Initialize default scene
        this.sceneCollections.set("default", new Map());
    }

    /**
     * Searches for a collection by name and retrieves it from the active scene.
     * Creates a new instance for the active scene if it doesn't exist yet.
     * @param collectionName Name of collection
     * @returns Collection instance from the active scene
     */
    public get<T extends AbstractCollection>(collectionName : string) : T {
        // First try to get from active scene
        const activeSceneCollections = this.sceneCollections.get(this.activeScene);
        if (activeSceneCollections) {
            let collection = activeSceneCollections.get(collectionName);
            
            // If not found, try implicit namespace resolution
            if (!collection) {
                collection = this.resolveImplicitNamespace(collectionName, this.activeScene);
            }
            
            if (collection) {
                return collection as T;
            }
        }
        
        // Collection doesn't exist in active scene - check if template exists
        const template = this.collectionTemplates.get(collectionName) || this.resolveTemplateNamespace(collectionName);
        
        if (!template) {
            throw new Error(`Collection '${collectionName}' is not registered.`);
        }
        
        // Create instance for active scene
        return this.ensureCollectionInScene(collectionName, template) as T;
    }

    /**
     * Registers a collection template (constructor) for use across all scenes.
     * The collection will be instantiated per scene when first accessed.
     * @param Ctr sub-class of AbstractCollection.
     * @param namespace Optional parameter used by AddonLoader to specify a context when loading collections from an addon.
     */
    public use(Ctr : new () => AbstractCollection, namespace :  string = ''): void {

        if(!(isSubclassOf(Ctr,AbstractCollection))){
            throw new Error("Invalid collection: it must be a sub-class of AbstractCollection")
        }

        const name = namespace ? `${namespace}.${Ctr.name}` : Ctr.name;
        
        if(this.collectionTemplates.has(name)){
            throw new Error(`Cannot register collection '${name}' because it already exists`);
        }

        // Store the constructor as a template
        this.collectionTemplates.set(name, Ctr);
        
        // Create instance for default scene if it's the active scene
        if (this.activeScene === "default") {
            this.ensureCollectionInScene(name, Ctr);
        }
    }

    public addEntityTo(entity : Entity, collectionName : string): void {
        const collection = this.get(collectionName);
        collection.insert(entity);
        entity.linkTo(collectionName);
    }

    public removeEntityFrom(entity: Entity, collectionName: string): void {
        const collection = this.get(collectionName);
        collection.remove(entity);
        entity.unlinkFrom(collectionName);
    }

    private remindToForget(entity : Entity): void {
        this.toRemove.add(entity);
    }

    public flushRemoved(): void {
        for (const entity of this.toRemove) {
            for (const collectionName of entity.collections()) {
                this.removeEntityFrom(entity, collectionName);
            }
        }
        this.toRemove.clear();
    }

    /**
     * Switches to a different scene, creating collection instances if they don't exist.
     * @param sceneName Name of the scene to switch to
     */
    public switchScene(sceneName : string) : void {
        if (sceneName === this.activeScene) {
            return; // Already on this scene
        }
        
        // Ensure all registered collections exist in the new scene
        if (!this.sceneCollections.has(sceneName)) {
            this.sceneCollections.set(sceneName, new Map());
        }
        
        const newSceneCollections = this.sceneCollections.get(sceneName)!;
        
        // Create instances for all registered collection templates
        for (const [collectionName, Ctr] of this.collectionTemplates) {
            if (!newSceneCollections.has(collectionName)) {
                const instance = new Ctr();
                newSceneCollections.set(collectionName, instance);
            }
        }
        
        this.activeScene = sceneName;
    }
    
    /**
     * Gets the name of the currently active scene.
     * @returns Active scene name
     */
    public getActiveScene() : string {
        return this.activeScene;
    }
    
    /**
     * Ensures a collection instance exists in the active scene.
     * @param collectionName Name of the collection
     * @param Ctr Constructor for the collection
     * @returns The collection instance
     */
    private ensureCollectionInScene(collectionName : string, Ctr : new () => AbstractCollection) : AbstractCollection {
        let sceneCollections = this.sceneCollections.get(this.activeScene);
        
        if (!sceneCollections) {
            sceneCollections = new Map();
            this.sceneCollections.set(this.activeScene, sceneCollections);
        }
        
        let collection = sceneCollections.get(collectionName);
        
        if (!collection) {
            collection = new Ctr();
            sceneCollections.set(collectionName, collection);
        }
        
        return collection;
    }
    
    /**
     * Resolves collection instance with implicit namespace from a specific scene.
     */
    private resolveImplicitNamespace(collectionName : string, sceneName : string) : AbstractCollection | undefined {
        const namespaces = this.__kernox.addonLoader.namespaces;
        const sceneCollections = this.sceneCollections.get(sceneName);
        
        if (!sceneCollections) {
            return undefined;
        }
        
        var resolved, resource;

        for(const namespace of namespaces){
            resource = sceneCollections.get(`${namespace}.${collectionName}`);
            if(resource && !resolved) resolved = resource;
            else if(resource){ 
                throw new Error(`Ambiguous collection '${collectionName}' was requested: a namespace must be specified before it ( Ex. namespace.collectionName ).`);
            }
        }

        return resolved;
    }
    
    /**
     * Resolves collection template (constructor) with implicit namespace.
     */
    private resolveTemplateNamespace(collectionName : string) : (new () => AbstractCollection) | undefined {
        const namespaces = this.__kernox.addonLoader.namespaces;
        
        var resolved, resource;

        for(const namespace of namespaces){
            resource = this.collectionTemplates.get(`${namespace}.${collectionName}`);
            if(resource && !resolved) resolved = resource;
            else if(resource){ 
                throw new Error(`Ambiguous collection template '${collectionName}' was requested: a namespace must be specified before it ( Ex. namespace.collectionName ).`);
            }
        }

        return resolved;
    }
}