 import React, { createContext, useContext, useMemo } from 'react';
 import type { AITheme } from './types';
 
 const defaultTheme: AITheme = {
   mode: 'dark',
   accent: '262 83% 58%', // Primary purple
   radius: 16,
   spacing: 'balanced',
   font: 'inter',
 };
 
 const AIThemeContext = createContext<AITheme>(defaultTheme);
 
 export function useAITheme() {
   return useContext(AIThemeContext);
 }
 
 interface AIThemeProviderProps {
   theme: Partial<AITheme>;
   children: React.ReactNode;
 }
 
 export function AIThemeProvider({ theme, children }: AIThemeProviderProps) {
   const mergedTheme = useMemo(() => ({
     ...defaultTheme,
     ...theme,
   }), [theme]);
 
   const cssVariables = useMemo(() => {
     const spacing = {
       compact: { section: '3rem', element: '1rem' },
       balanced: { section: '5rem', element: '1.5rem' },
       roomy: { section: '7rem', element: '2rem' },
     }[mergedTheme.spacing];
 
     const fontFamily = {
       inter: '"Inter", system-ui, sans-serif',
       geist: '"Geist", system-ui, sans-serif',
       system: 'system-ui, sans-serif',
       serif: '"Georgia", "Times New Roman", serif',
     }[mergedTheme.font];
 
     return {
       '--ai-accent': `hsl(${mergedTheme.accent})`,
       '--ai-accent-foreground': mergedTheme.mode === 'dark' ? 'hsl(0 0% 100%)' : 'hsl(0 0% 0%)',
       '--ai-background': mergedTheme.mode === 'dark' ? 'hsl(0 0% 4%)' : 'hsl(0 0% 100%)',
       '--ai-foreground': mergedTheme.mode === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(0 0% 4%)',
       '--ai-muted': mergedTheme.mode === 'dark' ? 'hsl(0 0% 15%)' : 'hsl(0 0% 96%)',
       '--ai-muted-foreground': mergedTheme.mode === 'dark' ? 'hsl(0 0% 64%)' : 'hsl(0 0% 45%)',
       '--ai-border': mergedTheme.mode === 'dark' ? 'hsl(0 0% 18%)' : 'hsl(0 0% 90%)',
       '--ai-radius': `${mergedTheme.radius}px`,
       '--ai-section-spacing': spacing.section,
       '--ai-element-spacing': spacing.element,
       '--ai-font-family': fontFamily,
     } as React.CSSProperties;
   }, [mergedTheme]);
 
   return (
     <AIThemeContext.Provider value={mergedTheme}>
       <div 
         style={cssVariables}
         className="ai-theme-root"
         data-ai-mode={mergedTheme.mode}
       >
         {children}
       </div>
     </AIThemeContext.Provider>
   );
 }