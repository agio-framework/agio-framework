
declare const APP_PATH: string;
declare const HTTP_STATUS: typeof import('http-status-codes');
declare const models: <T>(dbName: string, modelName: string) => T;

declare namespace NodeJS {

    interface Global {

        // Global function to get models
        models: typeof models;

        // The base app path
        APP_PATH: string;

        // List of http status
        HTTP_STATUS: typeof HTTP_STATUS;

        __agio__: {
            environment?: import('@agio/framework/environment').Environment,
        },
    }

}
