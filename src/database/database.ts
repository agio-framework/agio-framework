import { join } from 'path';
import { Mongoose } from 'mongoose';
import { Sequelize } from 'sequelize';
import { existsSync, readdirSync, readFileSync } from 'fs';

import { DBConfig, SQLModel, MongoModel } from '@agio/framework/database';

// Global synced database list
const __dbs__ = {};

// Global function to get models of synced databases
global.models = (dbName: string, modelName) => __dbs__[dbName] ? __dbs__[dbName][modelName] : {};

// Use global Promise
Mongoose.prototype.Promise = global.Promise;
(Sequelize as any).Promise = global.Promise;

// Simbolic typing of models list
type ModelsList = {
    [key: string]: SQLModel<any> & MongoModel<any>;
}


/**
 * Create and push database
 */
export class Database {

    // List of the database synced models
    private models: any[] = [];


    constructor(private config: DBConfig) {
        this.connect();
    }


    /**
     * Sync models and connect to database.
     */
    private connect() {

        // The database path does not exists.
        if (!existsSync(this.modelsPath)) return;

        // Import all model files in database path
        readdirSync(this.modelsPath).forEach(file => {

            const required = require(`${this.modelsPath}/${file}`);

            this.models.push(
                ...Object.keys(required)
                    .map(name => required[name])
                    .filter(model => !!model.prototype.isAgioModel)
            );

        });

        // If models found, connect to database
        if (this.models.length) {
            this.connectionStrategy()
                .then((connection) => {
                    this.seed(connection.models as ModelsList);
                    return connection;
                })
                .catch(err => console.error(`
                    Can't connect to database ${this.dbName} because: ${err ? err.message : 'unknown error.'}`,
                ));
        }

    }


    /**
     * Strategy Method for MongoDB databases and mongoose models
     */
    private mongooseStrategy() {

        // New instance
        const mongoose = new Mongoose();

        // Import models to instance
        this.models.forEach(model => {

            const { schema } = model.prototype;
            mongoose.model(schema.options.collection, schema);

        });

        // Import instance to global list
        __dbs__[this.dbName] = mongoose.models;

        // Return connection
        return mongoose.connect(this.uri, { useNewUrlParser: true, ...this.options });

    }


    /**
     * Strategy Method for SQL databases and sequelize models
     */
    private sequelizeStrategy() {

        // New instance
        const sequelize = new Sequelize(this.uri, { ...this.options });

        // Import models to instance
        this.models.forEach(model => sequelize.modelManager.addModel(model.prototype.schema(sequelize)));

        // Associate models
        Object
            .keys(sequelize.models)
            .forEach((modelName) => {
                if ('associate' in sequelize.models[modelName].prototype) {
                    sequelize.models[modelName].prototype.associate(sequelize.models[modelName], sequelize);
                }
            });

        // Import instance to global list
        __dbs__[this.dbName] = sequelize.models;

        // Return connection
        return sequelize.sync() as Promise<Sequelize>;

    }


    /**
     * 
     * @param models
     */
    private async seed(models: ModelsList) {

        // Noone seeds defined
        if (!this.seeds) return;

       // Seeds
       for (const modelName in models) {

            // No seed defined for model, try next
            if (!this.seeds[modelName]) continue;

            try {

                // Check if file exists
                const seedFile = join(this.seedsPath, this.seeds[modelName]);
                if (!existsSync(seedFile)) continue;


                // Read and check if ssed content is an array
                const seedsData = JSON.parse(readFileSync(seedFile).toString('utf-8'));
                if (!Array.isArray(seedsData) || !seedsData.length) continue;


                // Create seeds
                let createdSeeds = 0;

                // Bulk Create for SQL models: All or Nothing
                if (models[modelName].sequelize) createdSeeds = await models[modelName]
                        .bulkCreate(seedsData, { logging: false })
                        .then((result) => result.length)
                        .catch(() => 0)

                // Insert Many for Mongo models, All except duplicates
                else if (models[modelName].base) createdSeeds = await models[modelName]
                        .insertMany(seedsData, { ordered: false })
                        .then((result) => result.length)
                        .catch((error) => error.result.result.nInserted);

                // Nothing, try next
                else continue;

                // Sumary of seeds
                console.log(`[Seed:${this.dbName}/${modelName}] ${createdSeeds}/${seedsData.length} seeds created.`);

            // General error occurred
            } catch (error) {
                console.log(`[Seed:${this.dbName}/${modelName}] Error: ${error.message}`);
            }

        }

    }


    /**
     * Database URI
     */
    private get uri() {
        return this.config.uri;
    }


    /**
     * Database seeds
     */
    private get seeds() {
        return this.config.seeds;
    }


    /**
     * Database name
     */
    private get dbName() {
        return this.config.dbName;
    }


    /**
     * Database options
     */
    private get options() {
        return this.config.options || {}
    }


    /**
     * Path of seeds files for db
     */
    private get seedsPath() {
        return `${APP_PATH}/seeds/${this.dbName}`;
    }


    /**
     * Path of modal files for db
     */
    private get modelsPath() {
        return `${APP_PATH}/models/${this.dbName}`;
    }


    /**
     * Return the strategy method to connect, between mongoose or sequelize
     */
    private get connectionStrategy(): () => Promise<Sequelize | Mongoose> {
        return this.uri.includes('mongodb') ? this.mongooseStrategy : this.sequelizeStrategy
    }


}