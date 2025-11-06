import type { Kernox } from "../Kernox.js";
import type { EventHandler } from "../event/EventBroker.js";
import type { AbstractCollection } from "../collection/AbstractCollection.js";
/**
 * Encapsulates application logic which is part of kernox's execution loop.
 * 
 * Systems are firt-class-citizens: they can emit and listen to events, request and update collections, 
 * and process entities.
 */
export class System {
    
    protected __paused : boolean = false;

    constructor(
        public readonly __kernox : Kernox,
        protected __context : string
    ){}


    /**
     * Called once during addon setup.
     */
    public init(){}

    /**
     * Method called by kernox on every frame, when paused is false.
     */
    public execute(){}

    /**
     * Name of the addon the system is related to.
     */
    public get context(){
        return this.__context;
    }

    /**
     * Prevents the execution of the system when true.
     */
    public get paused(){
        return this.__paused;
    }

    public set paused(state : boolean){
        this.__paused = state;
    }

    /**
     * Attaches callback to an event, so it is called whenever the event is emitted.
     *
     * Note: By default, the system's context is assumed, unless a namespace is defined (ex. eventName = 'physics.collision').
     * @param eventName Name of the event (it is registered if not yet).
     * @param callback Handler function that receives one parameter.
     * @returns True if attachment was successfull, false otherwise.
     * @example 
     * 
     * import { System } from "kernox";
     * 
     * class MovementSystem extends System {
     * 
     *    public init(){
     *       this.attachToEvent("playerInput", this.onPlayerInput)
     *    };
     * 
     *    public execute(){
     *      // Etc...
     *    }
     * 
     *    public onPlayerInput(details){
     *       console.log("The player interacted", details);
     *    }
     * };
     */
    public attachToEvent(eventName : string, handler : EventHandler) : boolean {
        const resourceName = this.resolveResourceName(eventName);
        return this.__kernox.eventBroker.attachToEvent(resourceName, handler);    
    }

    /**
     * Notifies an event to the EventBroker. 
     * 
     * Note: By default, the system's context is assumed, unless a namespace is defined (ex. eventName = 'physics.collision').
     * @param eventName Name of the event.
     * @param details Additional information related to the event.
     * @example
     * import { System } from "kernox";
     * import { player } from "./player";
     * 
     * class MovementSystem extends System {
     * 
     *    public init(){
     *       this.attachToEvent("playerInput", this.onPlayerInput)
     *    };
     * 
     *    public execute(){
     *      if(player.jumped) this.dispatchEvent("playerJump", { player });
     *      // Event triggered when player jumps ^^^
     *    }
     * };
     */
    public dispatchEvent(eventName : string, details : object) : void {
        this.__kernox.eventBroker.dispatch(eventName,details);
    }

    /**
     * Retrieves a collection to CollectionManager if found.
     * @param collectionName Name of collection
     * @returns an entitity collection or undefined
     */
    public getCollection<T extends AbstractCollection = any>(collectionName : string) : T {
        const resourceName = this.resolveResourceName(collectionName);
        const collection = this.__kernox.collectionManager.get<T>(resourceName);
        if(!collection) throw Error(`Collection '${resourceName}' was not found`);
        return collection;
    }
    
    /**
     * @param resourceName Name of whatever it is being requested
     * @returns 
     */
    private resolveResourceName(resourceName) : string {
        const splittedName = resourceName.split("."); 
        var context = this.context;
        var baseName = resourceName;
        
        if(splittedName.length == 2) [ context, baseName ] = splittedName;
        const fullName = context ? `${context}.${baseName}` : resourceName;
        return fullName;
    }
}