#!/usr/bin/env node

async function flext() {
    const [ command = '' ] = process.argv.slice(2);


    // Doing some checks

    if (command !== 'sync') {
        console.log(`Flext: Unknown command: '${command}'\n\nUsage: flext sync`);
        return;
    }


    await import('./sync-dialects.mjs');
}

flext().catch((e) => {
    const message = e instanceof Error ? e.message : String(e);

    console.error('Flext: Unable to execute: ' + message);

    process.exit(1);
});
