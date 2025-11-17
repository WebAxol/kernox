import { System } from "../../system/System.js";
import type { Renderables } from "../setup/collections.js";
import { CollectionProxy } from "../../collection/CollectionProxy.js";

export class RenderingSystem extends System {

    private renderables! : CollectionProxy<Renderables>;
    private ctx! : CanvasRenderingContext2D;

    public init() : void {

        // Define rendering context
        
        const ctx = document.querySelector("canvas")?.getContext("2d");

        if(!ctx) throw Error("Could not prepare rendering context");

        this.ctx = ctx;

        // Use CollectionProxy to automatically update when scenes change
        this.renderables = this.__kernox.collectionManager.getSmartWrapper<Renderables>("demoApp.Renderables");
    }


    // Called each frame
    public execute(): void {
    
        this.ctx.clearRect(0,0,1000,500);

        for(const entity of this.renderables){
            
            this.ctx.beginPath();
            this.ctx.arc(
                entity.position.x,
                entity.position.y,
                entity.radius,
                0,
                2 * Math.PI
            );
            
            this.ctx.fillStyle = entity.color;
            this.ctx.lineWidth = 5;
            this.ctx.strokeStyle = 'black';

            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }
};