"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addStateMachine = void 0;
const errors_1 = require("./errors");
const noop = () => { };
class StateMachineWrapper {
    constructor(context, machine, options) {
        const { verbosity = false, throwExceptions = true, strictOrigins = false, } = options !== null && options !== void 0 ? options : {};
        this.context = context;
        this.machine = machine;
        this.state = context.state; // Directly set the state from context
        this.verbosity = verbosity;
        this.throwExceptions = throwExceptions;
        this.strictOrigins = strictOrigins; // Whether a called trigger will fail if state is not in origin
    }
    get state() {
        return this.context.state;
    }
    set state(state) {
        this.context.state = state;
    }
    deepCopyContext() {
        return JSON.parse(JSON.stringify(this.context));
    }
    triggerWithOptions(trigger, secondParameter, thirdParameter) {
        let passedProps = undefined;
        let passedOptions = undefined;
        if (thirdParameter !== undefined) {
            passedProps = secondParameter;
            passedOptions = thirdParameter;
        }
        else {
            // Cast sinve we know it will be Trigger Options
            passedOptions = secondParameter;
        }
        const options = passedOptions !== null && passedOptions !== void 0 ? passedOptions : {};
        const props = passedProps !== null && passedProps !== void 0 ? passedProps : {};
        return this.trigger(trigger, props, options);
    }
    trigger(trigger, props, options) {
        const response = {
            success: false,
            failure: null,
            previous: this.context.state,
            current: this.context.state,
            transitions: [],
            precontext: this.deepCopyContext(),
            context: this.deepCopyContext(),
        };
        const { onError = noop, throwExceptions } = options !== null && options !== void 0 ? options : {};
        function normalizeArray(value) {
            return Array.isArray(value) ? value : [value];
        }
        const transitions = normalizeArray(this.machine[trigger]);
        // If the transitions don't exist trigger key did not exist
        if (!transitions.length) {
            const context = this.deepCopyContext();
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
            if (throwExceptions || this.throwExceptions)
                throw new errors_1.TransitionError({
                    name: "TriggerUndefined",
                    message,
                    response,
                });
            if (this.verbosity)
                console.info(message);
            return response;
        }
        // Get a set of all origins
        const origins = Array.from(transitions.reduce((acc, curr) => {
            normalizeArray(curr.origins).forEach((item) => acc.add(item));
            return acc;
        }, new Set()));
        // If the transition picked does not have the current state listed in any origins
        if (!origins.includes(this.state)) {
            const message = `Invalid transition from ${this.state} using trigger ${trigger}`;
            if (throwExceptions || this.throwExceptions)
                throw new errors_1.TransitionError({
                    name: "OriginDisallowed",
                    message,
                    response,
                });
            if (this.verbosity)
                console.info(message);
            const context = this.deepCopyContext();
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
            return response;
        }
        transitionLoop: for (let i = 0; i < transitions.length; i++) {
            const transition = transitions[i];
            const nextTransition = transitions === null || transitions === void 0 ? void 0 : transitions[i + 1];
            const transitionAttempt = {
                name: trigger,
                success: false,
                failure: null,
                conditions: [],
                effects: [],
                transition,
                context: this.deepCopyContext(),
            };
            response.transitions.push(transitionAttempt);
            const effects = normalizeArray(transition.effects || []);
            const conditions = normalizeArray(transition.conditions || []);
            // Loop through all conditions
            for (let j = 0; j < conditions.length; j++) {
                const condition = conditions[j];
                const conditionFunction = this.context[condition];
                // Create the Condition attempt
                const conditionAttempt = {
                    name: condition,
                    success: false,
                    context: this.deepCopyContext(),
                };
                transitionAttempt.conditions.push(conditionAttempt);
                // Check if the method is of type function
                if (typeof conditionFunction !== "function") {
                    const message = `Condition ${String(condition)} is not defined in the machine.`;
                    const context = this.deepCopyContext();
                    const failure = {
                        type: "ConditionUndefined",
                        undefined: true,
                        trigger,
                        method: condition,
                        index: j,
                        context,
                    };
                    response.failure = failure;
                    response.context = context;
                    if (throwExceptions || this.throwExceptions)
                        throw new errors_1.TransitionError({
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
                    const context = this.deepCopyContext();
                    const failure = {
                        type: "ConditionValue",
                        undefined: false,
                        trigger,
                        method: condition,
                        index: j,
                        context,
                    };
                    if (this.verbosity)
                        console.info(message);
                    if (nextTransition) {
                        transitionAttempt.failure = failure;
                        continue transitionLoop;
                    }
                    else {
                        transitionAttempt.failure = failure;
                        response.failure = failure;
                        response.context = context;
                        return response;
                    }
                }
                // Set the attempt to success once the checks have been made
                conditionAttempt.success = true;
            }
            // Loop through all effects
            for (let j = 0; j < effects.length; j++) {
                const effect = effects[j];
                const effectFunction = this.context[effect];
                // Create the Effect attempt
                const effectAttempt = {
                    name: effect,
                    success: false,
                    context: this.deepCopyContext(),
                };
                transitionAttempt.effects.push(effectAttempt);
                // Check if the method is of type function
                if (typeof effectFunction !== "function") {
                    const message = `Effect ${String(effect)} is not defined in the machine.`;
                    const context = this.deepCopyContext();
                    const failure = {
                        type: "EffectUndefined",
                        undefined: true,
                        trigger,
                        method: effect,
                        index: j,
                        context,
                    };
                    response.failure = failure;
                    response.context = context;
                    if (throwExceptions || this.throwExceptions)
                        throw new errors_1.TransitionError({
                            name: "EffectUndefined",
                            message,
                            response,
                        });
                    if (this.verbosity)
                        console.info(message);
                    return response;
                }
                try {
                    effectFunction.call(this.context, props);
                }
                catch (e) {
                    const message = `Effect ${String(effect)} caused an error.`;
                    const context = this.deepCopyContext();
                    const failure = {
                        type: "EffectError",
                        undefined: false,
                        trigger,
                        method: effect,
                        index: j,
                        context,
                    };
                    response.failure = failure;
                    response.context = context;
                    if (throwExceptions || this.throwExceptions)
                        throw new errors_1.TransitionError({
                            name: "EffectError",
                            message,
                            response,
                        });
                    if (this.verbosity)
                        console.warn(message);
                    // Call onError
                    // This can be some kind of rollback function that resets the state of your object
                    // Otherwise effects may change the state of your objects
                    onError();
                    return response;
                }
                effectAttempt.success = true;
            }
            // Change the state to the destination state
            this.state = transition.destination;
            if (this.verbosity)
                console.info(`State changed to ${this.state}`);
            transitionAttempt.success = true;
            response.success = true;
            response.context = this.deepCopyContext();
            response.current = this.context.state;
            return response;
        }
    }
}
function addStateMachine(context, machine, options) {
    const wrapper = new StateMachineWrapper(context, machine, options);
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
exports.addStateMachine = addStateMachine;
