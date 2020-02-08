import Joi from '@hapi/joi';

import { ValidatorSchema, ValidatorSchemaMap } from '@agio/framework/validator';

const types = [
    Date,
    Array,
    Number,
    String,
    Boolean,
    'date',
    'array',
    'number',
    'string',
    'boolean',
];


/**
 * Build a object validator schema
 *
 * @param fieldsMap
 */
export const schema = (fieldsMap: ValidatorSchema) => {
    return Joi.object(mapSchema(fieldsMap));
}

const mapSchema = (fieldsMap: ValidatorSchema) => {

    // Return undefined if map is invalid
    if (!fieldsMap || typeof fieldsMap !== 'object') return;

    // Empty schema map
    const schema = {};

    for (const field in fieldsMap) {

        let map = fieldsMap[field];

        // Empty validation
        if (!map) throw new Error('empty validator');

        // This field value is a nested object
        if (typeof map === 'object' && !types.includes(map.type as any)) {

            const fieldIsRequired = map.required;
            delete map.required;

            // Generate schemaObject recursively
            schema[field] = mapSchema(map as ValidatorSchema);

            // If object has required euqal true, than required
            if (fieldIsRequired) schema[field] = Joi.object(schema[field]).required();

            // Nothing to do, go to next field
            continue;

        }


        // Convert type field
        if (typeof map === 'function') map = { type: map.name.toString().toLowerCase() }
        else if (typeof map.type === 'function') map.type = map.type.name.toLowerCase();
        

        // Items validation
        if (typeof map === 'object' && map.items) {

            const { items } = map;

            // Items field is a constructor type, convert to string
            if (typeof items === 'function') map.items = Joi[items.name.toLowerCase()]();

            // Items field is a simple string, just build joi schema
            else if (typeof items === 'string') map.items = Joi[items]();

            // Items field is a array of, just build joi schema
            else if (Array.isArray(items)) {

                const isTypeConstructor = typeof items[0] === 'function';
                const validatorName = isTypeConstructor ? (items[0] as any).name.toLowerCase() : items[0];

                map.items = Joi[validatorName]();

            }

            // Items field is a nested object with joi shcema, run function recursively
            else if (typeof items === 'object') map.items = mapSchema(items as ValidatorSchema);

            // Items definition is invalid, not to do
            else throw new Error(`Invalid 'items' definition for: ${field} `);

        }


        // Check if type validation exists on joi
        if (!Joi[map.type as string]) throw new Error(`Invalid validator: ${map.type}`);


        // Build a nested validator with joi
        let nested = Joi[map.type as string]();
        delete map.type;
        
        for (const validator in map) nested = nested[validator](map[validator]);

        schema[field] = nested;

    }


    // Return the final objectSchema
    return schema as ValidatorSchemaMap;


}