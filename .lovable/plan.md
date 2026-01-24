
Goal
- Add text shadow options to Headline sections.
- Add letter-spacing and line-height controls to both Text + Headline sections.
- Fix “Recent Uploads” (and other visibility) state so reopening the editor always reflects what was previously saved.

What’s causing the “Recent Uploads becomes visible again” bug
- In src/pages/Profile.tsx, the ProfileEditorDialog is currently passed a “profile” prop that does not include show_recent_uploads.
- Inside src/components/profile-editor/ProfileEditorDialog.tsx, fetchAllData() resets showRecentUploads using profile.show_recent_uploads !== false (from the prop), so it defaults back to visible even if the database has it hidden.
- Even though we refetch sections/collections on open, we are not refetching the show_recent_uploads flag from the backend when the editor opens.

Fix: Make editor always read show_recent_uploads from the backend (and pass the correct value from the parent as a fallback)
1) Update src/pages/Profile.tsx
- When passing profile into <ProfileEditorDialog />, include show_recent_uploads: showRecentUploads (or profile.show_recent_uploads) so the editor never starts with a missing flag.
- This ensures the editor’s initial state matches what the profile page is actually showing.

2) Update src/components/profile-editor/ProfileEditorDialog.tsx
- In fetchAllData(), add a dedicated backend read:
  - profiles: select show_recent_uploads by profileId
- Use that returned value as the source of truth to:
  - setShowRecentUploads(...)
  - resetHistory({ ..., showRecentUploads: fetchedValue })
- Also consider making fetchAllData resilient:
  - If the fetch fails, fallback to the prop value (or default true), but do not blindly overwrite with missing/undefined.

Why this will fix it permanently
- “Recent Uploads visibility” lives on the profile record, not in sections/collections.
- We’ll now fetch it every time the editor opens (same way we fetch sections/collections), so the editor UI will always reflect the saved state.
- This also removes any dependency on stale props for this flag.

Add typography controls (Text + Headline): letter-spacing and line-height
Data model (no database migration needed)
- These values are stored inside the existing JSONB content field for profile sections, so we only need to extend TypeScript types and rendering.

3) Update src/components/profile-editor/types.ts
- Extend TextContent with:
  - letterSpacing?: 'tighter' | 'tight' | 'normal' | 'wide' | 'wider'
  - lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose'
- Extend HeadlineContent with:
  - letterSpacing?: same union
  - lineHeight?: same union
- Keep defaults implicit:
  - letterSpacing defaults to 'normal'
  - lineHeight defaults to 'normal'

4) Update editor UI controls in src/components/profile-editor/EditSectionDialog.tsx
- In TextEditor:
  - Add “Letter Spacing” Select
  - Add “Line Height” Select
- In HeadlineEditor:
  - Add “Letter Spacing” Select
  - Add “Line Height” Select
- Use user-friendly labels:
  - Letter spacing: Tighter, Tight, Normal, Wide, Wider
  - Line height: Tight, Normal, Relaxed, Loose
- Store the chosen option in content (not style_options) so it travels with typography settings.

Add Headline text shadow options
5) Update src/components/profile-editor/types.ts
- Extend HeadlineContent with:
  - textShadow?: 'none' | 'soft' | 'medium' | 'strong' | 'glow'

6) Update src/components/profile-editor/EditSectionDialog.tsx (HeadlineEditor)
- Add a “Text Shadow” Select with options:
  - None
  - Soft
  - Medium
  - Strong
  - Glow
- Save into content.textShadow.

Apply these styles everywhere they render (editor preview + public profile)
Important: you have two “rendering” paths:
- EditablePreview.tsx (the live canvas inside the editor; supports inline editing)
- SectionPreviewContent.tsx (used in the editor list previews AND in the public profile renderer via PublicProfileSections)

7) Update src/components/profile-editor/previews/SectionPreviewContent.tsx
- TextPreview:
  - Apply letterSpacing + lineHeight via inline style on the wrapper (so it affects title + body).
  - Remove the hardcoded body color fallback that can override user-selected color; ensure “unset” falls back naturally.
- HeadlinePreview:
  - Apply letterSpacing + lineHeight + textShadow in inline style.

Implementation detail: mapping to CSS values
- letterSpacing map:
  - tighter: -0.04em
  - tight: -0.02em
  - normal: 0em
  - wide: 0.02em
  - wider: 0.05em
- lineHeight map:
  - tight: 1.1
  - normal: 1.35
  - relaxed: 1.6
  - loose: 1.9
- textShadow map:
  - none: undefined
  - soft: 0 1px 2px rgba(0,0,0,0.25)
  - medium: 0 4px 10px rgba(0,0,0,0.25)
  - strong: 0 10px 25px rgba(0,0,0,0.35)
  - glow: 0 0 14px rgba(255,255,255,0.35)
(We’ll keep these as inline styles so they work regardless of Tailwind class limitations.)

8) Update src/components/profile-editor/previews/EditablePreview.tsx
- TextEditablePreview:
  - Apply letterSpacing + lineHeight inline style on the wrapper (same mapping).
- HeadlineEditablePreview:
  - Apply letterSpacing + lineHeight + textShadow inline style on the wrapper.
- Ensure InlineEdit inputs inherit these styles (they will if wrapper styles are used).

Optional consistency update (only if needed)
9) Update src/components/profile-editor/SectionEditorPanel.tsx
- If this panel is still reachable anywhere in the UI:
  - Add the same controls for letterSpacing / lineHeight (Text + Headline)
  - Add textShadow for Headline
This prevents “two editors with different capabilities” if both UIs are still in use.

Testing checklist (what I’ll verify in preview after implementing)
Recent uploads persistence
- Set Recent Uploads hidden → Save → close editor → reopen editor
  - Expected: Recent Uploads card remains hidden without needing to toggle again.
- Repeat for:
  - A hidden section
  - A hidden collection
  - Expected: all remain hidden and reflect saved state on reopen.

Typography
- Text: change font + color + letter spacing + line height
  - Expected: applies in editor canvas, section list preview, and public profile rendering.
- Headline: change font + color + letter spacing + line height + text shadow
  - Expected: applies consistently everywhere.

No backend migrations needed
- These changes use existing JSONB content fields in profile_sections and the existing show_recent_uploads boolean on profiles. We only need frontend code adjustments and one additional backend read when opening the editor.