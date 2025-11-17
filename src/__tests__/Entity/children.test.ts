import { Entity } from "../../entity/Entity.js";

describe("Entity children management", () => {
    let parent: Entity;
    let child1: Entity;
    let child2: Entity;

    beforeEach(() => {
        parent = new Entity("parent", "ParentEntity");
        child1 = new Entity("child1", "ChildEntity");
        child2 = new Entity("child2", "ChildEntity");
    });

    test("Should append child entity", () => {
        parent.appendChild("child1", child1);
        
        const retrieved = parent.getChild("child1");
        expect(retrieved).toBe(child1);
    });

    test("Should throw error when appending duplicate child name", () => {
        parent.appendChild("child1", child1);
        
        expect(() => {
            parent.appendChild("child1", child2);
        }).toThrow("Child already exists with name 'child1' at entity 'parent'");
    });

    test("Should retrieve child by name", () => {
        parent.appendChild("child1", child1);
        parent.appendChild("child2", child2);
        
        expect(parent.getChild("child1")).toBe(child1);
        expect(parent.getChild("child2")).toBe(child2);
    });

    test("Should return undefined for non-existent child", () => {
        expect(parent.getChild("nonExistent")).toBeUndefined();
    });

    test("Should delete child", () => {
        parent.appendChild("child1", child1);
        parent.deleteChild("child1");
        
        expect(parent.getChild("child1")).toBeUndefined();
    });

    test("Should handle deleting non-existent child", () => {
        expect(() => {
            parent.deleteChild("nonExistent");
        }).not.toThrow();
    });
});


