type SequelizeModel = typeof import('sequelize').Model;

declare module '@agio/framework/database' {

    // Schema options
    type SQLSchemaOptions = import('sequelize').ModelOptions & {associations?: Associations};
    type MongoSchemaOptions = import('mongoose').SchemaOptions;
    type SQLSchemaDefinition = import('sequelize').ModelAttributes;
    type MongoSchemaDefinition = import('mongoose').SchemaDefinition;
    

    // SQL associations
    type Association = import('sequelize').AssociationOptions & { model: string; };
    interface Associations {
        hasOne?: Association[];
        hasMany?: Association[];
        belongsTo?: Association[];
        belongsToMany?: Association[];
    }


    // Mongodb model and types
    export type MongoModel<T> = import('mongoose').Model<T & import('mongoose').Document>;
    export const MongoDataTypes: typeof import('mongoose').Types;


    // SQL model and types
    export type SQLModel<T> = SequelizeModel & { new (): T & import('sequelize').Model<T>; }
    export const SQLDataTypes: typeof import('sequelize').DataTypes;


    // Decorators
    export const Model: (dbName: string, modelName: string) => PropertyDecorator;
    export const SQLSchema: (name: string, definition: SQLSchemaDefinition, options?: SQLSchemaOptions) => ClassDecorator;
    export const MongoSchema: (name: string, definition: MongoSchemaDefinition, options?: MongoSchemaOptions) => ClassDecorator;

    interface DBConfig {
        
        uri: string;

        dbName: string;

        seeds?: {
            [key: string]: string;
        };

        options?: {
            [key: string]: any;
        };

    }

    class Database {
        constructor(
            dbConfig: DBConfig
        );
    }

}