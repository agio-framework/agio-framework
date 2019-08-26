import { dirname } from 'path';

// Declare globals
global.__agio__ = {};
global.APP_PATH = dirname(require.main.filename);

import { environment } from '@agio/framework/environment';
import express, { Application } from 'express';
import { HANDLERS } from '@agio/framework/common';
import { Http2Server } from 'http2';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { AppOptions } from '@agio/framework/core';
import { Database } from '@agio/framework/database';

/**
 * Agio main App
 */
export class App {
    
    private instance = express();
    private options: AppOptions;
    private readonly HOST = 'localhost';
    private readonly PORT = 8889;

    constructor(options?: AppOptions) {
        this.options = options;
    }

    private listen = () => new Promise((resolve, reject) => {

        try {

            // Get environemnt server confs, use HOST and PORT default if they not passed in env
            const {port, host, ssl} = { host: this.HOST, port: this.PORT, ...environment.server};
    
            // Server
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


    /**
     * Start application
     */
    public start() {

        this.syncDatabases();
        this.route();

        return this.listen();

    }


    /**
     * Import routes and controllers
     */
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

    
    /**
     * Sync defined databases;
     */
    private syncDatabases() {
        
        // Environment databases list
        const { databases } = environment;

        // Database list not defined
        if (!databases) return;

        // Database list defined, sync this.
        Object.keys(databases).forEach(dbName => {

            const database = databases[dbName];

            const uri: string = typeof database === 'string' ? database : database.uri;
            const options: {} = typeof database === 'string' ? {} : database.options;

            new Database(uri, dbName, options);

        });

    }


}