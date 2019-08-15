import { existsSync, readdirSync } from 'fs';
import { Mongoose } from 'mongoose';
import { Sequelize } from 'sequelize';

const __dbs__ = {};
global.models = (dbName: string, modelName) => __dbs__[dbName] ? __dbs__[dbName][modelName] : {};

// Use native Promise
Mongoose.prototype.Promise = global.Promise;
(Sequelize as any).Promise = global.Promise;

export class Database {

    private models: any[];
    
    constructor(
        private uri: string,
        private dbName: string,
        private options?: {[key: string]: any}
    ) {
        this.connect();
    }
    
    private connect() {

        if (!existsSync(this.modelsPath)) return;

        this.models = readdirSync(this.modelsPath)
            .map(file => require(`${this.modelsPath}/${file}`).default)
            .filter(model => !!model)

        if (this.models.length) {
            this.strategy()
                .catch(() => console.error(`Can't connect to database: ${this.dbName}`))

        }

    }

    private get modelsPath() {
        return `${APP_PATH}/models/${this.dbName}`;
    }

    private get strategy() {
        return this.uri.includes('mongodb') ? this.mongooseStrategy : this.sequelizeStrategy;
    }

    private mongooseStrategy() {

        const mongoose = new Mongoose();

        this.models.forEach(model => {

            const { schema } = model.prototype;
            mongoose.model(schema.options.collection, schema);

        });

        __dbs__[this.dbName] = mongoose.models;

        return mongoose.connect(this.uri, { useNewUrlParser: true, ...this.options })

    }

    private sequelizeStrategy() {

        const sequelize = new Sequelize(this.uri, { ...this.options });

        this.models.forEach(model => sequelize.modelManager.addModel(model.prototype.schema(sequelize)));

        __dbs__[this.dbName] = sequelize.models;

        return sequelize.sync() as Promise<Sequelize>
            // .then(() => sequelize.authenticate()) as Promise<void>;

    }

}