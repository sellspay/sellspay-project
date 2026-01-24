import { useEffect, useLayoutEffect, useState } from 'react';
import type { CustomFont, FontOption } from '../types';

// Use layout effect for SSR safety
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Injects @font-face CSS for custom fonts dynamically
export function useCustomFont(customFont?: CustomFont) {
  const [fontLoaded, setFontLoaded] = useState(false);
  
  useIsomorphicLayoutEffect(() => {
    if (!customFont?.url || !customFont?.name) {
      setFontLoaded(false);
      return;
    }

    const styleId = `custom-font-${customFont.name.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Remove existing style to allow updates
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // Determine format from URL
    const getFormat = (url: string) => {
      if (url.includes('.woff2')) return 'woff2';
      if (url.includes('.woff')) return 'woff';
      if (url.includes('.ttf')) return 'truetype';
      if (url.includes('.otf')) return 'opentype';
      return 'truetype';
    };
    
    const format = getFormat(customFont.url);

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: "${customFont.name}";
        src: url("${customFont.url}") format("${format}");
        font-weight: 100 900;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    
    // Force font load check
    if ('fonts' in document) {
      document.fonts.load(`16px "${customFont.name}"`).then(() => {
        setFontLoaded(true);
      }).catch(() => {
        // Font might already be loaded or format unsupported
        setFontLoaded(true);
      });
    } else {
      setFontLoaded(true);
    }

    // Don't cleanup on unmount - keep fonts available
    return () => {};
  }, [customFont?.url, customFont?.name]);
  
  return fontLoaded;
}

// Get inline style for custom font
export function getCustomFontStyle(customFont?: CustomFont): React.CSSProperties | undefined {
  if (!customFont?.url || !customFont?.name) return undefined;
  return { fontFamily: `"${customFont.name}", sans-serif` };
}

// CSS class generator for fonts  
export function getFontClassName(font?: FontOption): string {
  switch (font) {
    case 'serif': return 'font-serif';
    case 'mono': return 'font-mono';
    case 'display': return 'font-display';
    case 'handwritten': return 'font-handwritten';
    case 'condensed': return 'font-condensed';
    case 'custom': return ''; // Custom fonts use inline style
    default: return '';
  }
}
