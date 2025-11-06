import type { PrototypeSchema } from "./PrototypeSchema";
import { Entity } from "./Entity";
import { Kernox } from "../Kernox";
export declare class EntityFactory {
    private __kernox;
    private types;
    private pools;
    private nextID;
    constructor(__kernox: Kernox);
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
    prototype(prototype: PrototypeSchema<any>, namespace?: string): void;
    /**
     * Instantiates an entity: an object populated with the attributes defined by its prototype, which by default
     * contains the same values as it. Specific values can be assigned by adding them to the 'params' dictionary.
     * @param type Entity type, related to an existing prototype
     * @param params Dictionary of custom parameters, with which an entity's matching attributes will be defined
     * @returns An entity of the given type built based on its prototype (and parameters if any)
     */
    create<T extends Entity = any>(type: string, params?: object): T;
    copyFromPrototype(recipient: Entity, prototype: PrototypeSchema<any>): void;
    sendToRest(entity: Entity): void;
    private resolveImplicitNamespace;
    /**
     * Copies all attributes of a prototype into a recipient; if the prototype contains
     * objects or instances, original references are untouched, and deep copies are created instead.
     * @param recipient Destiny object, which will carry the properties
     * @param prototype Base object, from which properties are copied
     * @param seen (internal) Stores already assigned objects to avoid reasigning them on recursive calls
     * @returns Nothing, it mutates the recipient object
     */
    private deepAssign;
}
