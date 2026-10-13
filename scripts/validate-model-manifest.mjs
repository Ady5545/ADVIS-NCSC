#!/usr/bin/env node
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filePath = path.join(root, 'src/SpatialLibrary.ts');
const source = readFileSync(filePath, 'utf8');
const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const errors = [];
const warnings = [];

function propertyName(node) {
  if (!node || !node.name) return undefined;
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) || ts.isNumericLiteral(node.name)) return node.name.text;
  return undefined;
}

function objectProperty(object, name) {
  if (!object || !ts.isObjectLiteralExpression(object)) return undefined;
  return object.properties.find((property) => propertyName(property) === name);
}

function propertyValue(object, name) {
  const property = objectProperty(object, name);
  return property && ts.isPropertyAssignment(property) ? property.initializer : undefined;
}

function stringValue(node) {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : undefined;
}

function numericValue(node) {
  if (node && ts.isNumericLiteral(node)) return Number(node.text);
  if (node && ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.Minus && ts.isNumericLiteral(node.operand)) {
    return -Number(node.operand.text);
  }
  return undefined;
}

function literalTuple(node, length) {
  if (!node || !ts.isArrayLiteralExpression(node) || node.elements.length !== length) return undefined;
  const values = node.elements.map(numericValue);
  return values.every((value) => typeof value === 'number' && Number.isFinite(value)) ? values : undefined;
}

function report(code, message) {
  errors.push({ code, message });
}

function findCatalog() {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === 'SPATIAL_LIBRARY') {
        if (declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) return declaration.initializer;
      }
    }
  }
  return undefined;
}

const catalog = findCatalog();
if (!catalog) {
  console.error('[model-manifest] Could not find a literal SPATIAL_LIBRARY object.');
  process.exit(1);
}

const catalogKeys = new Set();
let checkedModels = 0;
let checkedComponents = 0;

for (const entry of catalog.properties) {
  if (!ts.isPropertyAssignment(entry)) continue;
  const key = propertyName(entry);
  const model = entry.initializer;
  if (!key || !ts.isObjectLiteralExpression(model)) continue;
  if (catalogKeys.has(key)) report('DUPLICATE_MODEL_KEY', `Duplicate catalog key "${key}".`);
  catalogKeys.add(key);
  checkedModels += 1;

  const id = stringValue(propertyValue(model, 'id'));
  const name = stringValue(propertyValue(model, 'name'));
  const category = stringValue(propertyValue(model, 'category'));
  const defaultScale = numericValue(propertyValue(model, 'defaultScale'));

  if (!id) report('MISSING_MODEL_ID', `Catalog entry "${key}" has no literal string id.`);
  else if (id !== key) warnings.push(`Catalog key "${key}" differs from model id "${id}"; confirm the alias is intentional.`);
  if (!name) report('MISSING_MODEL_NAME', `Catalog entry "${key}" has no literal string name.`);
  if (!category) warnings.push(`Catalog entry "${key}" has no literal string category.`);
  if (typeof defaultScale === 'number' && (!Number.isFinite(defaultScale) || defaultScale <= 0)) {
    report('INVALID_DEFAULT_SCALE', `Model "${key}" defaultScale must be finite and greater than zero.`);
  }

  const components = propertyValue(model, 'components');
  if (!components || !ts.isArrayLiteralExpression(components)) {
    warnings.push(`Model "${key}" uses a non-literal component list; deep component checks were skipped.`);
    continue;
  }

  const componentIds = new Set();
  for (const component of components.elements) {
    if (!ts.isObjectLiteralExpression(component)) continue;
    checkedComponents += 1;
    const componentId = stringValue(propertyValue(component, 'id'));
    const componentName = stringValue(propertyValue(component, 'name'));
    if (!componentId) {
      report('MISSING_COMPONENT_ID', `Model "${key}" contains a component without a literal string id.`);
      continue;
    }
    if (componentIds.has(componentId)) report('DUPLICATE_COMPONENT_ID', `Model "${key}" repeats component id "${componentId}".`);
    componentIds.add(componentId);
    if (!componentName) report('MISSING_COMPONENT_NAME', `Model "${key}" component "${componentId}" has no literal string name.`);

    for (const field of ['position', 'size', 'explodedOffset']) {
      const tuple = propertyValue(component, field);
      if (tuple && ts.isArrayLiteralExpression(tuple)) {
        const parsed = literalTuple(tuple, 3);
        if (!parsed) report('INVALID_TRANSFORM_TUPLE', `Model "${key}" component "${componentId}" has an invalid ${field}; expected three finite numeric literals.`);
      }
    }
  }
}

for (const diagnostic of sourceFile.parseDiagnostics) {
  report('TYPESCRIPT_PARSE_ERROR', ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

console.log(`[model-manifest] Checked ${checkedModels} models and ${checkedComponents} literal components.`);
for (const warning of warnings) console.warn(`[model-manifest] WARN: ${warning}`);
if (errors.length) {
  for (const issue of errors) console.error(`[model-manifest] ERROR ${issue.code}: ${issue.message}`);
  console.error(`[model-manifest] Failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log('[model-manifest] Required catalog IDs, names, duplicate checks, and literal transform tuples passed.');
console.log('[model-manifest] Provenance/validation omissions are tracked separately and are not inferred as success.');
