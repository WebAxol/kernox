import { Entity } from "../../entity/Entity";
import { ArrayList } from "../../Kernox";

describe("ArrayList.insert()", () => {

    const collection = new ArrayList();
    const entity = new Entity("Dummy","1");
    const func = () => { return collection.insert(entity) };

    it("must append an entity to the collection if not within, and return true", () => {
        expect(func()).toBeTruthy();
        expect((collection as any).entities.indexOf(entity)).not.toBe(-1);
        expect((collection as any).entities.length).toBe(1);
    });

    it("must return false if the entity already belongs to the collection", () => {
        expect(func()).toBeFalsy();
        expect((collection as any).entities.indexOf(entity)).not.toBe(-1);
        expect((collection as any).entities.length).toBe(1);
    });
});