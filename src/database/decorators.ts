import { SQLSchemaDefinition, SQLSchemaOptions, MongoSchemaDefinition, MongoSchemaOptions } from '@agio/framework/database';
import { Sequelize, Model as SQLModel } from 'sequelize';
import { Schema, Model as MongoModel } from 'mongoose';

/**
 * Build a SQL schema
 *
 * @param  {string} name
 * @param  {ModelAttributes} definition
 * @param  {SequelizeSchemaOptions} options?
 */
export const SQLSchema = (name: string, definition: SQLSchemaDefinition, options?: SQLSchemaOptions) => function(target: Function) {


    // Schema as fucntion generator
    target.prototype.isAgioModel = true;

    // Generate a sequelize schema
    target.prototype.schema = (sequelize: Sequelize) => {

        // Create a new sequelize schema
        const model = sequelize.define(name, definition, { ...options, modelName: name });

        // Define custom methods
        const methods = getCustomMethods(target);
        methods.statics.forEach(method => model[method.name] = method.caller);
        methods.instance.forEach(method => model.prototype[method.name] = method.caller);

        return Object.assign(model, target);

    };

    // Build all associations
    target.prototype.associate = (model: SQLModel, sequelize: Sequelize) => {

        // Schema associations
        const { associations } = options;
        delete options.associations;

        if (associations) {

            for (const method in associations) {
                for (const assocOptions of associations[method]) {

                    const modelName = assocOptions.model;
                    delete assocOptions.model;

                    if (sequelize.models[modelName]) {
                        model[method](sequelize.models[modelName], assocOptions);   
                    }

                }
            }

        }
    }

}


/**
 * Build a MongoDB schema
 *
 * @param  {string} name
 * @param  {SchemaDefinition} definition
 * @param  {MongooseSchemaOptions} options?
 */
export const MongoSchema = (name: string, definition: MongoSchemaDefinition, options?: MongoSchemaOptions) => function(target: Function) {

    // Create a new Mongoose schema
    target.prototype.isAgioModel = true;
    const schema = new Schema(
        definition,
        {
            ...options,
            collection: name,
        }
    );

    // Populate custom methods
    const methods = getCustomMethods(target);
    methods.statics.forEach(staticMethod => schema.statics[staticMethod.name] = staticMethod.caller);
    methods.instance.forEach(method => schema.methods[method.name] = method.caller);

    target = Object.assign(target, MongoModel);
    target.prototype.schema = schema;

}


/**
 * Define class property as getter for specified model
 *
 * @param dbName - The name of synced database
 * @param modelName - The name of defined model
 */
export const Model = (dbName: string, modelName: string) => function (target: VoidFunction, propertyKey: string | symbol) {

    // Create getter for model
    Object.defineProperty(target, propertyKey, {
        get: () => models(dbName, modelName),
        set: () => null,
    });

}


/**
 * Returns the model class methods, statics and instances.
 * 
 * @param  {Function} target
 */
const getCustomMethods = (target: Function) => {

    // Filter blocked properties
    const BLOCKED_PROPERTIES = (name: string) => ![
        'schema',
        'constructor',
    ].includes(name);

    // Retorn object of statics and instance methods list
    return {
        statics: (
            Object
                .getOwnPropertyNames(target)
                .filter(BLOCKED_PROPERTIES)
                .map(name => ({ name, caller: target[name] }))
                .filter(method => typeof method.caller === 'function')
        ),
        instance: (
            Object
                .getOwnPropertyNames(target.prototype)
                .filter(BLOCKED_PROPERTIES)
                .map(name => ({ name, caller: target.prototype[name] }))
                .filter(method => typeof method.caller === 'function')
        ),
    };

};