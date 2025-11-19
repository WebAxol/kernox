import type { PrototypeSchema } from "./PrototypeSchema.js";
import { Entity } from "./Entity.js";
import { Kernox } from "../Kernox.js";

export class EntityFactory{

    private types :Map<string,PrototypeSchema<any>> = new Map();
    private pools :Map<string,Entity[]> = new Map();
    private nextID : number = 0;

    constructor( private __kernox : Kernox ){}

    /**
     * Registers an entity prototype, based on which entities from a type will be created. The prototype can
     * extend one or more existing prototypes, resulting on a base object having all attributes of its parents.
     * @param prototype Schema that defines the prototype attributes, and other details
     * @param namespace Specifies the addon-related context of the given prototype
     * @example
     *  
     * import { Kernox } from "kernox";
     * import type { Entity, PrototypeSchema } from "kernox";

        // Application instance

        const app = new Kernox();
        
        // Interface of entity type (optional but recommended)

        export interface Circle extends Entity {
            position   : Vector2D;
            radius     : number;
            color      : string; 
        };
        
        // Define prototype of type 'Circle'

        export const circlePrototype : PrototypeSchema<Circle> = {
            name : "Circle",
            attributes : {
                position   : new Vector2D(0,0),
                radius : 1,
                color : "rgb(255,0,0)"
            } as Circle,
            collections : new Set([ "Renderables" ])
        };
     
        // Register prototype

        app.entityFactory.prototype(circlePrototype);
     */
    public prototype(prototype : PrototypeSchema<any>, namespace :  string = '') : void {

        const name = namespace ? `${namespace}.${prototype.name}` : prototype.name;

        if(this.types.has(name)) throw Error(`The type named '${name}' has already been registered`);
        
        // Inherit attributes and collections from parent types

        const { inherits } = prototype;

        if(inherits){

            const parents = inherits;
            const stack :PrototypeSchema<any>[] = [];
            
            for(const parent of parents){
                stack.push(parent);
            }

            let current : PrototypeSchema<any> | undefined = stack.pop();

            while(current){

                // Copy each property from parent type to the new type

                const temp = {};
                
                this.deepAssign(temp,current.attributes);
                this.deepAssign(temp,prototype.attributes);

                prototype.attributes = temp;

                // Join type collections with collections belonging to parent type

                prototype.collections = new Set([
                    ...(prototype.collections   || []), 
                    ...(current.collections     || [])
                ]);

                for(const parent of (current.inherits || [])){
                    stack.push(parent);
                }

                current = stack.pop();
            }            
        }

        this.types.set(name, prototype);
    }
    /**
     * Instantiates an entity: an object populated with the attributes defined by its prototype, which by default
     * contains the same values as it. Specific values can be assigned by adding them to the 'params' dictionary.
     * @param type Entity type, related to an existing prototype
     * @param params Dictionary of custom parameters, with which an entity's matching attributes will be defined
     * @returns An entity of the given type built based on its prototype (and parameters if any)
     */
    public create<T extends Entity = any>(type : string, params : object = {}) : T {

        const prototype : PrototypeSchema<any> | undefined = this.types.get(type) || this.resolveImplicitNamespace(type);

        if(!prototype){
            throw Error(`Cannot create entity of null type '${type}'`);
        }

        // Try to recycle an entity from the pool
        let entity: Entity | undefined;
        const pool = this.pools.get(type);

        if(pool && pool.length > 0){
            entity = pool.pop()!;
            this.resetEntityState(entity, prototype);
        } else {
            entity = new Entity('' + this.nextID++, type);
            this.deepAssign(entity, prototype.attributes);
        }

        // Apply custom parameters
        for(const param of Object.keys(params)){
            if(param in entity && !param.includes("_")) entity[param] = params[param];
        }

        // Extract context (namespace) for automatic inference whenever collection context isn't explicit.

        const splitted = type.split(".");
        const context = splitted.length == 2 ? splitted[0] : undefined;

        // Assign entity to collections

        for(let collection of (prototype.collections || [])){

            if(context) collection = `${context}.${collection}`;

            this.__kernox.collectionManager.addEntityTo(entity,collection);
            entity.linkTo(collection);
        }

        return entity as T;
    }

