import { System } from "../../system/System.js";
import { Kinetics, Renderables } from "../setup/collections.js";
import { CollectionProxy } from "../../collection/CollectionProxy.js";

export class CollisionSystem extends System {
  
  private kinetics! : CollectionProxy<Kinetics>;

  public init() : void {
    // Use CollectionProxy to automatically update when scenes change
    this.kinetics = this.__kernox.collectionManager.getSmartWrapper<Kinetics>("demoApp.Kinetics");
  }

  public execute() : void {
    // Called each frame

    // Collections are iterable
    for(const entity of this.kinetics){
        this.bounceAtEdge(entity);
        this.bounceWithOthers(entity);
    };
  }

  private bounceAtEdge(entity : any){

    if(entity.position.y + entity.radius > 500){ 
        entity.position.y = 500 - entity.radius;
        entity.velocity.y *= -1;
    }

    else if(entity.position.y - entity.radius < 0){ 
        entity.position.y = 0 + entity.radius;
        entity.velocity.y *= -1;
    }

    else if(entity.position.x + entity.radius > 1000){ 
        entity.position.x = 1000 - entity.radius;
        entity.velocity.x *= -1;
    }

    else if(entity.position.x - entity.radius < 0){ 
        entity.position.x = 0 + entity.radius;
        entity.velocity.x *= -1;
    }
  }

  private bounceWithOthers(entity : any){
   
    for(const peer of this.kinetics){

        const dx = peer.position.x - entity.position.x;
        const dy = peer.position.y - entity.position.y;
    
        const dist = Math.hypot(dx, dy);
        const minDist = entity.radius + peer.radius;
    
        if (dist < minDist && dist !== 0) {

          const nx = dx / dist;
          const ny = dy / dist;
    
          const tx = -ny;
          const ty = nx;
    
          const v1n = entity.velocity.x * nx + entity.velocity.y * ny;
          const v1t = entity.velocity.x * tx + entity.velocity.y * ty;
    
          const v2n = peer.velocity.x * nx + peer.velocity.y * ny;
          const v2t = peer.velocity.x * tx + peer.velocity.y * ty;
    
          const v1nAfter = v2n;
          const v2nAfter = v1n;
    
          entity.velocity.x = v1nAfter * nx + v1t * tx;
          entity.velocity.y = v1nAfter * ny + v1t * ty;
    
          peer.velocity.x = v2nAfter * nx + v2t * tx;
          peer.velocity.y = v2nAfter * ny + v2t * ty;
    
          const overlap = (minDist - dist) / 2;
          entity.position.x -= overlap * nx;
          entity.position.y -= overlap * ny;
    
          peer.position.x += overlap * nx;
          peer.position.y += overlap * ny;

          // Fire event on collision

          this.dispatchEvent("collision",{ 
            // Event details
            obj1 : entity,
            obj2 : peer
          });
        }
    };

  }
};