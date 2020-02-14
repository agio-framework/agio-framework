declare module '@agio/framework/validator' {

    type ValidatorSchemaMap = import('@hapi/joi').SchemaMap;

    type TypesContructors = StringConstructor | BooleanConstructor | ArrayConstructor | NumberConstructor | DateConstructor;
    
    interface FieldCustomSchema {
        type?: string | TypesContructors;
        items?: ValidatorSchema | string | TypesContructors | TypesContructors[];
        required?: boolean;
    }
    
    interface ValidatorSchema {
        [key: string]: FieldCustomSchema | TypesContructors | ValidatorSchema | ValidatorSchemaMap;
    }

    type ValidatorOptions = {
        provideTo: 'request' | 'response',
        validate: string[]
    }

    export const Validator: (options: ValidatorOptions) => ClassDecorator;

}