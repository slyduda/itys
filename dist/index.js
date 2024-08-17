import { TransitionError } from "./errors";
class StateMachineWrapper {
    constructor(context, machine, options) {
        const { verbosity = false, exceptions = true } = options !== null && options !== void 0 ? options : {};
        this.context = context;
        this.machine = machine;
        this.state = context.state; // Directly set the state from context
        this.verbosity = verbosity;
        this.exceptions = exceptions;
    }
    trigger(trigger, options) {
        const { onError } = options !== null && options !== void 0 ? options : {};
        function normalizeArray(value) {
            return Array.isArray(value) ? value : [value];
        }
        const transition = this.machine[trigger];
        const origins = normalizeArray(transition.origins);
        const effects = normalizeArray(transition.effects || []);
        const conditions = normalizeArray(transition.conditions || []);
        const response = {
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
            const failure = {
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
            if (this.verbosity)
                console.info(message);
            return response;
        }
        // If the transition picked does not have the current state listed in origins
        if (!origins.includes(this.state)) {
            const context = JSON.stringify(this.context);
            const failure = {
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
            if (this.verbosity)
                console.info(message);
            return response;
        }
        // Loop through all conditions
        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i];
            const conditionFunction = this.context[condition];
            // Create the Condition attempt
            const attempt = {
                name: condition,
                success: false,
                context: JSON.stringify(this.context),
            };
            response.conditions.push(attempt);
            // Check if the method is of type function
            if (typeof conditionFunction !== "function") {
                const message = `Condition ${String(condition)} is not defined in the machine.`;
                const context = JSON.stringify(this.context);
                const failure = {
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
                if (this.verbosity)
                    console.info(message);
                return response;
            }
            // Check if method passes falsey
            if (!conditionFunction.call(this.context)) {
                const message = `Condition ${String(condition)} false, transition aborted.`;
                const context = JSON.stringify(this.context);
                const failure = {
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
                if (this.verbosity)
                    console.info(message);
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
            const attempt = {
                name: effect,
                success: false,
                context: JSON.stringify(this.context),
            };
            response.effects.push(attempt);
            // Check if the method is of type function
            if (typeof effectFunction !== "function") {
                const message = `Effect ${String(effect)} is not defined in the machine.`;
                const context = JSON.stringify(this.context);
                const failure = {
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
                if (this.verbosity)
                    console.info(message);
                return response;
            }
            try {
                effectFunction.call(this.context);
            }
            catch (e) {
                const message = `Effect ${String(effect)} caused an error.`;
                const context = JSON.stringify(this.context);
                const failure = {
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
                if (this.verbosity)
                    console.warn(message);
                // Call onError if provided
                // This can be some kind of rollback function that resets the state of your object
                // Otherwise effects may change the state of your objects
                if (onError)
                    onError();
                return response;
            }
            attempt.success = true;
        }
        // Change the state to the destination state
        this.state = transition.destination;
        if (this.verbosity)
            console.info(`State changed to ${this.state}`);
        response.success = true;
        response.context = JSON.stringify(this.context);
        response.current = this.context.state;
        return response;
    }
}
export function mergeWithStateMachine(context, machine) {
    const wrapper = new StateMachineWrapper(context, machine);
    const proxy = new Proxy(context, {
        get(target, prop, receiver) {
            if (prop in wrapper) {
                return Reflect.get(wrapper, prop, receiver);
            }
            return Reflect.get(target, prop, receiver);
        },
    });
    return proxy;
}
