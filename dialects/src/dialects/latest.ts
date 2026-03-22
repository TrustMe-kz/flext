import { Dialect } from '@flext/core';

export class LatestDialect extends Dialect {
    public name = 'latest';
    public aliases = [ '1.0' ];
}

export default LatestDialect;
