import { Kernox } from "../../Kernox.js";
import { CollectionManager } from "../../collection/CollectionManager.js";
import { ArrayList } from "../../collection/ArrayList.js";
import { Entity } from "../../entity/Entity.js";

class Players extends ArrayList {}
class Enemies extends ArrayList {}

describe("CollectionManager scene isolation", () => {
    let kernox: Kernox;
    let collectionManager: CollectionManager;
    
    beforeEach(() => {
        kernox = new Kernox();
        collectionManager = kernox.collectionManager;
        collectionManager.use(Players);
        collectionManager.use(Enemies);
    });

    test("Should isolate entities between scenes", () => {
        // Create entities in default scene
        const player1 = new Entity("1", "Player");
        const player2 = new Entity("2", "Player");
        
        collectionManager.addEntityTo(player1, "Players");
        collectionManager.addEntityTo(player2, "Players");
        
        const defaultPlayers = collectionManager.get<Players>("Players");
        expect(defaultPlayers.size()).toBe(2);
        
        // Switch to new scene
        collectionManager.switchScene("level1");
        const level1Players = collectionManager.get<Players>("Players");
        
        // New scene should have empty collection
        expect(level1Players.size()).toBe(0);
        expect(level1Players).not.toBe(defaultPlayers);
    });

    test("Should maintain separate entity sets per scene", () => {
        const player1 = new Entity("1", "Player");
        const player2 = new Entity("2", "Player");
        const player3 = new Entity("3", "Player");
        
        // Add to default scene
        collectionManager.addEntityTo(player1, "Players");
        collectionManager.addEntityTo(player2, "Players");
        
        // Switch to level1 and add different entities
        collectionManager.switchScene("level1");
        collectionManager.addEntityTo(player3, "Players");
        
        const level1Players = collectionManager.get<Players>("Players");
        expect(level1Players.size()).toBe(1);
        expect(level1Players.has(player3)).toBe(true);
        expect(level1Players.has(player1)).toBe(false);
        
        // Switch back to default
        collectionManager.switchScene("default");
        const defaultPlayers = collectionManager.get<Players>("Players");
        expect(defaultPlayers.size()).toBe(2);
        expect(defaultPlayers.has(player1)).toBe(true);
        expect(defaultPlayers.has(player2)).toBe(true);
        expect(defaultPlayers.has(player3)).toBe(false);
    });

    test("Should handle entity removal per scene", () => {
        const player1 = new Entity("1", "Player");
        const player2 = new Entity("2", "Player");
        
        // Add to default scene
        collectionManager.addEntityTo(player1, "Players");
        collectionManager.addEntityTo(player2, "Players");
        
        // Switch to level1 and add same entities
        collectionManager.switchScene("level1");
        collectionManager.addEntityTo(player1, "Players");
        collectionManager.addEntityTo(player2, "Players");
        
        // Remove from level1
        collectionManager.removeEntityFrom(player1, "Players");
        
        const level1Players = collectionManager.get<Players>("Players");
        expect(level1Players.size()).toBe(1);
        expect(level1Players.has(player2)).toBe(true);
        
        // Default scene should still have both
        collectionManager.switchScene("default");
        const defaultPlayers = collectionManager.get<Players>("Players");
        expect(defaultPlayers.size()).toBe(2);
    });

    test("Should work with multiple collection types per scene", () => {
        const player = new Entity("1", "Player");
        const enemy = new Entity("2", "Enemy");
        
        collectionManager.addEntityTo(player, "Players");
        collectionManager.addEntityTo(enemy, "Enemies");
        
        collectionManager.switchScene("level1");
        
        const level1Player = new Entity("3", "Player");
        const level1Enemy = new Entity("4", "Enemy");
        
        collectionManager.addEntityTo(level1Player, "Players");
        collectionManager.addEntityTo(level1Enemy, "Enemies");
        
        const level1Players = collectionManager.get<Players>("Players");
        const level1Enemies = collectionManager.get<Enemies>("Enemies");
        
        expect(level1Players.size()).toBe(1);
        expect(level1Enemies.size()).toBe(1);
        
        // Default scene should still have its entities
        collectionManager.switchScene("default");
        const defaultPlayers = collectionManager.get<Players>("Players");
        const defaultEnemies = collectionManager.get<Enemies>("Enemies");
        
        expect(defaultPlayers.size()).toBe(1);
        expect(defaultEnemies.size()).toBe(1);
    });
});

