export type ErrorName = "ConditionValue" | "ConditionUndefined" | "TriggerUndefined" | "EffectError" | "EffectUndefined" | "OriginDisallowed";
declare class ErrorBase<T extends string> extends Error {
    name: T;
    message: string;
    response: any | null;
    constructor({ name, message, response, }: {
        name: T;
        message: string;
        response: any | null;
    });
}
export declare class TransitionError extends ErrorBase<ErrorName> {
}
export {};
