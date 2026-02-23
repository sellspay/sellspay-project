/**
 * Theme scope isolation.
 * Ensures storefront themes never bleed into the builder UI.
 */

export type ThemeScope = 'builder' | 'storefront';

/**
 * Determine if a theme event should be applied based on scope.
 * Builder scope = always dark, stable, internal.
 * Storefront scope = fully dynamic, project-based.
 */
export function shouldApplyTheme(
  eventScope: ThemeScope,
  currentScope: ThemeScope
): boolean {
  return eventScope === currentScope;
}

/**
 * Get the CSS selector target for a given scope.
 * Builder: applies to the host document root
 * Storefront: applies only inside the preview iframe
 */
export function getScopeTarget(scope: ThemeScope): string {
  return scope === 'storefront' ? '[data-theme-scope="storefront"]' : ':root';
}

/**
 * Tag an element with a theme scope attribute for CSS isolation.
 */
export function tagThemeScope(el: HTMLElement, scope: ThemeScope): void {
  el.setAttribute('data-theme-scope', scope);
}
