import fs from 'fs';
import babelCore from '@babel/core';

export function plugin() {
    return {
        name: 'babel',
        setup(build) {
            build.onLoad({ filter: /\.(js|ts)$/ }, async (args) => {
                const source = await fs.promises.readFile(args.path, 'utf8');
                const { code } = babelCore.transformSync(source, {
                    filename: args.path,
                    presets: [
                        '@babel/preset-env',
                        [ "@babel/preset-typescript", { "allowDeclareFields": true } ]
                    ],
                });
                return { contents: code, loader: 'js' };
            });
        },
    }
}

export default plugin;
