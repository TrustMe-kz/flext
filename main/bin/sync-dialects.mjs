#!/usr/bin/env node

import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

const DEFAULT_JS_FILENAME = 'unknown.js';
const DEFAULT_CJS_FILENAME = 'unknown.cjs';
const DIALECTS_HOST = 'https://raw.githubusercontent.com/TrustMe-kz/flext/refs/heads/v2-0-0/main/main/dialects';
const INDEX_FILENAME = 'index.json';
const OUT_DIR = 'dialects';

const dir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(dir, '..');
const outDir = resolve(rootDir, OUT_DIR);

async function get(url) {
    const response = await fetch(url);

    if (response.ok)
        return response;
    else
        throw new Error(`Flext: Unable to sync the dialect files: Error fetching '${url}' (HTTP ${response.status})`);
}

function save(val, path) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, val);
}

function path(filename) {
    const path = resolve(outDir, filename);
    const rel = relative(outDir, path);

    if (rel?.startsWith('..'))
        throw new Error(`Flext: Unable to sync the dialect files: Bad path '${filename}'`);
    else
        return path;
}

async function sync() {

    // Getting the index

    const jsonUrl = `${DIALECTS_HOST}/${INDEX_FILENAME}`;
    const dialectsStr = await get(jsonUrl);
    const dialectsObj = await dialectsStr.json();
    const dialects = Array.isArray(dialectsObj?.dialects) ? dialectsObj.dialects : null;

    if (!dialects)
        throw new Error('Flext: Unable to sync the dialect files: Bad response');


    // Getting the data

    const files = new Set();

    for (const dialect of dialects) {
        files.add(dialect?.esm?.trim() ?? DEFAULT_JS_FILENAME);
        files.add(dialect?.cjs?.trim() ?? DEFAULT_CJS_FILENAME);
    }


    // Saving the files

    mkdirSync(outDir, { recursive: true });

    for (const file of files) {
        const fileUrl = `${DIALECTS_HOST}/${file}`;
        const filePath = path(file);
        const response = await get(fileUrl);
        const content = await response.text();

        save(content, filePath);
    }


    console.log(`Flext: Synced ${files.size} dialect files to '${outDir}'`);
}

sync().catch((e) => {
    const message = e instanceof Error ? e.message : String(e);

    console.error('Flext: Unable to sync the dialect files: ' + message);

    process.exit(1);
});
