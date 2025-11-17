import { Entity } from "../../entity/Entity.js";

describe("Entity collections management", () => {
    let entity: Entity;

    beforeEach(() => {
        entity = new Entity("123", "TestEntity");
    });

    test("Should link to collection", () => {
        entity.linkTo("TestCollection");
        expect(entity.belongsTo("TestCollection")).toBe(true);
    });

    test("Should unlink from collection", () => {
        entity.linkTo("TestCollection");
        entity.unlinkFrom("TestCollection");
        expect(entity.belongsTo("TestCollection")).toBe(false);
    });

    test("Should track multiple collections", () => {
        entity.linkTo("Collection1");
        entity.linkTo("Collection2");
        entity.linkTo("Collection3");
        
        expect(entity.belongsTo("Collection1")).toBe(true);
        expect(entity.belongsTo("Collection2")).toBe(true);
        expect(entity.belongsTo("Collection3")).toBe(true);
        
        const collections = entity.collections();
        expect(collections.size).toBe(3);
    });

    test("Should return collections set", () => {
        entity.linkTo("Collection1");
        entity.linkTo("Collection2");
        
        const collections = entity.collections();
        expect(collections).toBeInstanceOf(Set);
        expect(collections.has("Collection1")).toBe(true);
        expect(collections.has("Collection2")).toBe(true);
    });

    test("Should handle unlinking from non-existent collection", () => {
        expect(() => {
            entity.unlinkFrom("NonExistent");
        }).not.toThrow();
        expect(entity.belongsTo("NonExistent")).toBe(false);
    });
});


