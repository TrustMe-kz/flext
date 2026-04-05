import { AST } from '@handlebars/parser';
import { types, lib, Dialect, BaseError, BaseWarning } from '@flext/core';


// Constants

export const HANDLEBARS_COMMENT_BEGIN = '{{!--';

export const DIALECT_MACRO = 'syntax';

export const LEGACY_DIALECT_MACRO = 'v';


export class LegacyDialect extends Dialect {
    public name = '1.0.beta4';

    public testAst(val: AST.Program, doWarn?: boolean|null): boolean {

        // Doing some checks

        if (!this.name)
            throw new BaseError(`Flext: Unable to test the template: 'name' param is not set in the dialect`);


        // Doing some checks

        const macros = lib.astToMacros(val);
        const macro = macros?.find(m => m?.name === LEGACY_DIALECT_MACRO) ?? null;

        if (!macro) {
            if (doWarn)
                throw new BaseWarning(`Flext: Unable to test the template: '@v' macro is not set`);
            else
                return false;
        }


        // Getting the dialect

        const [ param ] = macro?.params ?? [];

        if (!param) {
            if (doWarn)
                throw new BaseWarning(`Flext: Unable to test the template: Bad '@v' macro`);
            else
                return false;
        }


        if (this.aliases && this.aliases?.length)
            return param?.value === this.name || lib.inarr(param?.value, ...this.aliases);
        else
            return param?.value === this.name;
    }

    public templateToStandard(template: types.Template): types.StandardTemplate {
        let result = template;


        // Defining the functions

        const filter = (search: string, val: string): void => { result = result.replace(search, val); };


        // Getting the template

        filter(HANDLEBARS_COMMENT_BEGIN + ' @' + LEGACY_DIALECT_MACRO, HANDLEBARS_COMMENT_BEGIN + ' @' + DIALECT_MACRO); // '{{!-- @v' --> '{{!-- @syntax'
        filter(HANDLEBARS_COMMENT_BEGIN + '@' + LEGACY_DIALECT_MACRO, HANDLEBARS_COMMENT_BEGIN + '@' + DIALECT_MACRO);   // '{{!--@v'  --> '{{!--@syntax'


        return result;
    }
}

export default LegacyDialect;
