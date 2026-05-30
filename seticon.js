#!/usr/bin/env node

import { main } from './src/cli.js';

main().catch(error => {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
});
