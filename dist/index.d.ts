#!/usr/bin/env node
import { Command } from 'commander';

declare const version = "0.1.0";
declare function createCli(): Command;

export { createCli, version };
