/**
 * Route Parser Utility
 * Parses generated TSX code to extract route/page definitions for the Page Navigator.
 * Supports:
 *  - React Router <Route path="..." /> patterns
 *  - Tab-based navigation (useState with string tabs like 'products', 'about', etc.)
 *  - Nav link arrays with section names
 */

export interface SitePage {
  id: string;
  path: string;
  label: string;
}

// Known page/tab names to detect
const KNOWN_PAGES = new Set([
  'home', 'about', 'contact', 'products', 'services', 'pricing',
  'faq', 'blog', 'portfolio', 'gallery', 'members', 'shop',
  'checkout', 'cart', 'projects', 'support', 'bundles', 'store',
  'resources', 'team', 'testimonials', 'features', 'downloads',
]);

/**
 * Parse routes from generated React code
 */
export function parseRoutesFromCode(code: string): SitePage[] {
  if (!code) return [{ id: 'home', path: '/', label: 'Home' }];

  const pages: SitePage[] = [{ id: 'home', path: '/', label: 'Home' }];
  const foundIds = new Set<string>(['home']);

  // 1. Detect <Route path="/..." /> patterns
  const routeRegex = /<Route[^>]*path=["']([^"']+)["'][^>]*>/g;
  let match;
  while ((match = routeRegex.exec(code)) !== null) {
    const path = match[1];
    if (!path || path === '/' || path.includes(':') || path.includes('*')) continue;
    const id = path.replace(/^\//, '').toLowerCase();
    if (foundIds.has(id)) continue;
    foundIds.add(id);
    pages.push({ id, path, label: toLabel(id) });
  }

  // 2. Detect tab-based navigation: setActiveTab('products'), activeTab === 'about', etc.
  // Look for string literals used as tab identifiers
  const tabPatterns = [
    /setActive(?:Tab|Section|Page)\s*\(\s*['"]([a-z][a-zA-Z0-9_-]*)['"](?:\s*\))?/g,
    /active(?:Tab|Section|Page)\s*===?\s*['"]([a-z][a-zA-Z0-9_-]*)['"]/g,
    /(?:tab|section|page)\s*:\s*['"]([a-z][a-zA-Z0-9_-]*)['"]/g,
  ];

  for (const pattern of tabPatterns) {
    let tabMatch;
    while ((tabMatch = pattern.exec(code)) !== null) {
      const tabName = tabMatch[1].toLowerCase();
      if (foundIds.has(tabName)) continue;
      if (KNOWN_PAGES.has(tabName) || tabName.length >= 3) {
        foundIds.add(tabName);
        pages.push({ id: tabName, path: `/${tabName}`, label: toLabel(tabName) });
      }
    }
  }

  // 3. Detect nav link arrays: { label: 'Products', ... } or onClick patterns with tab names
  const navLinkRegex = /['"](?:label|name|title)['"]\s*:\s*['"]([A-Z][a-zA-Z\s]+)['"]/g;
  while ((match = navLinkRegex.exec(code)) !== null) {
    const label = match[1].trim();
    const id = label.toLowerCase().replace(/\s+/g, '-');
    if (foundIds.has(id) || label.length > 20) continue;
    if (KNOWN_PAGES.has(id.replace(/-/g, ''))) {
      foundIds.add(id);
      pages.push({ id, path: `/${id}`, label });
    }
  }

  return pages;
}

function toLabel(id: string): string {
  return id
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
