import { ErrorName, TransitionError } from "./errors";

type Effect<T> = keyof T; // Ensures only methods of T can be used as effects
type Condition<T> = keyof T; // Ensures only methods of T can be used as conditions

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
  success: boolean; // Whether the Transition was successful or not
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

class StateMachineWrapper<
  StateType,
  TriggerType extends string,
  T extends Stateful<StateType>
> {
  private context: T;
  private machine: MachineDict<StateType, TriggerType, T>;
  private verbosity: boolean;
  private exceptions: boolean;

  constructor(
    context: T,
    machine: MachineDict<StateType, TriggerType, T>,
    options?: StateMachineOptions
  ) {
    const { verbosity = false, exceptions = true } = options ?? {};

    this.context = context;
    this.machine = machine;
    this.state = context.state; // Directly set the state from context
    this.verbosity = verbosity;
    this.exceptions = exceptions;
  }

  state: StateType;

  trigger(
    trigger: TriggerType,
    options?: TriggerOptions
  ): TransitionResult<StateType, TriggerType, T> {
    const { onError } = options ?? {};

    function normalizeArray<U>(value: U | U[]): U[] {
      return Array.isArray(value) ? value : [value];
    }

    const transition = this.machine[trigger];
    const origins = normalizeArray(transition.origins);
    const effects = normalizeArray(transition.effects || []);
    const conditions = normalizeArray(transition.conditions || []);

    const response: TransitionResult<StateType, TriggerType, T> = {
      success: false,
      failure: null,
      previous: this.context.state,
      current: this.context.state,
      transition,
      conditions: [],
      effects: [],
      precontext: JSON.stringify(this.context),
      context: JSON.stringify(this.context),
    };

    // If the transition does not exist then the trigger key did not exist
    if (!transition) {
      const context = JSON.stringify(this.context);
      const failure: TransitionFailure<TriggerType, T> = {
        type: "TriggerUndefined",
        undefined: true,
        trigger,
        method: null,
        index: null,
        context,
      };
      response.failure = failure;
      response.context = context;

      const message = `Trigger "${trigger}" is not defined in the machine.`;
      if (this.exceptions)
        throw new TransitionError({
          name: "TriggerUndefined",
          message,
          response,
        });
      if (this.verbosity) console.info(message);

      return response;
    }

    // If the transition picked does not have the current state listed in origins
    if (!origins.includes(this.state)) {
      const context = JSON.stringify(this.context);
      const failure: TransitionFailure<TriggerType, T> = {
        type: "OriginDisallowed",
        undefined: false,
        trigger,
        method: null,
        index: null,
        context,
      };
      response.failure = failure;
      response.context = context;

      const message = `Invalid transition from ${this.state} using trigger ${trigger}`;
      if (this.exceptions)
        throw new TransitionError({
          name: "OriginDisallowed",
          message,
          response,
        });
      if (this.verbosity) console.info(message);

      return response;
    }

    // Loop through all conditions
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionFunction = this.context[condition];

      // Create the Condition attempt
      const attempt: ConditionAttempt<T> = {
        name: condition,
        success: false,
        context: JSON.stringify(this.context),
      };
      response.conditions.push(attempt);

      // Check if the method is of type function
      if (typeof conditionFunction !== "function") {
        const message = `Condition ${String(
          condition
        )} is not defined in the machine.`;

        const context = JSON.stringify(this.context);
        const failure: TransitionFailure<TriggerType, T> = {
          type: "ConditionUndefined",
          undefined: true,
          trigger,
          method: condition,
          index: i,
          context,
        };
        response.failure = failure;
        response.context = context;

        if (this.exceptions)
          throw new TransitionError({
            name: "ConditionUndefined",
            message,
            response,
          });
        if (this.verbosity) console.info(message);
        return response;
      }

      // Check if method passes falsey
      if (!conditionFunction.call(this.context)) {
        const message = `Condition ${String(
          condition
        )} false, transition aborted.`;

        const context = JSON.stringify(this.context);
        const failure: TransitionFailure<TriggerType, T> = {
          type: "ConditionValue",
          undefined: false,
          trigger,
          method: condition,
          index: i,
          context,
        };
        response.failure = failure;
        response.context = context;

        // Failures in conditions are intentional and should not surface errors
        // if (this.exceptions)
        //   throw new TransitionError({
        //     name: "ConditionUndefined",
        //     message,
        //     response,
        //   });
        if (this.verbosity) console.info(message);
        return response;
      }

      // Set the attempt to success once the checks have been made
      attempt.success = true;
    }

    // Loop through all effects
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      const effectFunction = this.context[effect];

      // Create the Effect attempt
      const attempt: ConditionAttempt<T> = {
        name: effect,
        success: false,
        context: JSON.stringify(this.context),
      };
      response.effects.push(attempt);

      // Check if the method is of type function
      if (typeof effectFunction !== "function") {
        const message = `Effect ${String(
          effect
        )} is not defined in the machine.`;

        const context = JSON.stringify(this.context);
        const failure: TransitionFailure<TriggerType, T> = {
          type: "EffectUndefined",
          undefined: true,
          trigger,
          method: effect,
          index: i,
          context,
        };
        response.failure = failure;
        response.context = context;

        if (this.exceptions)
          throw new TransitionError({
            name: "EffectUndefined",
            message,
            response,
          });
        if (this.verbosity) console.info(message);
        return response;
      }
      try {
        effectFunction.call(this.context);
      } catch (e) {
        const message = `Effect ${String(effect)} caused an error.`;

        const context = JSON.stringify(this.context);
        const failure: TransitionFailure<TriggerType, T> = {
          type: "EffectError",
          undefined: false,
          trigger,
          method: effect,
          index: i,
          context,
        };
        response.failure = failure;
        response.context = context;

        if (this.exceptions)
          throw new TransitionError({
            name: "EffectError",
            message,
            response,
          });
        if (this.verbosity) console.warn(message);

        // Call onError if provided
        // This can be some kind of rollback function that resets the state of your object
        // Otherwise effects may change the state of your objects
        if (onError) onError();

        return response;
      }

      attempt.success = true;
    }

    // Change the state to the destination state
    this.state = transition.destination;
    if (this.verbosity) console.info(`State changed to ${this.state}`);

    response.success = true;
    response.context = JSON.stringify(this.context);
    response.current = this.context.state;
    return response;
  }
}

export function mergeWithStateMachine<
  StateType extends string,
  TriggerType extends string,
  T extends Stateful<StateType>
>(
  context: T,
  machine: MachineDict<StateType, TriggerType, T>
): T & StateMachineWrapper<StateType, TriggerType, T> {
  const wrapper = new StateMachineWrapper(context, machine);

  const proxy = new Proxy(
    context as T & StateMachineWrapper<StateType, TriggerType, T>,
    {
      get(target, prop, receiver) {
        if (prop in wrapper) {
          return Reflect.get(wrapper, prop, receiver);
        }
        return Reflect.get(target, prop, receiver);
      },
    }
  );

  return proxy;
}
