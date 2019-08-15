global.APP_PATH = (require.main as any).path;

import express, { Application } from 'express';
import { HANDLERS } from '@agio/framework/common';
import { environment } from '@agio/framework/environment';
import { Http2Server } from 'http2';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { AppOptions } from '@agio/framework/core';
import { Database } from '@agio/framework/database';

export class App {

    private instance = express();
    private options: AppOptions;

    constructor(options?: AppOptions) {
        this.options = options;
    }

    private listen = () => new Promise((resolve, reject) => {

        try {

            const {port, host, ssl} = {
                host: 'localhost',
                port: 8889,
                ...environment.server
            };
    
            let server: Http2Server | Application = this.instance;
            let protocol = 'http';
    
            // Use https server instanead express http
            if (ssl && ssl.enable) {
                protocol = 'https';
                server = createServer(
                    {
                        key: readFileSync(ssl.key),
                        cert: readFileSync(ssl.cert)
                    },
                    this.instance
                );
            }

            // Listen server
            server.listen(port, host, err => err ? reject(err.message) : resolve(`[${process.pid}] Server running on ${protocol}://${host}:${port}/`))

        } catch (err) {
            console.error(`Can\`t create server: ${err.message}`);
        }

    });

    public start() {

        this.syncDatabases();
        this.route();

        return this.listen();

    }

    private route() {

        // Setup custom handlers
        if (this.options.handlers) this.options.handlers.forEach(handle => HANDLERS[handle.at][handle.provide as any] = handle.use);


        // Use before handlers
        this.instance.use(Object.keys(HANDLERS.before).map(key => HANDLERS.before[key]));


        // Use controllers
        if (this.options.controllers) {

            this.options.controllers
                .filter(controller => typeof controller.router === 'function')
                .forEach(controller => controller.router(this.instance));

        }


        // Use after handlers
        this.instance.use(Object.keys(HANDLERS.after).map(key => HANDLERS.after[key]));

    }

    private syncDatabases() {
        
        const { databases } = environment;

        if (!databases) return;

        Object.keys(databases).forEach(dbName => {

            const database = databases[dbName];

            const uri: string = typeof database === 'string' ? database : database.uri;
            const options: {} = typeof database === 'string' ? {} : database.options;

            new Database(uri, dbName, options);

        })

    }


}