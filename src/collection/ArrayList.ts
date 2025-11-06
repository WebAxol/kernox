import { AbstractCollection } from "./AbstractCollection.js";
import { Entity } from "../entity/Entity.js";

export class ArrayList<T extends Entity = any> extends AbstractCollection{
    
    protected readonly entities: T[] = [];
    protected readonly ids : Set<string> = new Set();
    protected __changed : boolean = false;

    /**
     * Appends an entity at the end of the current collection.
     * @returns True if a new entity was added, and false otherwise.
     */
    public insert(entity: T): boolean {
        
        if(this.has(entity)) return false;
        
        this.entities.push(entity);
        entity.linkTo(this.constructor.name);
        this.__changed = true;
        
        return true;
    }

    /**
     * Removes an entity from the current collection, if exists.
     * @returns True if the entity was removed, and false otherwise.
     */
    public remove(entity: T): boolean {

        const index : number = this.entities.indexOf(entity);

        if(index == -1) return false;
        
        this.ids.delete(entity.id);
        this.entities.splice(index,1);

        entity.unlinkFrom(this.constructor.name);
        this.__changed = true;

        return true;
    }

    /**
     * Evaluates if a given entity belongs to the collection.
     */
    public has(entity: T): boolean {
        return this.entities.indexOf(entity) != -1;
    }

    *[Symbol.iterator](){
        yield* this.entities;
    }

    /**
     * Sorts the entity array. This mutates the collection structure.
     * @param criteria function that compares entity pairs at sorting
     */
    public sort(criteria : (a : T, b : T) => number){
        this.entities.sort(criteria);
    }

    /**
     * @param criteria Boolean callback used to filter entities.
     * @returns Similar to 'toArray', but returns a filtered array of entities from the collection.
     */
    public filter(criteria : (entity : T) => boolean) :T[] {
        return this.entities.filter(criteria);
    }

    /**
     * Retrieves a shallow copy of the entity array, allowing processing and mutation of entities,
     * but keeping the original structure unmutated.
     * @returns an entity array
     */
    public asArray(){
        return Array.from(this.entities);
    }

    /**
     * Access an element within the collection by index.
     * @param index position within the entity array to be accessed
     * @returns entity if exists, or undefined otherwise
     */
    public get(index : number){
        return this.entities[index];
    }

    /**
     * @returns The number of entities within the collection.
     */
    public size() : number {
        return this.entities.length;
    }

    public get changed(){
        return this.__changed;
    }    
}
