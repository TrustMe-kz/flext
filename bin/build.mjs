#!/usr/bin/env node

import esbuild from 'esbuild';
import babelPlugin from '../babel-plugin.js';

esbuild.build({
    entryPoints: [ 'src/index.ts' ],
    outfile: 'dist/index.cjs',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    sourcemap: false,
    minify: true,
    plugins: [ babelPlugin() ],
}).catch(() => process.exit(1));

esbuild.build({
    entryPoints: [ 'src/index.ts' ],
    outfile: 'dist/index.js',
    bundle: true,
    platform: 'node',
    format: 'esm',
    sourcemap: false,
    minify: true,
}).catch(() => process.exit(1));
