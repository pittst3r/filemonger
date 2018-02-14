#!/usr/bin/env node

const { join } = require("path");

const mongerfile = require(join(process.cwd(), "mongerfile"));

mongerfile();
