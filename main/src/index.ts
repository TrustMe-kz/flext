import { types as coreTypes, lib, errors, Obj, Macro, Field, FieldType, FieldValue, FieldValueOption, DataModel, DataModelNode, MetadataModelNode, CollectorFilterHandler, ParseTemplateHandler, GetTemplateTitleHandler, GetTemplateMacroHandler, BaseThrowable, BaseWarning, BaseError, PotentialLoopError, TemplateError, TemplateSyntaxError, TemplateDataValidationError, Processor, SimpleProcessor, Dialect } from '@flext/core';
import * as core from '@flext/core';
import * as types from '@/types';
import dialects from '@flext/dialects';


// Variables

export const latestDialect = new dialects.Latest();


export class Flext extends Processor implements types.FlextInterface {
    setTemplate(val: coreTypes.Template): this {
        const ast = lib.hbsToAst(val);
        const macros = lib.astToMacros(ast);


        // Getting the macro

        const macro = macros?.find(m => m?.name === 'dialect') ?? null;

        if (!macro) {
            this.setDialect(latestDialect);
            return super.setTemplate(val);
        }


        // Getting the macro param

        const [ param ] = macro?.params ?? [];

        if (!param)
            throw new errors.BaseError(`Flext: Unable to set the template: Bad '@dialect' macro: ` + lib.audit(macro));


        // Getting the dialect

        const dialectName = param?.value ?? null;

        if (!dialectName)
            throw new errors.BaseError(`Flext: Unable to set the template: Bad '@dialect' macro: ` + lib.audit(macro));


        // Setting the dialect

        for (const key in dialects) {
            if (!lib.has(dialects, key as any)) continue;


            // Getting the bundled dialect

            const Dialect = dialects[key];
            const dialect = new Dialect();

            if (dialectName !== dialect?.name) continue;


            // Setting the bundled dialect

            this.setDialect(dialect);


            break;
        }


        return super.setTemplate(val);
    }
}

export {
    Obj,
    Macro,
    Field,
    FieldType,
    FieldValue,
    FieldValueOption,
    DataModel,
    DataModelNode,
    MetadataModelNode,
    CollectorFilterHandler,
    ParseTemplateHandler,
    GetTemplateTitleHandler,
    GetTemplateMacroHandler,
    BaseThrowable,
    BaseWarning,
    BaseError,
    PotentialLoopError,
    TemplateError,
    TemplateSyntaxError,
    TemplateDataValidationError,
    Processor,
    SimpleProcessor,
    Dialect,
    core,
};

export default Flext;
