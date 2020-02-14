declare module '@agio/framework/common' {

    type Router = import('express').Router;
    type RequestHandler = import('express').RequestHandler;
    type ErrorRequestHandler = import('express').ErrorRequestHandler;
    
    type RouterMethods = import('@agio/framework/http').RouterMethods;
    
    export type Handler = RequestHandler | ErrorRequestHandler;

    export const Router: (method: RouterMethods, path: string |  string[], middlewares: any[]) => Function; 
    export const HANDLERS: {[key: string]: Handler}; 
    export const Singleton: () => ClassDecorator;
    export const Controller: (prefix?: string) => ClassDecorator;
    export const Injectable: (options?: {auto: boolean}) => ClassDecorator;

    export interface Middleware {
        use: RequestHandler;
    }

    export interface ControllerClass extends Function {

        new (...args: any[]): any;

        prefix?: string;

        router?: (app: Router) => void;

        routes?: {
            path: string | string[];
            method: RouterMethods;
            middlewares: RequestHandler[];
            controllerMethod: string;
        }[];

    }

}
