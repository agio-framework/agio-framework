import { InitOptions as SequelizeSchemaOptions, Model as SequelizeModel, Sequelize, ModelAttributes } from 'sequelize';
import { SchemaDefinition, SchemaOptions as MongooseSchemaOptions, Schema, Model as MongooseModel } from 'mongoose';

export const SQLSchema = (name: string, definition: ModelAttributes, options?: SequelizeSchemaOptions) => function(target: any) {

    target.prototype.schema = (sequelize: Sequelize) => {
        const model = SequelizeModel.init(definition, {...options, sequelize, modelName: name });
        return Object.assign(model, target);
    }

}

export const MongoSchema = (name: string, definition: SchemaDefinition, options?: MongooseSchemaOptions) => function(target: Function) {

    const schema = new Schema(
        definition,
        {
            ...options,
            collection: name,
        }
    );

    const statics = Object.getOwnPropertyNames(target).map(name => ({name, caller: target[name]})).filter(method => typeof method.caller === 'function')
    const methods = Object.getOwnPropertyNames(target.prototype).map(name => ({name, caller: target.prototype[name]})).filter(method => typeof method.caller === 'function')

    statics.forEach(staticMethod => schema.statics[staticMethod.name] = staticMethod.caller)
    methods.forEach(method => schema.methods[method.name] = method.caller)

    target = Object.assign(target, MongooseModel);
    target.prototype.schema = schema;

}