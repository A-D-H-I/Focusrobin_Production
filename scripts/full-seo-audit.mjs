/**
 * Full SEO Audit Script
 * Fetches rendered HTML from production server and validates SEO implementation
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const BASE_URL = 'http://localhost:3000';
const PROD_DOMAIN = 'https://focusrobin.com';

const HTML_DIR = join(projectRoot, 'seo-audit-artifacts', 'html');
const JSONLD_DIR = join(projectRoot, 'seo-audit-artifacts', 'jsonld');

// Ensure directories exist
if (!existsSync(HTML_DIR)) mkdirSync(HTML_DIR, { recursive: true });
if (!existsSync(JSONLD_DIR)) mkdirSync(JSONLD_DIR, { recursive: true });

// Routes to audit
const ROUTES = [
  { path: '/', name: 'home', expectLithuanianBlock: true, expectSunglasses: true, expectLithuania: true },
  { path: '/shop', name: 'shop', expectLithuanianBlock: true, expectSunglasses: true, expectLithuania: true },
  { path: '/about', name: 'about', expectLithuanianBlock: false, expectSunglasses: false, expectLithuania: false },
  { path: '/contact', name: 'contact', expectLithuanianBlock: false, expectSunglasses: false, expectLithuania: false },
  { path: '/shipping', name: 'shipping', expectLithuanianBlock: false, expectSunglasses: true, expectLithuania: true },
  { path: '/returns', name: 'returns', expectLithuanianBlock: false, expectSunglasses: false, expectLithuania: false },
];

// Product slugs discovered from sitemap
const PRODUCT_SLUGS = ['the-vera', 'the-vivienne'];

const results = {
  routes: [],
  robots: null,
  sitemap: null,
  summary: { pass: 0, fail: 0, warnings: 0 }
};

function fetchUrl(url) {
  try {
    const result = execSync(`powershell -Command "(Invoke-WebRequest -Uri '${url}' -UseBasicParsing -TimeoutSec 30).Content"`, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024
    });
    return { status: 200, content: result };
  } catch (error) {
    const statusMatch = error.message.match(/\((\d+)\)/);
    return { status: statusMatch ? parseInt(statusMatch[1]) : 500, content: null };
  }
}

function extractMeta(html, name, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  const regex = new RegExp(`<meta ${attr}="${name}"[^>]+content="([^"]*)"`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1] : null;
}

function extractCanonical(html) {
  const match = html.match(/<link rel="canonical"[^>]+href="([^"]+)"/i);
  return match ? match[1] : null;
}

function extractJsonLd(html) {
  const blocks = [];
  const regex = /<script type="application\/ld\+json">([^<]+)<\/script>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch (e) {
      blocks.push({ error: 'Invalid JSON', raw: match[1].substring(0, 200) });
    }
  }
  return blocks;
}

function checkContent(html, text) {
  return html.toLowerCase().includes(text.toLowerCase());
}

function countOccurrences(html, text) {
  const regex = new RegExp(text, 'gi');
  const matches = html.match(regex);
  return matches ? matches.length : 0;
}

function auditRoute(route) {
  console.log(`\nAuditing: ${route.path}`);
  const url = `${BASE_URL}${route.path}`;
  const { status, content } = fetchUrl(url);
  
  const result = {
    route: route.path,
    name: route.name,
    status,
    checks: {}
  };

  if (status !== 200 || !content) {
    result.checks.httpStatus = { pass: false, value: status, expected: 200 };
    results.summary.fail++;
    results.routes.push(result);
    return result;
  }

  // Save HTML
  const safeName = route.name.replace(/[^a-z0-9]/gi, '-');
  writeFileSync(join(HTML_DIR, `${safeName}.html`), content, 'utf8');

  // Title
  const title = extractTitle(content);
  result.checks.title = {
    pass: title && title.includes('FocusRobin'),
    value: title,
    expected: 'Contains "FocusRobin"'
  };

  // Description
  const description = extractMeta(content, 'description');
  result.checks.description = {
    pass: !!description && description.length > 0,
    value: description ? description.substring(0, 100) + '...' : null,
    expected: 'Non-empty'
  };

  // Canonical
  const canonical = extractCanonical(content);
  const expectedCanonical = route.path === '/' 
    ? PROD_DOMAIN 
    : `${PROD_DOMAIN}${route.path}`;
  result.checks.canonical = {
    pass: canonical === expectedCanonical || canonical === expectedCanonical + '/',
    value: canonical,
    expected: expectedCanonical
  };

  // Open Graph
  const ogTitle = extractMeta(content, 'og:title', true);
  const ogDesc = extractMeta(content, 'og:description', true);
  const ogType = extractMeta(content, 'og:type', true);
  const ogUrl = extractMeta(content, 'og:url', true);
  const ogSiteName = extractMeta(content, 'og:site_name', true);
  const ogLocale = extractMeta(content, 'og:locale', true);
  const ogImage = extractMeta(content, 'og:image', true);

  result.checks.ogTitle = { pass: !!ogTitle, value: ogTitle };
  result.checks.ogDescription = { pass: !!ogDesc, value: ogDesc ? ogDesc.substring(0, 80) + '...' : null };
  result.checks.ogType = { pass: !!ogType, value: ogType };
  result.checks.ogUrl = { pass: !!ogUrl, value: ogUrl };
  result.checks.ogSiteName = { pass: !!ogSiteName, value: ogSiteName };
  result.checks.ogLocale = { pass: !!ogLocale, value: ogLocale };
  result.checks.ogImage = { pass: !!ogImage, value: ogImage };

  // Twitter
  const twitterCard = extractMeta(content, 'twitter:card');
  const twitterTitle = extractMeta(content, 'twitter:title');
  const twitterDesc = extractMeta(content, 'twitter:description');
  const twitterImage = extractMeta(content, 'twitter:image');

  result.checks.twitterCard = { pass: !!twitterCard, value: twitterCard };
  result.checks.twitterTitle = { pass: !!twitterTitle, value: twitterTitle };
  result.checks.twitterDescription = { pass: !!twitterDesc, value: twitterDesc ? twitterDesc.substring(0, 80) + '...' : null };
  result.checks.twitterImage = { pass: !!twitterImage, value: twitterImage };

  // Noindex check
  const hasNoindex = content.includes('noindex');
  result.checks.noindex = { pass: !hasNoindex, value: hasNoindex ? 'FOUND' : 'Not present', expected: 'Not present' };

  // JSON-LD
  const jsonLdBlocks = extractJsonLd(content);
  result.checks.jsonLdCount = { pass: jsonLdBlocks.length > 0, value: jsonLdBlocks.length };
  
  // Save JSON-LD
  jsonLdBlocks.forEach((block, i) => {
    const filename = `${safeName}-${i}.json`;
    writeFileSync(join(JSONLD_DIR, filename), JSON.stringify(block, null, 2), 'utf8');
  });

  if (route.name === 'home') {
    const hasOrg = jsonLdBlocks.some(b => b['@type'] === 'Organization');
    const hasWebsite = jsonLdBlocks.some(b => b['@type'] === 'WebSite');
    result.checks.jsonLdOrganization = { pass: hasOrg, value: hasOrg ? 'Present' : 'Missing' };
    result.checks.jsonLdWebSite = { pass: hasWebsite, value: hasWebsite ? 'Present' : 'Missing' };
  }

  // On-page content checks
  if (route.expectSunglasses) {
    const hasSunglasses = checkContent(content, 'sunglasses');
    result.checks.onPageSunglasses = { pass: hasSunglasses, value: hasSunglasses ? 'Found' : 'Missing' };
  }

  if (route.expectLithuania) {
    const hasLithuania = checkContent(content, 'Lithuania');
    const hasEUSchengen = checkContent(content, 'EU') || checkContent(content, 'Schengen');
    result.checks.onPageLithuania = { pass: hasLithuania, value: hasLithuania ? 'Found' : 'Missing' };
    result.checks.onPageEUSchengen = { pass: hasEUSchengen, value: hasEUSchengen ? 'Found' : 'Missing' };
  }

  // Lithuanian block
  const hasLtBlock = content.includes('lang="lt"');
  if (route.expectLithuanianBlock) {
    result.checks.lithuanianBlock = { pass: hasLtBlock, value: hasLtBlock ? 'Present' : 'Missing' };
    
    // Check phrases appear max once
    const phrase1Count = countOccurrences(content, 'akiniai nuo saulės');
    const phrase2Count = countOccurrences(content, 'saulės akiniai internetu');
    const phrase3Count = countOccurrences(content, 'polarizuoti saulės akiniai');
    
    result.checks.ltPhrase1 = { pass: phrase1Count <= 1, value: phrase1Count, expected: '≤1' };
    result.checks.ltPhrase2 = { pass: phrase2Count <= 1, value: phrase2Count, expected: '≤1' };
    result.checks.ltPhrase3 = { pass: phrase3Count <= 1, value: phrase3Count, expected: '≤1' };
  } else {
    result.checks.lithuanianBlockAbsent = { pass: !hasLtBlock || route.name === 'shipping', value: hasLtBlock ? 'Present (unexpected)' : 'Absent as expected' };
  }

  // Count passes/fails
  Object.values(result.checks).forEach(check => {
    if (check.pass) results.summary.pass++;
    else results.summary.fail++;
  });

  results.routes.push(result);
  return result;
}

function auditProductPage(slug) {
  console.log(`\nAuditing product: ${slug}`);
  const url = `${BASE_URL}/products/${slug}`;
  const { status, content } = fetchUrl(url);
  
  const result = {
    route: `/products/${slug}`,
    name: `product-${slug}`,
    status,
    checks: {}
  };

  if (status !== 200 || !content) {
    result.checks.httpStatus = { pass: false, value: status, expected: 200 };
    results.summary.fail++;
    results.routes.push(result);
    return result;
  }

  // Save HTML
  const safeName = `product-${slug.replace(/[^a-z0-9]/gi, '-')}`;
  writeFileSync(join(HTML_DIR, `${safeName}.html`), content, 'utf8');

  // Title
  const title = extractTitle(content);
  result.checks.title = { pass: title && title.includes('FocusRobin'), value: title };

  // Description
  const description = extractMeta(content, 'description');
  result.checks.description = { pass: !!description, value: description ? description.substring(0, 100) + '...' : null };

  // Canonical
  const canonical = extractCanonical(content);
  result.checks.canonical = { 
    pass: canonical === `${PROD_DOMAIN}/products/${slug}`, 
    value: canonical,
    expected: `${PROD_DOMAIN}/products/${slug}`
  };

  // OG tags
  result.checks.ogTitle = { pass: !!extractMeta(content, 'og:title', true), value: extractMeta(content, 'og:title', true) };
  result.checks.ogImage = { pass: !!extractMeta(content, 'og:image', true), value: extractMeta(content, 'og:image', true) };

  // JSON-LD
  const jsonLdBlocks = extractJsonLd(content);
  const hasProduct = jsonLdBlocks.some(b => b['@type'] === 'Product');
  const hasBreadcrumb = jsonLdBlocks.some(b => b['@type'] === 'BreadcrumbList');
  
  result.checks.jsonLdProduct = { pass: hasProduct, value: hasProduct ? 'Present' : 'Missing' };
  result.checks.jsonLdBreadcrumb = { pass: hasBreadcrumb, value: hasBreadcrumb ? 'Present' : 'Missing' };

  // Save JSON-LD
  jsonLdBlocks.forEach((block, i) => {
    writeFileSync(join(JSONLD_DIR, `${safeName}-${i}.json`), JSON.stringify(block, null, 2), 'utf8');
  });

  // Count
  Object.values(result.checks).forEach(check => {
    if (check.pass) results.summary.pass++;
    else results.summary.fail++;
  });

  results.routes.push(result);
  return result;
}

function auditRobots() {
  console.log('\nAuditing robots.txt');
  const { status, content } = fetchUrl(`${BASE_URL}/robots.txt`);
  
  const result = {
    status,
    checks: {}
  };

  if (status !== 200 || !content) {
    result.checks.httpStatus = { pass: false, value: status };
    results.summary.fail++;
    results.robots = result;
    return;
  }

  // Save snapshot
  writeFileSync(join(projectRoot, 'seo-audit-artifacts', 'robots.txt'), content, 'utf8');

  result.content = content;
  result.checks.hasUserAgent = { pass: content.includes('User-agent: *') || content.includes('User-Agent: *'), value: 'Present' };
  result.checks.hasAllow = { pass: content.includes('Allow: /'), value: 'Present' };
  result.checks.hasSitemap = { 
    pass: content.includes('Sitemap: https://focusrobin.com/sitemap.xml'), 
    value: content.includes('Sitemap:') ? 'Present' : 'Missing'
  };

  Object.values(result.checks).forEach(check => {
    if (check.pass) results.summary.pass++;
    else results.summary.fail++;
  });

  results.robots = result;
}

function auditSitemap() {
  console.log('\nAuditing sitemap.xml');
  const { status, content } = fetchUrl(`${BASE_URL}/sitemap.xml`);
  
  const result = {
    status,
    checks: {}
  };

  if (status !== 200 || !content) {
    result.checks.httpStatus = { pass: false, value: status };
    results.summary.fail++;
    results.sitemap = result;
    return;
  }

  // Save snapshot
  writeFileSync(join(projectRoot, 'seo-audit-artifacts', 'sitemap.xml'), content, 'utf8');

  result.content = content;
  
  // Count URLs
  const urlMatches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
  const urls = urlMatches.map(m => m.replace(/<\/?loc>/g, ''));
  
  result.checks.hasUrls = { pass: urls.length > 0, value: urls.length };
  result.checks.hasHome = { pass: urls.some(u => u === 'https://focusrobin.com' || u === 'https://focusrobin.com/'), value: 'Present' };
  result.checks.hasShop = { pass: urls.some(u => u.includes('/shop')), value: urls.some(u => u.includes('/shop')) ? 'Present' : 'Missing' };
  result.checks.hasProducts = { 
    pass: urls.some(u => u.includes('/products/')), 
    value: urls.filter(u => u.includes('/products/')).length + ' product URLs'
  };

  result.urls = urls;

  Object.values(result.checks).forEach(check => {
    if (check.pass) results.summary.pass++;
    else results.summary.fail++;
  });

  results.sitemap = result;
}

function generateReport() {
  console.log('\n========================================');
  console.log('SEO AUDIT RESULTS');
  console.log('========================================\n');

  console.log(`Summary: ${results.summary.pass} PASS, ${results.summary.fail} FAIL\n`);

  console.log('--- ROUTES ---');
  results.routes.forEach(r => {
    console.log(`\n${r.route} (${r.name}): HTTP ${r.status}`);
    Object.entries(r.checks).forEach(([key, val]) => {
      const icon = val.pass ? '✅' : '❌';
      console.log(`  ${icon} ${key}: ${val.value}`);
    });
  });

  console.log('\n--- ROBOTS.TXT ---');
  if (results.robots) {
    console.log(`Status: ${results.robots.status}`);
    Object.entries(results.robots.checks).forEach(([key, val]) => {
      const icon = val.pass ? '✅' : '❌';
      console.log(`  ${icon} ${key}: ${val.value}`);
    });
  }

  console.log('\n--- SITEMAP.XML ---');
  if (results.sitemap) {
    console.log(`Status: ${results.sitemap.status}`);
    Object.entries(results.sitemap.checks).forEach(([key, val]) => {
      const icon = val.pass ? '✅' : '❌';
      console.log(`  ${icon} ${key}: ${val.value}`);
    });
    if (results.sitemap.urls) {
      console.log('\nURLs in sitemap:');
      results.sitemap.urls.forEach(u => console.log(`  - ${u}`));
    }
  }

  // Save full results
  writeFileSync(
    join(projectRoot, 'seo-audit-artifacts', 'audit-results.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );

  console.log('\n========================================');
  console.log('Artifacts saved to seo-audit-artifacts/');
  console.log('========================================');
}

// Main
console.log('Starting Full SEO Audit...');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Production Domain: ${PROD_DOMAIN}\n`);

// Audit static routes
ROUTES.forEach(route => auditRoute(route));

// Audit product pages
PRODUCT_SLUGS.forEach(slug => auditProductPage(slug));

// Audit robots and sitemap
auditRobots();
auditSitemap();

// Generate report
generateReport();

console.log('\nAudit complete!');

