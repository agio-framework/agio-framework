
declare module '@agio/framework/http' {
    
    export interface ResponseData {
        [key: string]: any
    }
    
    export interface ResponseMetadata {
        [key: string]: any
    }
    
    export class ResponseError extends Error {
        at?: string;
    }

    type ResponseStatusCode = number;

    function sendResponse(statusCode: ResponseStatusCode, error?: ResponseError | Error): void;
    function sendResponse(data: ResponseData | ResponseData[], statusCode?: ResponseStatusCode, error?: ResponseError | Error): void;
    function sendResponse(statusCode: ResponseStatusCode, metadata: ResponseMetadata, error?: ResponseError | Error): void;
    function sendResponse(data: ResponseData | ResponseData[], statusCode: ResponseStatusCode, metadata: ResponseMetadata, error?: ResponseError | Error): void;

    type NextFunction = import('express').NextFunction;
    type ExpressRequest = import('express').Request;
    type ExpressResponse = import('express').Response;

    interface Response extends ExpressResponse {
        sendResponse: typeof sendResponse;
    }

    interface Request extends ExpressRequest {
        sendResponse: typeof sendResponse;
    }

    // RFC 7231 + PATCH
    export const All: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Get: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Put: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Head: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Post: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Trace: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Patch: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Delete: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Connect: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    export const Options: (path: string | string [], middlewares?: any[]) => PropertyDecorator;
    
    export type RouterMethods = (
        | 'all'
        | 'get'
        | 'put'
        | 'post'
        | 'head'
        | 'patch'
        | 'trace'
        | 'delete'
        | 'connect'
        | 'options'
    );
}
