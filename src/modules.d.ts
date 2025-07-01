declare module './modules/*/*.ts' {
    const modules: Record<string, any>;
    export = modules;
}
