import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(__dirname, '../docs/event-collection-redesign/sources.schema.yaml');
const configPath = path.resolve(__dirname, '../services/eventCollector/config/sources.yaml');

async function loadYaml(p) {
  const content = await fs.readFile(p, 'utf8');
  return YAML.parse(content);
}

function formatErrors(errors) {
  return errors.map((e) => {
    const instancePath = e.instancePath || '(root)';
    const params = e.params ? JSON.stringify(e.params) : '';
    return `- ${instancePath} ${e.message || ''} ${params}`.trim();
  }).join('\n');
}

async function main() {
  try {
    const [schema, config] = await Promise.all([
      loadYaml(schemaPath),
      loadYaml(configPath)
    ]);

    const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(config);

    if (!valid) {
      console.error('❌ sources.yaml のスキーマ検証に失敗しました');
      console.error(`  schema: ${path.relative(process.cwd(), schemaPath)}`);
      console.error(`  file  : ${path.relative(process.cwd(), configPath)}`);
      console.error('\n詳細:');
      console.error(formatErrors(validate.errors || []));
      process.exit(1);
    }

    console.log('✅ sources.yaml はスキーマに適合しています');
    // 参考: 登録総数の簡易サマリ
    const countArray = (arr) => Array.isArray(arr) ? arr.length : 0;
    const regional = config.regional || {};
    const total = (
      countArray(config.government) + countArray(config.tourism) + countArray(config.festivals) +
      countArray(config.food_events) + countArray(config.sports) + countArray(config.nature) +
      countArray(config.community) + countArray(config.business) +
      countArray(regional.kenou) + countArray(regional.kennan) + countArray(regional.engan) + countArray(regional.kenpoku)
    );
    console.log(`登録ソース数 合計: ${total}`);
  } catch (err) {
    console.error('⚠️ 検証中にエラーが発生しました:', err?.message || err);
    process.exit(2);
  }
}

main();

