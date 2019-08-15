declare module '@agio/framework/core' {

    interface AppOptions {
        controllers?: import('@agio/framework/common').ControllerClass[],
        handlers?: {
            provide: import('@agio/framework/common').Handler | string,
            use: import('@agio/framework/common').Handler,
            at: 'before' | 'after'
        }[],
    }

    class App {
        options: AppOptions;
        constructor(options?: AppOptions);
        start: () => Promise<string>
    }

}