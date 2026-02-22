/**
 * Code File Parser
 * Extracts virtual file structure from single-file React code.
 * 
 * When the AI generates a monolithic App.tsx, this parser detects:
 * - Page components (Home, Products, About, Contact, etc.)
 * - Reusable components (Navbar, Hero, Footer, etc.)
 * - The main App routing shell
 * 
 * This lets the Code tab show a file tree even for single-file code.
 */

export interface VirtualFile {
  id: string;
  name: string;
  path: string;
  type: 'page' | 'component' | 'app' | 'style';
  startLine: number;
  endLine: number;
  code: string;
}

/**
 * Parse a single-file React component into virtual files
 */
export function parseVirtualFiles(code: string): VirtualFile[] {
  if (!code || code.trim().length < 50) return [];

  const lines = code.split('\n');
  const files: VirtualFile[] = [];

  // Detect function/const component declarations
  const componentPattern = /^(?:export\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)\s*(?:[:=(])/;
  const exportDefaultPattern = /^export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)/;
  
  // Known page-like names
  const PAGE_NAMES = new Set([
    'home', 'about', 'contact', 'products', 'services', 'pricing',
    'faq', 'blog', 'portfolio', 'gallery', 'members', 'shop',
    'checkout', 'cart', 'login', 'signup', 'dashboard', 'settings',
    'profile', 'terms', 'privacy', 'notfound', 'error',
  ]);

  // Known component-like names
  const COMPONENT_NAMES = new Set([
    'navbar', 'nav', 'header', 'footer', 'hero', 'sidebar',
    'card', 'button', 'modal', 'dialog', 'form', 'input',
    'productcard', 'productgrid', 'testimonials', 'features',
    'cta', 'banner', 'section',
  ]);

  interface ComponentRange {
    name: string;
    startLine: number;
    isDefault: boolean;
  }

  const componentRanges: ComponentRange[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Check for export default function App
    const defaultMatch = trimmed.match(exportDefaultPattern);
    if (defaultMatch) {
      componentRanges.push({ name: defaultMatch[1], startLine: i, isDefault: true });
      continue;
    }

    // Check for regular component declarations
    const compMatch = trimmed.match(componentPattern);
    if (compMatch) {
      componentRanges.push({ name: compMatch[1], startLine: i, isDefault: false });
    }
  }

  if (componentRanges.length === 0) {
    // Single component, no breakdown possible
    return [{
      id: 'app',
      name: 'App.tsx',
      path: '/App.tsx',
      type: 'app',
      startLine: 0,
      endLine: lines.length - 1,
      code,
    }];
  }

  // Determine end lines (each component ends where the next starts, minus blank lines)
  for (let i = 0; i < componentRanges.length; i++) {
    const start = componentRanges[i].startLine;
    const end = i + 1 < componentRanges.length
      ? componentRanges[i + 1].startLine - 1
      : lines.length - 1;

    const name = componentRanges[i].name;
    const nameLower = name.toLowerCase();

    let type: VirtualFile['type'] = 'component';
    if (componentRanges[i].isDefault || nameLower === 'app') {
      type = 'app';
    } else if (PAGE_NAMES.has(nameLower) || nameLower.endsWith('page')) {
      type = 'page';
    } else if (COMPONENT_NAMES.has(nameLower)) {
      type = 'component';
    }

    const folder = type === 'page' ? '/pages' : type === 'component' ? '/components' : '';
    const path = `${folder}/${name}.tsx`;

    files.push({
      id: nameLower,
      name: `${name}.tsx`,
      path,
      type,
      startLine: start,
      endLine: end,
      code: lines.slice(start, end + 1).join('\n'),
    });
  }

  // Add imports section as a pseudo-file if there are imports before first component
  if (componentRanges[0].startLine > 2) {
    const importCode = lines.slice(0, componentRanges[0].startLine).join('\n').trim();
    if (importCode) {
      files.unshift({
        id: 'imports',
        name: 'imports.ts',
        path: '/imports.ts',
        type: 'style',
        startLine: 0,
        endLine: componentRanges[0].startLine - 1,
        code: importCode,
      });
    }
  }

  return files;
}
