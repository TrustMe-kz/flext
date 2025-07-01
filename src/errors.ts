export class BaseThrowable extends Error {
    public name = 'BaseThrowable';

    constructor(message: string, stack: string|null = null) {
        super(message);
        if (stack) this.stack = stack;
    }
}

export class BaseError extends BaseThrowable {
    public name = 'BaseError';
}

export class BaseWarning extends BaseThrowable {
    public name = 'BaseWarning';
}
