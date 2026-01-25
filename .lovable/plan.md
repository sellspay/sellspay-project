

# Threads Enhancement: Pagination, Search, and Promotions Filtering

## Overview

This plan adds three key features to the Community threads page:
1. **Pagination** - Maximum 20 threads per page with page navigation
2. **Search** - A search bar to find threads by content or author
3. **Promotions Isolation** - Promotion threads only appear when the "Promotion" tab is clicked, never in "All" feed or search results

---

## How It Will Work

### Pagination
- Threads will be limited to 20 per page
- Page navigation buttons will appear at the bottom (Previous/Next and page numbers)
- Pinned threads will always appear first on page 1
- When searching or changing categories, the page resets to 1

### Search Bar
- A clean search input will be added above the category filters
- Users can search by thread content or author name/username
- Search works across all categories except Promotions
- Real-time filtering as user types (with debounce for performance)

### Promotions Isolation
- **"All" feed**: Shows everything EXCEPT promotions
- **Search results**: Never include promotions
- **"Promotion" tab**: The ONLY place promotions appear
- This keeps the main feed clean while giving promotional content its own dedicated space

---

## Visual Layout

```text
┌─────────────────────────────────────────────┐
│           🔍 Search threads...              │
├─────────────────────────────────────────────┤
│  [All] [Help] [Showcase] [Discussion]       │
│  [Promotion] [Feedback]                     │
├─────────────────────────────────────────────┤
│                                             │
│  Thread 1 (pinned)                          │
│  Thread 2                                   │
│  ...                                        │
│  Thread 20                                  │
│                                             │
├─────────────────────────────────────────────┤
│     < Previous  [1] [2] [3]  Next >         │
└─────────────────────────────────────────────┘
```

---

## Technical Details

### 1. Update Community.tsx (Main Page)

**New State Variables:**
- `currentPage` - Track which page the user is on (starts at 1)
- `searchQuery` - Store the search input value

**Query Logic Updates:**
- Add `THREADS_PER_PAGE = 20` constant
- Modify the Supabase query:
  - When category is "all" → exclude promotions with `.neq('category', 'promotion')`
  - When searching → also exclude promotions
  - Apply pagination with `.range(start, end)` based on current page
- Add a separate count query to know total pages

**New Features:**
- Search input component with debounced input
- Pagination controls at the bottom of the thread list
- Reset page to 1 when search or category changes

### 2. Create New Search Component

**File: `src/components/community/ThreadSearch.tsx`**

A styled search input that:
- Matches the premium glassmorphism design of the page
- Uses a search icon (magnifying glass)
- Has placeholder text "Search threads..."
- Provides clear button when text is present
- Uses debounce (300ms) to avoid excessive queries

### 3. Update CategoryFilter Component

**File: `src/components/community/CategoryFilter.tsx`**

Minor updates:
- Accept `disabled` prop for search context (optional visual feedback)
- No functional changes needed - existing logic works

### 4. Add Pagination Component

**File: Uses existing `src/components/ui/pagination.tsx`**

The project already has a pagination UI component. We'll use it to show:
- Previous/Next buttons
- Current page indicator
- Total pages display
- Disabled states for first/last page

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Community.tsx` | Add search state, pagination state, update query logic, add search/pagination UI |
| `src/components/community/ThreadSearch.tsx` | **New file** - Search input component |

---

## Edge Cases Handled

- **Empty search results** - Shows friendly "No threads found" message
- **First/Last page** - Disables Previous/Next buttons appropriately
- **Category + Search combined** - Works together, both exclude promotions
- **Realtime updates** - Maintains current page position when new threads arrive
- **Mobile responsive** - Search and pagination adapt to small screens

