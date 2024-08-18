import { MachineDict, Stateful, StateMachineOptions, TransitionOptions, TransitionProps, TransitionResult } from "./types";
declare class StateMachineWrapper<StateType, TriggerType extends string, T extends Stateful<StateType>> {
    private context;
    private machine;
    private verbosity;
    private throwExceptions;
    private strictOrigins;
    constructor(context: T, machine: MachineDict<StateType, TriggerType, T>, options?: StateMachineOptions);
    get state(): StateType;
    set state(state: StateType);
    private deepCopyContext;
    triggerWithOptions(trigger: TriggerType, props: TransitionProps, options: TransitionOptions): TransitionResult<StateType, TriggerType, T>;
    triggerWithOptions(trigger: TriggerType, options: TransitionOptions): TransitionResult<StateType, TriggerType, T>;
    trigger(trigger: TriggerType, props?: TransitionProps, options?: TransitionOptions): TransitionResult<StateType, TriggerType, T>;
}
export declare function addStateMachine<StateType extends string, TriggerType extends string, T extends Stateful<StateType>>(context: T, machine: MachineDict<StateType, TriggerType, T>, options?: StateMachineOptions): T & StateMachineWrapper<StateType, TriggerType, T>;
export { MachineDict };
