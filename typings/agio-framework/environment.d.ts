declare module '@agio/framework/environment' {

    export interface Environment {
        production: boolean;

        server: {
            port: number;
            host: string;
            ssl: {
                key: string;
                cert: string;
                enable: boolean;
            },
            cors: {
                origin: string;
                headers: string;
                methods: string;
            }
            'custom-headers': {
                [key: string]: string
            }
        }

        databases: {
            [key: string]: string | {
                uri: string;
                seeds?: { [key: string]: string }
                options: { [key: string]: any }
            };
        }

        [key: string]: any;

    }

    export const environment: Environment;

}