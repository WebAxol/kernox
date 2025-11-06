import { Entity } from "../entity/Entity.js";

export abstract class AbstractCollection {

    protected abstract entities  : any;
    protected abstract __changed : boolean;
    abstract insert(entity : Entity) : boolean;
    abstract remove(entity : Entity) : boolean;
}