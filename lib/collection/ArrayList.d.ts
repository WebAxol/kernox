import { AbstractCollection } from "./AbstractCollection";
import { Entity } from "../entity/Entity";
export declare class ArrayList<T extends Entity = any> extends AbstractCollection {
    protected readonly entities: T[];
    protected readonly ids: Set<string>;
    protected __changed: boolean;
    /**
     * Appends an entity at the end of the current collection.
     * @returns True if a new entity was added, and false otherwise.
     */
    insert(entity: T): boolean;
    /**
     * Removes an entity from the current collection, if exists.
     * @returns True if the entity was removed, and false otherwise.
     */
    remove(entity: T): boolean;
    /**
     * Evaluates if a given entity belongs to the collection.
     */
    has(entity: T): boolean;
    [Symbol.iterator](): Generator<T, void, unknown>;
    /**
     * Sorts the entity array. This mutates the collection structure.
     * @param criteria function that compares entity pairs at sorting
     */
    sort(criteria: (a: T, b: T) => number): void;
    /**
     * @param criteria Boolean callback used to filter entities.
     * @returns Similar to 'toArray', but returns a filtered array of entities from the collection.
     */
    filter(criteria: (entity: T) => boolean): T[];
    /**
     * Retrieves a shallow copy of the entity array, allowing processing and mutation of entities,
     * but keeping the original structure unmutated.
     * @returns an entity array
     */
    asArray(): T[];
    /**
     * Access an element within the collection by index.
     * @param index position within the entity array to be accessed
     * @returns entity if exists, or undefined otherwise
     */
    get(index: number): T;
    /**
     * @returns The number of entities within the collection.
     */
    size(): number;
    get changed(): boolean;
}
