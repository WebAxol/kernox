import { System } from "../../system/System.js";
import { Kinetics } from "../setup/collections.js";
import { CollectionProxy } from "../../collection/CollectionProxy.js";

export class MovementSystem extends System {
  
  private kinetics! : CollectionProxy<Kinetics>;

  public init() : void {
    // Use CollectionProxy to automatically update when scenes change
    this.kinetics = this.__kernox.collectionManager.getSmartWrapper<Kinetics>("demoApp.Kinetics");
  }

  // Called each frame
  public execute() : void {

    // Collections are iterable
    for(const entity of this.kinetics){

      // Entities contain data, and are updated by systems
      entity.position.x += entity.velocity.x * ((1000 / 60) / this.__kernox.dt);
      entity.position.y += entity.velocity.y * ((1000 / 60) / this.__kernox.dt);

    };
  }
};