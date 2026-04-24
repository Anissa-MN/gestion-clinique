const fs = require('fs');
const path = require('path');

let envLoaded = false;

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const separatorIndex = trimmed.indexOf('=');
  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadEnv() {
  if (envLoaded) {
    return;
  }

  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const entry = parseLine(line);
    if (!entry) {
      return;
    }

    if (typeof process.env[entry.key] === 'undefined') {
      process.env[entry.key] = entry.value;
    }
  });

  envLoaded = true;
}

module.exports = loadEnv;
