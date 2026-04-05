
// Base Data Types

export type Xml = string;

export type Obj<T = any> = Record<string, T>;

export type Nullable<T> = T | null | undefined;


// Base System Types

export type Constructor<T = object> = new (..._args: any[]) => T;

export type MaybePromise<T = any> = T | Promise<T>;


// Base Callable Types

export type SimpleLoader<T = any> = () => T;

export type Loader<T = any> = SimpleLoader<MaybePromise<T>>;
