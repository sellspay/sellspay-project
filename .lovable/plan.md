
# Test Download & Purchase Flows Across Product Types

## Summary
This plan covers comprehensive testing of the download, purchase, and access control flows for all product pricing types. Since only 2 free products currently exist, we need to create test products for paid, subscription, and "both" types.

## Current Status

### Existing Products
| Product | Type | Price | Filename Status |
|---------|------|-------|-----------------|
| Dandelions - Arcane AMV | Free | $0 | ✅ `original_filename` = "Arcane edit (converted).aep" |
| FUNK CRIMINAL - Rengoku Manga Edit | Free | $0 | ⚠️ `original_filename` = NULL (uses fallback extraction → "rengoku_edit.aep") |

### What's Working
1. **Free product downloads**: Working correctly with follow-gate
2. **Download rate limiting**: 2 per week per product per user - enforced
3. **Purchase tracking**: Free products create $0 purchase records on first download
4. **Filename preservation**: New uploads save `original_filename` correctly
5. **Legacy fallback**: Timestamps are stripped from paths correctly

## Required Test Products

To fully test all flows, we need to create:

1. **Paid Product** ($4.99+ minimum)
   - Tests Stripe checkout flow
   - Tests creator Stripe Connect onboarding requirement
   - Tests purchase verification and download unlock

2. **Subscription-Only Product**
   - Tests "Subscribers Only" button state
   - Tests subscription plan linkage
   - Tests subscriber download access

3. **Both (Paid + Subscription) Product**
   - Tests dual access paths
   - Tests subscription discount display
   - Tests fallback to subscription-only if price < $4.99

## Testing Steps

### Phase 1: Fix Legacy Product
Update the FUNK CRIMINAL product to have its original filename stored:

```sql
UPDATE products 
SET original_filename = 'rengoku_edit.aep' 
WHERE id = 'cfee67f3-231d-4191-a4f6-ff1d4acf2cb6';
```

### Phase 2: Create Test Products
Create test products for each pricing type via the Create Product page:

1. **Paid Product Test** ($4.99)
   - Create with `pricing_type = paid`, `price_cents = 499`
   - Attempt purchase without Stripe Connect → should fail with "Creator has not completed Stripe onboarding"
   - Complete Stripe Connect → purchase should work

2. **Subscription-Only Product Test**
   - Create with `pricing_type = subscription`
   - Link to a subscription plan
   - Non-subscriber sees "Subscribers Only" button (disabled)
   - Subscriber can download

3. **Both Product Test** ($5.99)
   - Create with `pricing_type = both`, `price_cents = 599`
   - Link to subscription plan with discount
   - Non-subscriber sees "Buy $5.99" button
   - Subscriber sees "Download (Subscriber)"

### Phase 3: Test Download Rules

For each product type, verify:

| Scenario | Free | Paid | Subscription | Both |
|----------|------|------|--------------|------|
| Logged out user | Login prompt | Login prompt | Login prompt | Login prompt |
| Not following creator | "Get Access" → Follow dialog | "Get Access" → Follow dialog | "Get Access" | "Get Access" |
| Following, not purchased/subscribed | "Free (2/2)" | "Buy $X" | "Subscribers Only" | "Buy $X" |
| Purchased | "Download (2/2)" | "Download (2/2)" | N/A | "Download (2/2)" |
| Subscribed | N/A | N/A | "Download (Subscriber)" | "Download (Subscriber)" |
| Owner | Direct download (no limit) | Direct download (no limit) | Direct download (no limit) | Direct download (no limit) |
| Rate limit exceeded | "Limit (Xd)" | "Limit (Xd)" | "Limit (Xd)" | "Limit (Xd)" |

### Phase 4: Verify Edge Cases

1. **Minimum price enforcement**: Products with `price_cents < 499` and `pricing_type = paid` should be treated as subscription-only
2. **Stripe Connect requirement**: Paid checkout fails if creator hasn't completed onboarding
3. **Filename preservation**: Downloaded files retain seller's original filename
4. **Rate limiting bypass**: Product owners can download unlimited times

## Implementation

### Step 1: Update Legacy Product Filename
Run database update to set the original filename for the legacy product.

### Step 2: Manual Testing Checklist
Since automated testing requires user sessions, manual testing is recommended:

1. **Free Product Test** (as @laym or another test user):
   - [ ] Click "Get Access" → Follow dialog appears
   - [ ] Follow creator → Button changes to "Free (2/2)"
   - [ ] Click download → File downloads with correct filename
   - [ ] Download count updates to "(1/2)"
   - [ ] Download again → Updates to "(0/2)"
   - [ ] Try again → "Limit (7d)" appears

2. **Paid Product Test** (after creating):
   - [ ] Non-follower sees "Get Access"
   - [ ] Follower sees "Buy $4.99"
   - [ ] Click buy → Stripe checkout opens in new tab
   - [ ] Complete purchase → Redirected with success toast
   - [ ] Button changes to "Download (2/2)"

3. **Subscription Product Test** (after creating plan + linking):
   - [ ] Non-subscriber sees "Subscribers Only" (disabled)
   - [ ] Subscribe to creator's plan
   - [ ] Button changes to "Download (Subscriber)"

4. **Attachments Display**:
   - [ ] Filename shows seller's original name
   - [ ] File type icon is correct
   - [ ] Lock icon shows for unauthorized users

## Technical Notes

### Pricing Type Logic
```text
pricing_type = 'free'         → subscription_access = 'none'
pricing_type = 'paid'         → subscription_access = 'none'
pricing_type = 'subscription' → subscription_access = 'subscription_only', price_cents = 0
pricing_type = 'both'         → subscription_access = 'both', price_cents > 0
```

### isSubscriptionOnly Logic
```javascript
const isSubscriptionOnly = 
  product.pricing_type === 'subscription_only' || 
  product.subscription_access === 'subscription_only' ||
  (product.subscription_access === 'both' && (!product.price_cents || product.price_cents < 499));
```

## Deliverables

1. Update FUNK CRIMINAL product's `original_filename` in database
2. Create 3 test products (paid, subscription, both)
3. Create at least 1 subscription plan for testing
4. Document test results for each scenario
