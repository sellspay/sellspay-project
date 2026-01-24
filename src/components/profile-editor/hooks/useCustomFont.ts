import { useEffect } from 'react';
import type { CustomFont, FontOption } from '../types';

// Injects @font-face CSS for custom fonts dynamically
export function useCustomFont(customFont?: CustomFont) {
  useEffect(() => {
    if (!customFont?.url || !customFont?.name) return;

    const styleId = `custom-font-${customFont.name.replace(/\s+/g, '-')}`;
    
    // Check if style already exists
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: "${customFont.name}";
        src: url("${customFont.url}") format("woff2"),
             url("${customFont.url}") format("woff"),
             url("${customFont.url}") format("truetype");
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);

    // Cleanup on unmount
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [customFont?.url, customFont?.name]);
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
