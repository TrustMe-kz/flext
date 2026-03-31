import { AST } from '@handlebars/parser';
import { Template, StandardTemplate, DialectInterface } from '@/types';
import { inarr, isObject, hbsToAst, astToMacros } from '@/lib';
import { BaseError, BaseWarning } from '@/errors';


// Constants

export const DIALECT_MACRO = 'syntax';


// Classes

export class Dialect implements DialectInterface {
    declare public name: string;
    declare public aliases: string[];

    public testAst(val: AST.Program, doWarn?: boolean|null): boolean {

        // Doing some checks

        if (!this.name)
            throw new BaseError(`Flext: Unable to test the template: 'name' param is not set in the dialect`);


        // Doing some checks

        const macros = astToMacros(val);
        const macro = macros?.find(m => m?.name === DIALECT_MACRO) ?? null;

        if (!macro) {
            if (doWarn)
                throw new BaseWarning(`Flext: Unable to test the template: '@syntax' macro is not set`);
            else
                return false;
        }


        // Getting the dialect

        const [ param ] = macro?.params ?? [];

        if (!param) {
            if (doWarn)
                throw new BaseWarning(`Flext: Unable to test the template: Bad '@syntax' macro`);
            else
                return false;
        }


        if (this.aliases && this.aliases?.length)
            return param?.value === this.name || inarr(param?.value, ...this.aliases);
        else
            return param?.value === this.name;
    }

    public test(template: Template | AST.Program, doWarn?: boolean|null): boolean {
        const isAst = isObject(template) && !!(template as AST.Program)?.body;
        const ast = isAst ? (template as AST.Program) : hbsToAst(String(template));

        return this.testAst(ast, doWarn);
    }

    public templateToStandard(template: Template): StandardTemplate {
        return template;
    }
}

export class StandardDialect extends Dialect {
    public name = 'standard';
}


export default Dialect;
