#!/usr/bin/env node

import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import esbuild from 'esbuild';
import babelPlugin from '../babel-plugin.js';

const dir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(dir, '..');
const srcDir = resolve(rootDir, 'src/dialects');
const outDir = resolve(rootDir, 'dialects');

const entryPoints = readdirSync(srcDir, { withFileTypes: true })
    .filter(f => f?.isFile() && f?.name?.endsWith('.ts') && f?.name !== 'index.ts')
    .map(f => resolve(srcDir, f.name));

const dialects = entryPoints
    .map(entryPoint => basename(entryPoint, '.ts'))
    .sort();

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const build = async () => {
    await Promise.all([
        esbuild.build({
            entryPoints: entryPoints,
            plugins: [ babelPlugin() ],
            outdir: outDir,
            outbase: srcDir,
            outExtension: { '.js': '.cjs' },
            platform: 'node',
            format: 'cjs',
            bundle: true,
            minify: true,
            external: [ '@flext/core' ],
        }),

        esbuild.build({
            entryPoints: entryPoints,
            outdir: outDir,
            outbase: srcDir,
            platform: 'node',
            format: 'esm',
            bundle: true,
            packages: 'external',
            minify: true,
            external: [ '@flext/core' ],
        }),
    ]);

    writeFileSync(resolve(outDir, 'index.json'), `${JSON.stringify({
        dialects: dialects?.map(name => ({
            name: name,
            esm: `${name}.js`,
            cjs: `${name}.cjs`,
        }) ?? []),
    }, null, 2)}\n`);
};

build().catch(() => process.exit(1));
