
declare const APP_PATH: string;
declare const HTTP_STATUS: typeof import('http-status-codes');
declare const models: <T>(dbName: string, modelName: string) => T;

declare namespace NodeJS {
    interface Global {
        models: typeof models;
        APP_PATH: string;
        HTTP_STATUS: typeof HTTP_STATUS;
    }
}
