declare module '@agio/framework/core' {

    type Controllers = import('@agio/framework/common').ControllerClass[];
    type Handler = import('@agio/framework/common').Handler;

    interface AppOptions {
        controllers?: Controllers,
        handlers?: {
            provide: Handler | string,
            use: Handler,
            at: 'before' | 'after'
        }[],
    }

    class App {

        options: AppOptions;

        constructor(options?: AppOptions);

        start: () => Promise<string>;

    }

}