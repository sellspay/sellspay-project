
# Fix Plan: Admin Dashboard Functions & Stripe Connect

## Problem Summary
1. **Stripe Connect fails** because the API key lacks required permissions
2. **Admin panel buttons** (Users, Products, Featured management) have no click handlers
3. **Featured products management** UI needs to be built

---

## Phase 1: Fix Stripe Connect API Key Permissions

### What's Wrong
Your Stripe restricted API key doesn't have permissions for Connect operations. The logs show it needs:
- `rak_accounts_kyc_basic_read`
- `rak_connected_account_write`

### How to Fix
You need to update your Stripe API key in the Stripe Dashboard:

1. Go to Stripe Dashboard → Developers → API Keys
2. Find or create a new restricted key with these permissions:
   - **Connect** → Write (`connected_account_write`)
   - **Connect** → Read (`accounts_kyc_basic_read`) 
   - Plus your existing permissions (Checkout Sessions, Customers, Products, Prices, Payment Intents, Webhook Endpoints, Transfers)
3. Update the `STRIPE_SECRET_KEY` secret in your project with the new key

Alternatively, you can use your **full secret key** (`sk_live_...`) instead of a restricted key, which has all permissions.

---

## Phase 2: Implement Admin Users Tab Actions

### Changes to Admin.tsx

Add functional handlers for user management:

```text
┌─────────────────────────────────────────┐
│ View Profile → Navigate to /@username   │
│ Edit User   → Open edit modal           │
│ Suspend User → Toggle suspended status  │
└─────────────────────────────────────────┘
```

**Implementation:**
- Create `handleViewProfile(profile)` - navigates to `/@username`
- Create `handleEditUser(profile)` - opens a dialog to edit user details
- Create `handleSuspendUser(profile)` - updates profile with suspended status (requires adding `suspended` column)
- Add `onClick` handlers to all dropdown menu items

---

## Phase 3: Implement Admin Products Tab Actions

### Changes to Admin.tsx

Add functional handlers for product management:

```text
┌──────────────────────────────────────────────┐
│ View Product   → Navigate to /products/:id   │
│ Edit Product   → Navigate to /edit-product   │
│ Feature Product → Toggle featured status     │
│ Remove Product → Delete with confirmation    │
└──────────────────────────────────────────────┘
```

**Implementation:**
- `handleViewProduct(product)` - navigates to `/products/:id`
- `handleEditProduct(product)` - navigates to `/edit-product/:id`
- `handleToggleFeatured(product)` - toggles `featured` boolean in database
- `handleRemoveProduct(product)` - shows confirmation dialog, then deletes

---

## Phase 4: Build Featured Products Management

### Create a "Manage Featured" Dialog

A modal that shows:
1. Currently featured products (with ability to remove)
2. Search/browse all products to add to featured
3. Drag-to-reorder featured products (optional)

```text
┌────────────────────────────────────────────────────┐
│ Manage Featured Products                      [X]  │
├────────────────────────────────────────────────────┤
│ Currently Featured:                                │
│ ┌──────────────────────────────────────────────┐  │
│ │ 🌟 Product Name 1           [Remove]         │  │
│ │ 🌟 Product Name 2           [Remove]         │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ Add Products:                                      │
│ [🔍 Search products...]                           │
│ ┌──────────────────────────────────────────────┐  │
│ │ Product A                   [Add to Featured]│  │
│ │ Product B                   [Add to Featured]│  │
│ └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## Phase 5: Database Migration (Optional)

If you want user suspension functionality, add a `suspended` column:

```sql
ALTER TABLE public.profiles 
ADD COLUMN suspended boolean DEFAULT false;
```

---

## Technical Implementation Details

### Files to Create
1. `src/components/admin/EditUserDialog.tsx` - Modal for editing user profiles
2. `src/components/admin/ManageFeaturedDialog.tsx` - Modal for managing featured products

### Files to Modify
1. `src/pages/Admin.tsx` - Add all click handlers and integrate dialogs

### New State Variables in Admin.tsx
- `editingUser: Profile | null`
- `showFeaturedDialog: boolean`
- `deletingProduct: Product | null`

### New Functions in Admin.tsx
- `handleViewProfile(profile: Profile)`
- `handleEditUser(profile: Profile)` 
- `handleSuspendUser(profileId: string, suspended: boolean)`
- `handleViewProduct(product: Product)`
- `handleEditProduct(product: Product)`
- `handleToggleFeatured(productId: string, featured: boolean)`
- `handleRemoveProduct(productId: string)`

---

## Summary of Deliverables

| Item | Action |
|------|--------|
| Stripe Connect | Update API key permissions in Stripe Dashboard |
| Users - View Profile | Navigate to profile page |
| Users - Edit User | Edit dialog for user details |
| Users - Suspend User | Toggle suspension status |
| Products - View | Navigate to product detail |
| Products - Edit | Navigate to edit page |
| Products - Feature | Toggle featured status |
| Products - Remove | Delete with confirmation |
| Manage Featured | Full featured products management dialog |

