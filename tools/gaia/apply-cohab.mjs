#!/usr/bin/env node
// Offline restore uses the same function as the browser loader.
import {readFileSync,writeFileSync} from 'node:fs';
import {fixCohabEnding} from '../../src/gaia-life/cohab-ending-patch.mjs';
if(process.argv.length!==4)throw Error('Usage: node tools/gaia/apply-cohab.mjs INPUT OUTPUT');
const html=readFileSync(process.argv[2],'utf8');
const runtime=readFileSync(new URL('../../src/gaia-life/cohab-ending-runtime.js',import.meta.url),'utf8');
writeFileSync(process.argv[3],fixCohabEnding(html,runtime),'utf8');
