import { Entity } from "../../entity/Entity";
import { ArrayList } from "../../Kernox";

describe("ArrayList.insert()", () => {
    
    const collection = new ArrayList();
 
    const entity1 = new Entity("Dummy","1");
    const entity2 = new Entity("Dummy","2");
    const entity3 = new Entity("Dummy","3");

    (collection as any).entities.push(entity1);
    (collection as any).entities.push(entity2);
    (collection as any).entities.push(entity3);

    var entity : any;
    const func = () => { return collection.remove(entity) }

    it("must remove an entity if it exists within the collection and return true", () => {
        
        expect((collection as any).entities.length).toBe(3);
        
        entity = entity1;
        expect(func()).toBeTruthy();
        expect((collection as any).entities.length).toBe(2);
        expect((collection as any).entities.indexOf(entity1)).toBe(-1);
        expect((collection as any).entities.indexOf(entity2)).not.toBe(-1);
        expect((collection as any).entities.indexOf(entity3)).not.toBe(-1);
        
        entity = entity2;
        expect(func()).toBeTruthy();
        expect((collection as any).entities.length).toBe(1);
        expect((collection as any).entities.indexOf(entity)).toBe(-1);
        expect((collection as any).entities.indexOf(entity2)).toBe(-1);
        expect((collection as any).entities.indexOf(entity3)).not.toBe(-1);

        entity = entity3;
        expect(func()).toBeTruthy();
        expect((collection as any).entities.length).toBe(0);
        expect((collection as any).entities.indexOf(entity)).toBe(-1);
        expect((collection as any).entities.indexOf(entity2)).toBe(-1);
        expect((collection as any).entities.indexOf(entity3)).toBe(-1);
    });

    it("must return false if the entity does not belong to the collection", () => {
        entity = new Entity("Dummy", "4");
        expect(func()).toBeFalsy();
        expect((collection as any).entities.length).toBe(0);
        expect((collection as any).entities.indexOf(entity)).toBe(-1);

        entity = entity1
        expect(func()).toBeFalsy();
        expect((collection as any).entities.length).toBe(0);
        expect((collection as any).entities.indexOf(entity)).toBe(-1);
    });
});