export type ErrorName =
  | "ConditionValue"
  | "ConditionUndefined"
  | "TriggerUndefined"
  | "EffectError"
  | "EffectUndefined"
  | "OriginDisallowed";

class ErrorBase<T extends string> extends Error {
  name: T;
  message: string;
  response: any | null;

  constructor({
    name,
    message,
    response,
  }: {
    name: T;
    message: string;
    response: any | null;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.response = response;
  }
}

export class TransitionError extends ErrorBase<ErrorName> {}
