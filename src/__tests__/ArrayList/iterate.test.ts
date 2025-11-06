import { Entity } from "../../entity/Entity";
import { ArrayList } from "../../Kernox";

describe("ArrayList.iterate()", () => {
    
    const collection = new ArrayList();

    it("must traverse the entire list in insertion order", () => {

        const entity0 = new Entity("0","Dummy");
        const entity1 = new Entity("1","Dummy");
        const entity2 = new Entity("2","Dummy");
        const entity3 = new Entity("3","Dummy");
    
        (collection as any).entities.push(entity0);
        (collection as any).entities.push(entity1);
        (collection as any).entities.push(entity2);
        (collection as any).entities.push(entity3);

        for(const entity of collection){
            expect(entity).toBeInstanceOf(Entity);
        }
    });
});