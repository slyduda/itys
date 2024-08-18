import { MachineDict } from "../src";

export type MatterState = "solid" | "liquid" | "gas" | "plasma";
export type MatterTrigger =
  | "melt"
  | "evaporate"
  | "sublimate"
  | "ionize"
  | "freeze"
  | "depose"
  | "condense"
  | "recombine";

export class Matter {
  state: MatterState;
  temperature: number;
  pressure: number;

  constructor(state: MatterState) {
    this.state = state;
    this.setEnvironment();
  }

  setEnvironment(props?: { temperature: number; pressure }) {
    const { temperature = 0, pressure = 101.325 } = props ?? {};
    this.temperature = temperature;
    this.pressure = pressure;
  }
}

export const matterMachineDict: MachineDict<
  MatterState,
  MatterTrigger,
  Matter
> = {
  melt: [
    { origins: "solid", destination: "liquid", effects: "setEnvironment" },
  ],
  evaporate: [{ origins: "liquid", destination: "gas" }],
  sublimate: [{ origins: "solid", destination: "gas" }],
  ionize: [{ origins: "gas", destination: "plasma" }],
  freeze: [{ origins: "liquid", destination: "solid" }],
  depose: [{ origins: "gas", destination: "solid" }],
  condense: [{ origins: "gas", destination: "liquid" }],
  recombine: [{ origins: "plasma", destination: "gas" }],
};
