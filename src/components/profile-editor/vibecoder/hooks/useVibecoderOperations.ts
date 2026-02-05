 import { useCallback } from 'react';
import { ProfileSection, SECTION_TEMPLATES, SectionType, SectionContent, SectionStyleOptions } from '../../types';
 import { VibecoderOp, ValidationResult, SUPPORTED_SECTION_TYPES } from '../types';
 
 interface UseVibecoderOperationsProps {
   sections: ProfileSection[];
   setSections: React.Dispatch<React.SetStateAction<ProfileSection[]>>;
   pushHistory: (state: { sections: ProfileSection[] }) => void;
   onThemeUpdate?: (path: string, value: unknown) => void;
   onHeaderUpdate?: (patch: Record<string, unknown>) => void;
 }
 
 export function useVibecoderOperations({
   sections,
   setSections,
   pushHistory,
   onThemeUpdate,
   onHeaderUpdate,
 }: UseVibecoderOperationsProps) {
   
   // Validate a single operation
   const validateOperation = useCallback((op: VibecoderOp): ValidationResult => {
     const errors: string[] = [];
 
     switch (op.op) {
       case 'addSection': {
         const sectionType = op.section?.section_type;
         if (!sectionType || !SUPPORTED_SECTION_TYPES.includes(sectionType as SectionType)) {
           errors.push(`Invalid section type: ${sectionType}`);
         }
         if (sections.length >= 25) {
           errors.push('Maximum of 25 sections allowed');
         }
         break;
       }
       
       case 'removeSection': {
         if (!sections.find(s => s.id === op.sectionId)) {
           errors.push(`Section not found: ${op.sectionId}`);
         }
         break;
       }
       
       case 'moveSection': {
         if (!sections.find(s => s.id === op.sectionId)) {
           errors.push(`Section not found: ${op.sectionId}`);
         }
         if (op.after && !sections.find(s => s.id === op.after)) {
           errors.push(`Target section not found: ${op.after}`);
         }
         break;
       }
       
       case 'updateSection': {
         if (!sections.find(s => s.id === op.sectionId)) {
           errors.push(`Section not found: ${op.sectionId}`);
         }
         // Content safety checks
         const patchStr = JSON.stringify(op.patch);
         if (patchStr.includes('<script') || patchStr.includes('javascript:')) {
           errors.push('Script injection detected');
         }
         break;
       }
       
       case 'updateTheme':
         // Theme updates are generally safe
         break;
         
       case 'updateHeaderContent': {
         // Validate content lengths
         if (op.patch.displayName && op.patch.displayName.length > 40) {
           errors.push('Display name must be 40 characters or less');
         }
         if (op.patch.bio && op.patch.bio.length > 160) {
           errors.push('Bio must be 160 characters or less');
         }
         break;
       }
       
       case 'assignAssetToSlot':
         // Asset assignment is handled separately
         break;
     }
 
     return { valid: errors.length === 0, errors };
   }, [sections]);
 
   // Apply a list of operations
   const applyOperations = useCallback((ops: VibecoderOp[]) => {
     // Validate all ops first
     for (const op of ops) {
       const result = validateOperation(op);
       if (!result.valid) {
         throw new Error(`Validation failed: ${result.errors.join(', ')}`);
       }
     }
 
     setSections(prevSections => {
       let newSections = [...prevSections];
 
       for (const op of ops) {
         switch (op.op) {
           case 'addSection': {
             const template = SECTION_TEMPLATES.find(t => t.type === op.section?.section_type);
             if (!template) break;
 
             const newSection: ProfileSection = {
               id: crypto.randomUUID(),
               profile_id: prevSections[0]?.profile_id || '',
               section_type: op.section?.section_type as SectionType,
               display_order: 0,
              content: { ...template.defaultContent, ...(op.section?.content || {}) } as SectionContent,
              style_options: { ...(template.presets[0]?.styleOptions || {}), ...(op.section?.style_options || {}) } as SectionStyleOptions,
               is_visible: true,
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString(),
             };
 
             // Find insertion point
             const afterIndex = op.after 
               ? newSections.findIndex(s => s.id === op.after)
               : -1;
             
             if (afterIndex === -1) {
               newSections = [newSection, ...newSections];
             } else {
               newSections.splice(afterIndex + 1, 0, newSection);
             }
 
             // Update display orders
             newSections = newSections.map((s, i) => ({ ...s, display_order: i }));
             break;
           }
 
           case 'removeSection': {
             newSections = newSections.filter(s => s.id !== op.sectionId);
             newSections = newSections.map((s, i) => ({ ...s, display_order: i }));
             break;
           }
 
           case 'moveSection': {
             const sectionIndex = newSections.findIndex(s => s.id === op.sectionId);
             if (sectionIndex === -1) break;
 
             const [section] = newSections.splice(sectionIndex, 1);
             const afterIndex = op.after
               ? newSections.findIndex(s => s.id === op.after)
               : -1;
 
             if (afterIndex === -1) {
               newSections = [section, ...newSections];
             } else {
               newSections.splice(afterIndex + 1, 0, section);
             }
 
             newSections = newSections.map((s, i) => ({ ...s, display_order: i }));
             break;
           }
 
           case 'updateSection': {
             newSections = newSections.map(s => {
               if (s.id !== op.sectionId) return s;
              const contentPatch = (op.patch?.content || {}) as Partial<SectionContent>;
              const stylePatch = (op.patch?.style_options || {}) as Partial<SectionStyleOptions>;
               return {
                 ...s,
                content: { ...s.content, ...contentPatch } as SectionContent,
                style_options: { ...s.style_options, ...stylePatch } as SectionStyleOptions,
                is_visible: typeof op.patch.is_visible === 'boolean' ? op.patch.is_visible : s.is_visible,
                 updated_at: new Date().toISOString(),
               };
             });
             break;
           }
 
            case 'updateTheme': {
              // Call the theme update handler if provided
              if (onThemeUpdate) {
                onThemeUpdate(op.path, op.value);
              }
              break;
            }

            case 'updateHeaderContent': {
              // Call the header update handler if provided
              if (onHeaderUpdate) {
                onHeaderUpdate(op.patch);
              }
             break;
            }

            default:
              // assignAssetToSlot is handled separately
              break;
         }
       }
 
       return newSections;
     });
 
      // Push to history after applying - use a callback to get fresh sections
      setSections(currentSections => {
        pushHistory({ sections: currentSections });
        return currentSections;
      });
    }, [setSections, pushHistory, validateOperation, onThemeUpdate, onHeaderUpdate]);
 
   // Preview operations without applying
   const previewOperations = useCallback((ops: VibecoderOp[]): ProfileSection[] => {
     let previewSections = [...sections];
 
     for (const op of ops) {
       switch (op.op) {
         case 'addSection': {
           const template = SECTION_TEMPLATES.find(t => t.type === op.section?.section_type);
           if (!template) continue;
 
           const newSection: ProfileSection = {
             id: `preview-${crypto.randomUUID()}`,
             profile_id: sections[0]?.profile_id || '',
             section_type: op.section?.section_type as SectionType,
             display_order: 0,
            content: { ...template.defaultContent, ...(op.section?.content || {}) } as SectionContent,
            style_options: { ...(template.presets[0]?.styleOptions || {}), ...(op.section?.style_options || {}) } as SectionStyleOptions,
             is_visible: true,
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
           };
 
           const afterIndex = op.after
             ? previewSections.findIndex(s => s.id === op.after)
             : -1;
 
           if (afterIndex === -1) {
             previewSections = [newSection, ...previewSections];
           } else {
             previewSections.splice(afterIndex + 1, 0, newSection);
           }
           break;
         }
 
         case 'removeSection':
           previewSections = previewSections.filter(s => s.id !== op.sectionId);
           break;
 
         case 'updateSection':
           previewSections = previewSections.map(s => {
             if (s.id !== op.sectionId) return s;
            const contentPatch = (op.patch?.content || {}) as Partial<SectionContent>;
            const stylePatch = (op.patch?.style_options || {}) as Partial<SectionStyleOptions>;
             return {
               ...s,
              content: { ...s.content, ...contentPatch } as SectionContent,
              style_options: { ...s.style_options, ...stylePatch } as SectionStyleOptions,
             };
           });
           break;
 
         default:
           break;
       }
     }
 
     return previewSections;
   }, [sections]);
 
   // Get inverse operations for undo
  const getInverseOps = useCallback((ops: VibecoderOp[]) => {
     return ops.map(op => {
       switch (op.op) {
         case 'addSection':
          return { op: 'removeSection' as const, sectionId: op.section?.id || '' };
         
         case 'removeSection': {
           const section = sections.find(s => s.id === op.sectionId);
           if (!section) return op;
           const prevIndex = sections.findIndex(s => s.id === op.sectionId);
           const after = prevIndex > 0 ? sections[prevIndex - 1].id : null;
          return { op: 'addSection' as const, after, section };
         }
         
         case 'updateSection': {
           const section = sections.find(s => s.id === op.sectionId);
           if (!section) return op;
           return {
            op: 'updateSection' as const,
             sectionId: op.sectionId,
             patch: { content: section.content, style_options: section.style_options },
           };
         }
         
         default:
           return op;
       }
    }).reverse() as VibecoderOp[];
   }, [sections]);
 
   return {
     validateOperation,
     applyOperations,
     previewOperations,
     getInverseOps,
   };
 }