    public copyFromPrototype(recipient : Entity, prototype : PrototypeSchema<any>) : void {
        
        this.deepAssign(recipient,prototype.attributes);
    }

    /**
     * Returns an entity to its corresponding pool for later reuse.
     * The entity is removed from all collections before being pooled.
     * @param entity The entity to be returned to the pool
     */
    public sendToRest(entity : Entity) : void {

        const type = entity.type;

        // Remove entity from all collections
        const collections = Array.from(entity.collections());
        for(const collection of collections){
            this.__kernox.collectionManager.removeEntityFrom(entity, collection);
            entity.unlinkFrom(collection);
        }

        // Get or create pool for this type
        if(!this.pools.has(type)){
            this.pools.set(type, []);
        }

        // Add entity to pool
        this.pools.get(type)!.push(entity);
    }

    /**
     * Resets an entity's state to match its prototype's default values.
     * Clears all custom attributes, children, and collections.
     * @param entity The entity to reset
     * @param prototype The prototype schema to use for resetting
     */
    private resetEntityState(entity : Entity, prototype : PrototypeSchema<any>) : void {

        // Remove all custom attributes (keep only prototype-defined ones)
        const prototypeKeys = new Set(Object.keys(prototype.attributes));

        for(const key of Object.keys(entity)){
            if(!key.startsWith('_') && !prototypeKeys.has(key)){
                delete entity[key];
            }
        }

        // Clear children
        const children = entity['__children'] as { [name: string]: Entity };
        for(const childName of Object.keys(children)){
            entity.deleteChild(childName);
        }

        // Clear collections (they will be re-added when entity is created)
        const collections = Array.from(entity.collections());
        for(const collection of collections){
            entity.unlinkFrom(collection);
        }

        // Reset all attributes to prototype defaults
        this.deepAssign(entity, prototype.attributes);
    }

    private resolveImplicitNamespace(type : string) : PrototypeSchema<any> | undefined {

        const namespaces = this.__kernox.addonLoader.namespaces;

        var resolved, resource;

        for(const namespace of namespaces){

            resource = this.types.get(`${namespace}.${type}`);
            if(resource && !resolved) resolved = resource;
            else if(resource) throw new Error(`Ambiguous entity type '${type}' was requested: a namespace must be specified before it ( Ex. namespace.type ).`);
        }

        return resolved;
    }

    /**
     * Copies all attributes of a prototype into a recipient; if the prototype contains
     * objects or instances, original references are untouched, and deep copies are created instead.
     * @param recipient Destiny object, which will carry the properties
     * @param prototype Base object, from which properties are copied
     * @param seen (internal) Stores already assigned objects to avoid reasigning them on recursive calls
     * @returns Nothing, it mutates the recipient object 
     */

    private deepAssign(recipient : Object, prototype : any, seen = new WeakMap()) : void {
        
        if (seen.has(prototype)) return;
    
        seen.set(prototype, recipient);
    
        for (const key of Object.keys(prototype)) {
                        
            const value = prototype[key];
    
            // Primitives
            if (value === null || typeof value !== 'object') {
                recipient[key] = value;
            }
    
            // Arrays
            else if (Array.isArray(value)) {
                recipient[key] = [];
                this.deepAssign(recipient[key], value, seen);
            }
    
            // Class instance
            else if (value.constructor !== Object) {
                recipient[key] = new value.constructor();
                this.deepAssign(recipient[key], value, seen);
            }
    
            // Plane object
            else {
                recipient[key] = {};
                this.deepAssign(recipient[key], value, seen);
            }
        }     
    }
}