declare module '@agio/framework/database' {

    type MongoSchemaOptions     = import('mongoose').SchemaOptions;
    type MongoSchemaDefinition  = import('mongoose').SchemaDefinition;
    export type MongoModel<T>   = import('mongoose').Model<T & import('mongoose').Document>;
    export const MongoDataTypes : typeof import('mongoose').Types;


    type Association = import('sequelize').AssociationOptions & { model: string; };
    interface Associations {
        hasOne?: Association[];
        hasMany?: Association[];
        belongsTo?: Association[];
        belongsToMany?: Association[];
    }
    type SQLSchemaOptions       = import('sequelize').ModelOptions & {associations?: Associations};
    type SQLSchemaDefinition    = import('sequelize').ModelAttributes;
    export type SQLModel<M>     = { new (): M & import('sequelize').Model<M>} & typeof import('sequelize').Model;
    export const SQLDataTypes   : typeof import('sequelize').DataTypes;


    export const SQLSchema: (name: string, definition: SQLSchemaDefinition, options?: SQLSchemaOptions) => ClassDecorator;
    export const MongoSchema: (name: string, definition: MongoSchemaDefinition, options?: MongoSchemaOptions) => ClassDecorator;

    class Database {
        constructor(
            uri: string,
            dbName: string,
            options?: {[key: string]: any}
        );
    }
}