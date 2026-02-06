/**
 * Route Parser Utility
 * Parses generated TSX code to extract route definitions for the Page Navigator
 */

export interface SitePage {
  id: string;
  path: string;
  label: string;
}

/**
 * Parse routes from generated React code
 * Extracts Route path definitions from TSX/JSX code
 */
export function parseRoutesFromCode(code: string): SitePage[] {
  const pages: SitePage[] = [{ id: 'home', path: '/', label: 'Home' }];
  
  if (!code) return pages;
  
  // Regex to find Route path definitions: <Route path="/something" ... />
  const routeRegex = /<Route[^>]*path=["']([^"']+)["'][^>]*>/g;
  let match;
  
  const foundPaths = new Set<string>(['/']);
  
  while ((match = routeRegex.exec(code)) !== null) {
    const path = match[1];
    
    // Skip if:
    // - Already found this path
    // - Is root path
    // - Is a dynamic route (contains :)
    // - Is a wildcard or catch-all route
    if (!path || path === '/' || foundPaths.has(path) || path.includes(':') || path.includes('*')) {
      continue;
    }
    
    foundPaths.add(path);
    
    // Convert "/about-us" -> "About Us"
    const label = path
      .replace(/^\//, '') // Remove leading slash
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    pages.push({
      id: path,
      path: path,
      label: label || 'Page',
    });
  }
  
  return pages;
}
