
// Base Errors

export class BaseThrowable extends Error {
    public name = 'BaseThrowable';

    constructor(message: string, stack?: string|null) {
        super(message);
        if (stack) this.stack = stack;
    }
}

export class BaseWarning extends BaseThrowable {
    public name = 'BaseWarning';
}

export class BaseError extends BaseThrowable {
    public name = 'BaseError';
}


// Specific Errors

export class PotentialLoopError extends BaseError {
    public name = 'PotentialLoopError';

    constructor(message: string = 'Potential loop detected: This might me an internal issue', stack?: string|null) {
        super(message, stack);
    }
}


// Template Errors

export class TemplateError extends BaseError {
    public name = 'TemplateError';
}

export class TemplateSyntaxError extends TemplateError {
    public name = 'TemplateSyntaxError';
}

export class TemplateDataValidationError extends TemplateError {
    public name = 'TemplateDataValidationError';
    declare public fieldName: string;

    constructor(message: string = 'The entered data is invalid: This might me an internal issue', fieldName?: string|null) {
        super(message);
        if (fieldName) this.fieldName = fieldName;
    }
}
