/**
 * i18n string extractor
 *
 * Scans src/ for <TranslatableText text=... /> usages and writes every translatable
 * English string to src/i18n/messages/en.json (the source catalog). Translations in
 * lt.json / ru.json are keyed by that same English text.
 *
 * Literal values (text="Shop now", text={cond ? "A" : "B"}) are collected directly.
 * Non-literal values (text={item.title}) are resolved by collecting string literals
 * assigned to a property of the same name (title: "...") in the same file.
 *
 * Usage:
 *   npx tsx scripts/i18n-extract.ts          # rewrite en.json, report missing lt/ru keys
 *   npx tsx scripts/i18n-extract.ts --check  # exit 1 if lt/ru are missing keys
 */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const MESSAGES_DIR = path.join(SRC, 'i18n', 'messages');
const TARGET_LOCALES = ['lt', 'ru'];
const SKIP_DIRS = ['app/test-translation', 'components/examples', 'app/admin', 'app/api'];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(SRC, full).replace(/\\/g, '/');
    if (SKIP_DIRS.some((d) => rel.startsWith(d))) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function decodeJsxEntities(s: string): string {
  return s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function collectStringLiterals(node: ts.Node, out: Set<string>) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    out.add(node.text);
    return;
  }
  // Don't descend into property accesses / calls' callee names, only their arguments
  ts.forEachChild(node, (child) => collectStringLiterals(child, out));
}

function propertyNameOf(expr: ts.Expression): string | null {
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isNonNullExpression(expr) || ts.isParenthesizedExpression(expr)) return propertyNameOf(expr.expression);
  return null;
}

function extractFromFile(file: string, strings: Set<string>) {
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('TranslatableText')) return;
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const wantedProps = new Set<string>();

  const visitJsx = (node: ts.Node) => {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(sf) === 'TranslatableText') {
      const attrs = node.attributes.properties;
      const skip = attrs.some((a) => ts.isJsxAttribute(a) && a.name.getText(sf) === 'skipTranslation');
      if (skip) return;
      for (const attr of attrs) {
        if (!ts.isJsxAttribute(attr) || attr.name.getText(sf) !== 'text' || !attr.initializer) continue;
        const init = attr.initializer;
        if (ts.isStringLiteral(init)) {
          // JSX decodes HTML entities in attribute strings at runtime (text="don&apos;t" -> "don't")
          strings.add(decodeJsxEntities(init.text));
        } else if (ts.isJsxExpression(init) && init.expression) {
          collectStringLiterals(init.expression, strings);
          // Resolve item.title / title / item to sibling data declarations
          const visitExpr = (e: ts.Node) => {
            if (ts.isExpression(e)) {
              const name = propertyNameOf(e);
              if (name) wantedProps.add(name);
            }
            if (!ts.isPropertyAccessExpression(e)) ts.forEachChild(e, visitExpr);
          };
          visitExpr(init.expression);
        }
      }
    }
    ts.forEachChild(node, visitJsx);
  };
  visitJsx(sf);

  if (wantedProps.size === 0) return;

  // Collect `prop: "literal"` and `prop: ["a", "b"]` assignments, plus `const prop = [...]` arrays of strings
  const visitData = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node) && wantedProps.has(node.name.getText(sf).replace(/['"]/g, ''))) {
      collectStringLiterals(node.initializer, strings);
    }
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
      // e.g. const tips = ["...", "..."]; rendered via tips.map(tip => <TranslatableText text={tip} />)
      const elements = node.initializer.elements;
      if (elements.length > 0 && elements.every((el) => ts.isStringLiteral(el))) {
        elements.forEach((el) => strings.add((el as ts.StringLiteral).text));
      }
    }
    ts.forEachChild(node, visitData);
  };
  visitData(sf);
}

function isTranslatable(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  if (!/[A-Za-z]/.test(t)) return false;
  if (/^(https?:|\/|#|mailto:|tel:)/.test(t)) return false; // urls / paths / anchors
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(t)) return false; // slugs / css-ish tokens
  if (/^[a-z]+[A-Z]\w*$/.test(t)) return false; // camelCase identifiers
  if (/\.(png|jpe?g|svg|webp|gif|glb|mp4)$/i.test(t)) return false;
  return true;
}

function readJson(file: string): Record<string, string> {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

function main() {
  const check = process.argv.includes('--check');
  const strings = new Set<string>();
  for (const file of walk(SRC)) extractFromFile(file, strings);

  const keys = [...strings].filter(isTranslatable).sort((a, b) => a.localeCompare(b));
  const catalog: Record<string, string> = Object.fromEntries(keys.map((k) => [k, k]));

  fs.mkdirSync(MESSAGES_DIR, { recursive: true });
  if (!check) {
    fs.writeFileSync(path.join(MESSAGES_DIR, 'en.json'), JSON.stringify(catalog, null, 2) + '\n');
  }
  console.log(`[i18n] ${keys.length} translatable strings`);

  let missingTotal = 0;
  for (const locale of TARGET_LOCALES) {
    const messages = readJson(path.join(MESSAGES_DIR, `${locale}.json`));
    const missing = keys.filter((k) => !messages[k]);
    const unused = Object.keys(messages).filter((k) => !(k in catalog));
    missingTotal += missing.length;
    console.log(`[i18n] ${locale}: ${missing.length} missing, ${unused.length} unused`);
    if (missing.length && check) missing.slice(0, 50).forEach((k) => console.log(`  - ${k}`));
  }
  if (check && missingTotal > 0) process.exit(1);
}

main();
