import { MachineDict } from "../src";

export type ExampleObjectState = "initial" | "walking" | "stopped";
export type ExampleObjectTrigger = "walk" | "stop";

export class ExampleObject {
  state: ExampleObjectState;
  speed: number;
  energy: number;

  constructor(energy?: number) {
    this.state = "initial";
    this.energy = energy ?? 1;
    this.speed = 0;
  }

  speedUp() {
    this.speed = 1;
    this.energy--;
  }

  slowDown() {
    this.speed = 0;
  }

  hasEnergy(): boolean {
    return this.energy > 0;
  }
}

export const exampleMachineDict: MachineDict<
  ExampleObjectState,
  ExampleObjectTrigger,
  ExampleObject
> = {
  walk: {
    origins: ["initial"],
    destination: "walking",
    effects: ["speedUp"],
    conditions: ["hasEnergy"],
  },
  stop: {
    origins: ["walking"],
    destination: "stopped",
  },
};