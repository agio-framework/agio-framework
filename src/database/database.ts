import { existsSync, readdirSync } from 'fs';
import { Mongoose } from 'mongoose';
import { Sequelize } from 'sequelize';

// Global synced database list
const __dbs__ = {};

// Global function to get models of synced databases
global.models = (dbName: string, modelName) => __dbs__[dbName] ? __dbs__[dbName][modelName] : {};

// Use global Promise
Mongoose.prototype.Promise = global.Promise;
(Sequelize as any).Promise = global.Promise;


/**
 * Create and push database
 */
export class Database {

    // List of the database synced models
    private models: any[] = [];

    // Path of database model files
    private modelsPath: string;

    // Strategy method for connection
    private connectionStrategy: () => Promise<Sequelize | Mongoose>;

    constructor(
        private uri: string,
        private dbName: string,
        private options?: {[key: string]: any}
    ) {

        // Define the models path
        this.modelsPath = `${APP_PATH}/models/${this.dbName}`;

        // Define connection strategy method
        this.connectionStrategy = this.uri.includes('mongodb') ? this.mongooseStrategy : this.sequelizeStrategy;

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
        return mongoose.connect(this.uri, { useNewUrlParser: true, ...this.options })

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

}