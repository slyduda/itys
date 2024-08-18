"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransitionError = void 0;
class ErrorBase extends Error {
    constructor({ name, message, response, }) {
        super();
        this.name = name;
        this.message = name + ": " + message;
        this.response = response;
    }
}
class TransitionError extends ErrorBase {
}
exports.TransitionError = TransitionError;
