import { AbstractCollection } from "./AbstractCollection.js";
import { Entity } from "../entity/Entity.js";

/**
 * CollectionProxy that reacts to scene changes and proxies collection methods.
 * This wrapper maintains a reference to the active collection and automatically
 * updates when the scene changes, so systems don't have to manually update their
 * collection references.
 */
export class CollectionProxy<T extends AbstractCollection = AbstractCollection> extends AbstractCollection {
    
    private _collection: T;
    private readonly collectionName: string;
    private readonly onUpdateCallback: (wrapper: CollectionProxy<T>) => void;

    protected entities: any;
    protected __changed: boolean = false;

    /**
     * Creates a new CollectionProxy that proxies to the specified collection.
     * @param collectionName The name of the collection to wrap
     * @param initialCollection The initial collection instance to proxy
     * @param onUpdateCallback Callback to notify when the collection reference is updated
     */
    constructor(
        collectionName: string,
        initialCollection: T,
        onUpdateCallback: (wrapper: CollectionProxy<T>) => void
    ) {
        super();
        this.collectionName = collectionName;
        this._collection = initialCollection;
        this.onUpdateCallback = onUpdateCallback;
        this.updateInternalState();
    }

    /**
     * Updates the internal collection reference. Called by CollectionManager when scene changes.
     * @param newCollection The new collection instance to proxy
     */
    public updateCollection(newCollection: T): void {
        this._collection = newCollection;
        this.updateInternalState();
        this.onUpdateCallback(this);
    }

    /**
     * Gets the current collection being proxied.
     */
    public get collection(): T {
        return this._collection;
    }

    /**
     * Gets the collection name this wrapper is associated with.
     */
    public get name(): string {
        return this.collectionName;
    }

    /**
     * Updates internal state to match the current collection.
     */
    private updateInternalState(): void {
        // Access protected properties through type assertion
        this.entities = (this._collection as any).entities;
        this.__changed = (this._collection as any).__changed;
    }

    // AbstractCollection required methods
    public insert(entity: Entity): boolean {
        const result = this._collection.insert(entity);
        this.updateInternalState();
        return result;
    }

    public remove(entity: Entity): boolean {
        const result = this._collection.remove(entity);
        this.updateInternalState();
        return result;
    }

    // Proxy common ArrayList methods
    public has(entity: Entity): boolean {
        return (this._collection as any).has?.(entity) ?? false;
    }

    public sort(criteria?: (a: Entity, b: Entity) => number): void {
        if (typeof (this._collection as any).sort === 'function') {
            (this._collection as any).sort(criteria);
            this.updateInternalState();
        }
    }

    public filter(criteria: (entity: Entity) => boolean): Entity[] {
        if (typeof (this._collection as any).filter === 'function') {
            return (this._collection as any).filter(criteria);
        }
        return [];
    }

    public asArray(): Entity[] {
        if (typeof (this._collection as any).asArray === 'function') {
            return (this._collection as any).asArray();
        }
        return [];
    }

    public get(index: number): Entity | undefined {
        if (typeof (this._collection as any).get === 'function') {
            return (this._collection as any).get(index);
        }
        return undefined;
    }

    public size(): number {
        if (typeof (this._collection as any).size === 'function') {
            return (this._collection as any).size();
        }
        return 0;
    }

    public get changed(): boolean {
        this.updateInternalState();
        return this.__changed;
    }

    // Iterator support
    *[Symbol.iterator]() {
        if (this._collection && typeof this._collection[Symbol.iterator] === 'function') {
            yield* this._collection as any;
        }
    }

    // Proxy any other method calls dynamically
    // Note: TypeScript doesn't support public index signatures, but methods
    // are accessible through the collection property if needed
}
