import { generate } from 'orval';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';

await generate('./orval.config.ts', process.cwd(), { throwOnError: true });

// This file contains a custom query-key compatibility helper and is kept
// formatted for reviewability; other Orval output retains generator formatting.
const operationsPath = join(process.cwd(), 'src/telepacs/api/generated/operations/operations.ts');
const operationsSource = await readFile(operationsPath, 'utf8');
const prettierConfig = (await resolveConfig(operationsPath)) || {};
await writeFile(
  operationsPath,
  await format(operationsSource, { ...prettierConfig, filepath: operationsPath })
);
