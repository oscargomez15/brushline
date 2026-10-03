const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { BASE, pages, graph } = require('../src/data/publicSeo');
test('public pages have distinct metadata and valid linked service data', () => {
  const titles = new Set();
  for (const [path, page] of Object.entries(pages)) {
    assert.ok(page.title && page.description);
    assert.ok(!titles.has(page.title)); titles.add(page.title);
    const nodes = graph(path)['@graph'];
    assert.equal(nodes.find(node => node['@type'] === 'WebPage').url, BASE + path);
    assert.equal(nodes[0]['@id'], BASE + '/#business');
    assert.equal(nodes.some(node => node.aggregateRating), false);
    if (page.service) assert.equal(nodes.find(node => node['@type'] === 'Service').provider['@id'], nodes[0]['@id']);
  }
  assert.equal(graph('/crm'), null);
});
test('generated HTML exposes body content and one canonical URL without JavaScript', () => {
  for (const [path] of Object.entries(pages)) {
    const file = path === '/' ? 'build/index.html' : 'build' + path + '.html';
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(html.includes('<h1'), file);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, file);
    assert.ok(html.includes('href="' + BASE + path + '"'), file);
    assert.equal((html.match(/<title/g) || []).length, 1, file);
    for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) {
      const data = JSON.parse(match[1]);
      assert.ok(data['@graph']);
    }
    assert.ok(!html.includes('PaintingService'), file);
    assert.ok(!html.includes('https://www.brushlineservices.com'), file);
  }
});
test('private shell is noindex, unknown routes are 404, and search crawler retains public access', () => {
  assert.ok(fs.readFileSync('build/spa.html', 'utf8').includes('noindex, nofollow'));
  assert.ok(fs.readFileSync('build/404.html', 'utf8').includes('noindex, nofollow'));
  const config = fs.readFileSync('netlify.toml','utf8');
  assert.ok(config.includes('status = 404'));
  assert.ok(config.includes('to = "/spa.html"'));
  const robots=fs.readFileSync('public/robots.txt','utf8');
  assert.ok(robots.includes('User-agent: OAI-SearchBot\nAllow: /'));
  assert.ok(robots.includes('Disallow: /quote/'));
  const sitemap=fs.readFileSync('build/sitemap.xml','utf8');
  assert.equal((sitemap.match(/<url>/g)||[]).length,Object.keys(pages).length);
  assert.ok(!sitemap.includes('/crm'));
});
