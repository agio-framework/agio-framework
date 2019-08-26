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
    target.prototype.schema = function() {
        return (sequelize: Sequelize) => {

            // Schema associations
            const { associations } = options;
            delete options.associations;
    
            // Create a new sequelize schema
            const model: any = SQLModel.init(definition, {...options, sequelize, modelName: name });
            
            // Populate custom methods
            const methods = getCustomMethods(target);
            methods.statics.forEach(method => model[method.name] = method.caller);
            methods.instance.forEach(method => (model as any).prototype[method.name] = method.caller);
    
            model.associate = (models) => {
                // console.log('>>> Assoc: ', name, models, !!associations);
            }
    
            return Object.assign(model, target);
        }
    }()

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