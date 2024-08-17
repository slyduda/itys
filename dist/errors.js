class ErrorBase extends Error {
    constructor({ name, message, response, }) {
        super();
        this.name = name;
        this.message = message;
        this.response = response;
    }
}
export class TransitionError extends ErrorBase {
}
