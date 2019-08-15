declare module '@agio/framework/common' {

    export type Handler = import('express').RequestHandler | import('express').ErrorRequestHandler;

    export const Router: (method: import('@agio/framework/http').RouterMethods, path: string |  string[], middlewares: any[]) => Function; 
    export const HANDLERS: {[key: string]: Handler}; 
    export const Validator: () => ClassDecorator;
    export const Singleton: () => ClassDecorator;
    export const Controller: (prefix?: string) => ClassDecorator;
    export const Injectable: (options?: {auto: boolean}) => ClassDecorator;

    export interface Middleware {
        use: import('express').RequestHandler;
    }

    export interface ControllerClass extends Function {
        new (...args: any[]): any;
        prefix?: string;
        router?: (app: import('express').Router) => void;
        routes?: {
            path: string | string[];
            method: import('@agio/framework/http').RouterMethods;
            controllerMethod: string;
            middlewares: import('express').RequestHandler[]
        }[]
    }

}
