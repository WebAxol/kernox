import { Entity } from "../../entity/Entity.js";

describe("Entity", () => {
    let entity: Entity;

    beforeEach(() => {
        entity = new Entity("123", "TestEntity");
    });

    test("Should have correct id and type", () => {
        expect(entity.id).toBe("123");
        expect(entity.type).toBe("TestEntity");
    });

    test("Should not belong to any collection initially", () => {
        expect(entity.belongsTo("SomeCollection")).toBe(false);
    });

    test("Should have empty collections set initially", () => {
        const collections = entity.collections();
        expect(collections.size).toBe(0);
    });
});


