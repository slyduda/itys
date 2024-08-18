import { expect, test } from "vitest";
import { matterMachineDict, Matter, MatterState } from "../examples/physics";
import { addStateMachine } from "../src";

test("check to see if passing in props works", () => {
  const matter = new Matter("solid");
  const objectMachine = addStateMachine(matter, matterMachineDict);
  expect(matter.temperature).toBe(0);
  const response = objectMachine.trigger("melt", { temperature: 20 });
  expect(response.context?.temperature).toBe(20);
});
