import { EntityFactory } from "../../entity/EntityFactory.js";
import { enemyPrototype, playerPrototype, corpsePrototype } from "../__samples__/prototypes.js";
import { Kernox } from "../../Kernox.js";
import { Circles, Dead, Enemies, Kinetics } from "../__samples__/collections.js";

describe("EntityFactory Object Pool", () => {
    let kernox: Kernox;

    beforeEach(() => {
        kernox = new Kernox();
        kernox.entityFactory.prototype(enemyPrototype);
        kernox.entityFactory.prototype(playerPrototype);
        kernox.entityFactory.prototype(corpsePrototype);
        kernox.collectionManager.use(Enemies);
        kernox.collectionManager.use(Dead);
        kernox.collectionManager.use(Circles);
        kernox.collectionManager.use(Kinetics);
    });

    describe("Entity Recycling", () => {
        test("Should create new entity when pool is empty", () => {
            const entity1 = kernox.entityFactory.create("Enemy") as any;
            expect(entity1.id).toBe("0");
            expect(entity1.type).toBe("Enemy");
        });

        test("Should recycle entity from pool instead of creating new one", () => {
            // Create first entity
            const entity1 = kernox.entityFactory.create("Enemy") as any;
            const firstId = entity1.id;

            // Send to pool
            kernox.entityFactory.sendToRest(entity1);

            // Create second entity - should recycle
            const entity2 = kernox.entityFactory.create("Enemy") as any;

            // Same ID means it was recycled, not newly instantiated
            expect(entity2.id).toBe(firstId);
            expect(entity2.type).toBe("Enemy");
        });

        test("Should only instantiate new entities when pool is empty", () => {
            // Create and pool multiple entities
            const entity1 = kernox.entityFactory.create("Enemy") as any;
            const entity2 = kernox.entityFactory.create("Enemy") as any;
            const entity3 = kernox.entityFactory.create("Enemy") as any;

            const id1 = entity1.id;
            const id2 = entity2.id;
            const id3 = entity3.id;

            // Pool all three
            kernox.entityFactory.sendToRest(entity1);
            kernox.entityFactory.sendToRest(entity2);
            kernox.entityFactory.sendToRest(entity3);

            // Request 3 entities - all should be recycled
            const recycled1 = kernox.entityFactory.create("Enemy") as any;
            const recycled2 = kernox.entityFactory.create("Enemy") as any;
            const recycled3 = kernox.entityFactory.create("Enemy") as any;

            // All IDs should match original entities (recycled)
            const recycledIds = [recycled1.id, recycled2.id, recycled3.id];
            expect(recycledIds).toContain(id1);
            expect(recycledIds).toContain(id2);
            expect(recycledIds).toContain(id3);

            // Request one more - pool is empty, should create NEW entity
            const newEntity = kernox.entityFactory.create("Enemy") as any;
            expect(newEntity.id).not.toBe(id1);
            expect(newEntity.id).not.toBe(id2);
            expect(newEntity.id).not.toBe(id3);
        });
    });

    describe("Type-Specific Pools", () => {
        test("Each entity type should have its own separate pool", () => {
            // Create entities of different types
            const enemy = kernox.entityFactory.create("Enemy") as any;
            const player = kernox.entityFactory.create("Player") as any;

            const enemyId = enemy.id;
            const playerId = player.id;

            // Pool them
            kernox.entityFactory.sendToRest(enemy);
            kernox.entityFactory.sendToRest(player);

            // Request Enemy - should get Enemy from pool, not Player
            const recycledEnemy = kernox.entityFactory.create("Enemy") as any;
            expect(recycledEnemy.id).toBe(enemyId);
            expect(recycledEnemy.type).toBe("Enemy");

            // Request Player - should get Player from pool
            const recycledPlayer = kernox.entityFactory.create("Player") as any;
            expect(recycledPlayer.id).toBe(playerId);
            expect(recycledPlayer.type).toBe("Player");
        });

        test("Should not mix entities from different type pools", () => {
            const enemy1 = kernox.entityFactory.create("Enemy") as any;
            const player1 = kernox.entityFactory.create("Player") as any;
            const corpse1 = kernox.entityFactory.create("Corpse") as any;

            kernox.entityFactory.sendToRest(enemy1);
            kernox.entityFactory.sendToRest(player1);
            kernox.entityFactory.sendToRest(corpse1);

            // Request different type
            const enemy2 = kernox.entityFactory.create("Enemy") as any;
            expect(enemy2.id).toBe(enemy1.id);
            expect(enemy2.type).toBe("Enemy");

            // Verify it's not a player or corpse
            expect(enemy2.type).not.toBe("Player");
            expect(enemy2.type).not.toBe("Corpse");
        });
    });

    describe("State Reset", () => {
        test("Should reset all prototype attributes to default values", () => {
            // Create entity with custom values
            const enemy = kernox.entityFactory.create("Enemy", {
                hp: 50,
                damage: 25,
                position: { x: 100, y: 200 },
                velocity: { x: 5, y: 10 }
            }) as any;

            expect(enemy.hp).toBe(50);
            expect(enemy.damage).toBe(25);
            expect(enemy.position).toEqual({ x: 100, y: 200 });
            expect(enemy.velocity).toEqual({ x: 5, y: 10 });

            // Pool and recycle
            kernox.entityFactory.sendToRest(enemy);
            const recycled = kernox.entityFactory.create("Enemy") as any;

            // Should have default prototype values
            expect(recycled.hp).toBe(100); // default from prototype
            expect(recycled.damage).toBe(10); // default from prototype
            expect(recycled.position).toEqual({ x: 0, y: 0 }); // default
            expect(recycled.velocity).toEqual({ x: 0, y: 0 }); // default
        });

        test("Should remove custom attributes not in prototype", () => {
            // Create entity
            const enemy = kernox.entityFactory.create("Enemy") as any;

            // Add custom attributes
            enemy.customAttribute = "custom";
            enemy.extraData = { foo: "bar" };

            expect(enemy.customAttribute).toBe("custom");
            expect(enemy.extraData).toEqual({ foo: "bar" });

            // Pool and recycle
            kernox.entityFactory.sendToRest(enemy);
            const recycled = kernox.entityFactory.create("Enemy") as any;

            // Custom attributes should be removed
            expect(recycled.customAttribute).toBeUndefined();
            expect(recycled.extraData).toBeUndefined();

            // Prototype attributes should exist
            expect(recycled.hp).toBeDefined();
            expect(recycled.damage).toBeDefined();
        });

        test("Should clear all children", () => {
            const parent = kernox.entityFactory.create("Enemy") as any;
            const child1 = kernox.entityFactory.create("Player") as any;
            const child2 = kernox.entityFactory.create("Corpse") as any;

            // Add children
            parent.appendChild("child1", child1);
            parent.appendChild("child2", child2);

            expect(parent.getChild("child1")).toBe(child1);
            expect(parent.getChild("child2")).toBe(child2);

            // Pool and recycle
            kernox.entityFactory.sendToRest(parent);
            const recycled = kernox.entityFactory.create("Enemy") as any;

            // Children should be cleared
            expect(recycled.getChild("child1")).toBeUndefined();
            expect(recycled.getChild("child2")).toBeUndefined();
        });

        test("Should clear and re-add collections", () => {
            const enemy = kernox.entityFactory.create("Enemy") as any;

            // Enemy should be in collections from prototype
            expect(enemy.belongsTo("Enemies")).toBe(true);
            expect(enemy.belongsTo("Circles")).toBe(true);
            expect(enemy.belongsTo("Kinetics")).toBe(true);

            // Pool entity
            kernox.entityFactory.sendToRest(enemy);

            // After pooling, should be removed from collections
            expect(enemy.collections().size).toBe(0);

            // Recycle entity
            const recycled = kernox.entityFactory.create("Enemy") as any;

            // Should be re-added to collections
            expect(recycled.belongsTo("Enemies")).toBe(true);
            expect(recycled.belongsTo("Circles")).toBe(true);
            expect(recycled.belongsTo("Kinetics")).toBe(true);
        });

        test("Should handle custom params after recycling", () => {
            // Create and pool entity
            const enemy = kernox.entityFactory.create("Enemy") as any;
            kernox.entityFactory.sendToRest(enemy);

            // Recycle with custom params
            const recycled = kernox.entityFactory.create("Enemy", {
                hp: 75,
                damage: 30,
                position: { x: 50, y: 75 }
            }) as any;

            // Should have custom values
            expect(recycled.hp).toBe(75);
            expect(recycled.damage).toBe(30);
            expect(recycled.position).toEqual({ x: 50, y: 75 });

            // Other attributes should be defaults
            expect(recycled.velocity).toEqual({ x: 0, y: 0 });
        });
    });

    describe("Pool Integrity", () => {
        test("Should maintain separate counters for pooled vs new entities", () => {
            const entity1 = kernox.entityFactory.create("Enemy") as any;
            const entity2 = kernox.entityFactory.create("Enemy") as any;

            expect(entity1.id).toBe("0");
            expect(entity2.id).toBe("1");

            // Pool first entity
            kernox.entityFactory.sendToRest(entity1);

            // Create new entity (should recycle id "0")
            const entity3 = kernox.entityFactory.create("Enemy") as any;
            expect(entity3.id).toBe("0");

            // Create another new entity (pool empty, should get new ID "2")
            const entity4 = kernox.entityFactory.create("Enemy") as any;
            expect(entity4.id).toBe("2");
        });

        test("Should handle multiple pool/recycle cycles", () => {
            const entity = kernox.entityFactory.create("Enemy", { hp: 100 }) as any;
            const originalId = entity.id;

            for (let i = 0; i < 5; i++) {
                // Modify entity
                entity.hp = 50 + i;
                entity.damage = 20 + i;

                // Pool it
                kernox.entityFactory.sendToRest(entity);

                // Recycle it
                const recycled = kernox.entityFactory.create("Enemy") as any;

                // Should be same entity
                expect(recycled.id).toBe(originalId);

                // Should have reset values
                expect(recycled.hp).toBe(100);
                expect(recycled.damage).toBe(10);
            }
        });

        test("Should handle array attributes correctly during reset", () => {
            const enemy = kernox.entityFactory.create("Enemy") as any;

            // Modify array
            enemy.loot.push("Gem");
            enemy.loot.push("Potion");
            expect(enemy.loot).toEqual(["Sword", "Gold", "Gem", "Potion"]);

            // Pool and recycle
            kernox.entityFactory.sendToRest(enemy);
            const recycled = kernox.entityFactory.create("Enemy") as any;

            // Should have fresh default array
            expect(recycled.loot).toEqual(["Sword", "Gold"]);
        });
    });
});
