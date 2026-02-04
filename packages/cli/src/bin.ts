#!/usr/bin/env node
/**
 * CLI executable entry point.
 * @module bin
 */

import { createCli } from './cli.js';

const VERSION = '0.0.1';

const cli = createCli({
  name: 'gpx-cli',
  version: VERSION,
});

cli.parse(process.argv);
