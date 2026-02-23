#!/usr/bin/env node

import esbuild from 'esbuild';
import babelPlugin from '../babel-plugin.js';

esbuild.build({
    entryPoints: [ 'src/index.ts' ],
    plugins: [ babelPlugin() ],
    loader: { '.css': 'text' },
    outfile: 'dist/index.cjs',
    platform: 'node',
    format: 'cjs',
    bundle: true,
    sourcemap: true,
    minify: true,
}).catch(() => process.exit(1));

esbuild.build({
    entryPoints: [ 'src/index.ts' ],
    loader: { '.css': 'text' },
    outfile: 'dist/index.js',
    platform: 'node',
    format: 'esm',
    bundle: true,
    sourcemap: true,
    minify: true,
}).catch(() => process.exit(1));
