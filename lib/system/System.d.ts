import type { Kernox } from "../Kernox";
import type { EventHandler } from "../event/EventBroker";
import type { AbstractCollection } from "../collection/AbstractCollection";
/**
 * Encapsulates application logic which is part of kernox's execution loop.
 *
 * Systems are firt-class-citizens: they can emit and listen to events, request and update collections,
 * and process entities.
 */
export declare class System {
    readonly __kernox: Kernox;
    protected __context: string;
    protected __paused: boolean;
    constructor(__kernox: Kernox, __context: string);
    /**
     * Called once during addon setup.
     */
    init(): void;
    /**
     * Method called by kernox on every frame, when paused is false.
     */
    execute(): void;
    /**
     * Name of the addon the system is related to.
     */
    get context(): string;
    /**
     * Prevents the execution of the system when true.
     */
    get paused(): boolean;
    set paused(state: boolean);
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
    attachToEvent(eventName: string, handler: EventHandler): boolean;
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
    dispatchEvent(eventName: string, details: object): void;
    /**
     * Retrieves a collection to CollectionManager if found.
     * @param collectionName Name of collection
     * @returns an entitity collection or undefined
     */
    getCollection<T extends AbstractCollection = any>(collectionName: string): T;
    /**
     * @param resourceName Name of whatever it is being requested
     * @returns
     */
    private resolveResourceName;
}
