import { ErrorName } from "./errors";
type Effect<T> = keyof T;
type Condition<T> = keyof T;
export type Transition<StateType, TriggerType extends string, T> = {
    origins: StateType[];
    destination: StateType;
    effects?: Effect<T>[];
    conditions?: Condition<T>[];
};
type ConditionAttempt<T> = {
    name: Condition<T>;
    success: boolean;
    context: any | null;
};
type EffectAttempt<T> = {
    name: Effect<T>;
    success: boolean;
    context: any | null;
};
type TransitionFailure<TriggerType extends string, T> = {
    type: ErrorName;
    undefined: boolean;
    trigger: TriggerType | null;
    method: Condition<T> | Effect<T> | null;
    index: number | null;
    context: any | null;
};
export type TransitionResult<StateType, TriggerType extends string, T> = {
    success: boolean;
    failure: TransitionFailure<TriggerType, T> | null;
    previous: StateType;
    current: StateType;
    transition?: Transition<StateType, TriggerType, T>;
    conditions: ConditionAttempt<T>[];
    effects: EffectAttempt<T>[];
    precontext: any | null;
    context: any | null;
};
export type MachineDict<StateType, TriggerType extends string, T> = {
    [K in TriggerType]: Transition<StateType, TriggerType, T>;
};
export interface Stateful<StateType> {
    state: StateType;
}
type StateMachineOptions = {
    verbosity: boolean;
    exceptions: boolean;
};
type TriggerOptions = {
    onError: () => void;
};
declare class StateMachineWrapper<StateType, TriggerType extends string, T extends Stateful<StateType>> {
    private context;
    private machine;
    private verbosity;
    private exceptions;
    constructor(context: T, machine: MachineDict<StateType, TriggerType, T>, options?: StateMachineOptions);
    state: StateType;
    trigger(trigger: TriggerType, options?: TriggerOptions): TransitionResult<StateType, TriggerType, T>;
}
export declare function mergeWithStateMachine<StateType extends string, TriggerType extends string, T extends Stateful<StateType>>(context: T, machine: MachineDict<StateType, TriggerType, T>): T & StateMachineWrapper<StateType, TriggerType, T>;
export {};
