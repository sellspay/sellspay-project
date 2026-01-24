

# Community Hub Implementation Plan

This plan transforms the Community tab into a comprehensive social experience with a Threads-style feed, Discord community page, Creator Spotlight, and a premium FAQ covering every aspect of your platform.

---

## Overview

We'll build 4 major features:

1. **Threads Feed** - A Threads/Twitter-style social feed for community discussions
2. **Discord Community Page** - Dedicated page highlighting your Discord benefits
3. **Creator Spotlight Page** - Showcasing creator journeys and success stories  
4. **Premium FAQ Page** - Comprehensive help center covering the entire platform

---

## 1. Threads Feed System

A Threads-inspired discussion system where users can post, reply, like, and engage with the community.

### Database Schema

New tables required:

**threads table**
- `id` (uuid, primary key)
- `author_id` (uuid, references profiles.id)
- `content` (text)
- `gif_url` (text, nullable) - GIPHY integration
- `image_url` (text, nullable) - attached images
- `category` (text) - e.g., "help", "showcase", "discussion", "promotion", "feedback"
- `is_pinned` (boolean, default false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**thread_replies table**
- `id` (uuid, primary key)
- `thread_id` (uuid, references threads.id)
- `author_id` (uuid, references profiles.id)
- `parent_reply_id` (uuid, nullable) - for nested replies
- `content` (text)
- `gif_url` (text, nullable)
- `created_at` (timestamp)

**thread_likes table**
- `id` (uuid, primary key)
- `thread_id` (uuid, references threads.id)
- `user_id` (uuid, references profiles.id)
- `created_at` (timestamp)

**thread_reply_likes table**
- `id` (uuid, primary key)
- `reply_id` (uuid, references thread_replies.id)
- `user_id` (uuid, references profiles.id)
- `created_at` (timestamp)

### RLS Policies
- Anyone can view threads and replies
- Authenticated users can create threads/replies
- Users can edit/delete their own threads/replies
- Admins can delete any thread/reply and pin threads

### UI Components

**Community.tsx** (redesigned)
- Hero section with gradient background
- Navigation tabs: Threads, Discord, Spotlight, FAQ
- Thread composer at top (Threads-style)
- Category filter chips: All, Help & Advice, Showcase, Discussion, Promotion

**ThreadCard.tsx**
- Author avatar with verified badge support
- Username and timestamp
- Content with "Read more" for long posts
- GIF/Image display
- Like button with count
- Reply button with count
- Share button
- More menu (edit/delete for owners, report for others)

**ThreadComposer.tsx**
- Circular avatar
- Expandable textarea with placeholder "Start a thread..."
- Category selector dropdown
- GIF picker (reuse existing GIPHY integration)
- Image upload option
- Character counter
- Post button with loading state

**ThreadDetail.tsx**
- Full thread view
- Nested replies (2 levels deep max)
- Reply composer at bottom

---

## 2. Discord Community Page

A dedicated page explaining your Discord community benefits and driving signups.

### Route: `/community/discord`

### Page Structure

**Hero Section**
- Large Discord logo/branding
- Headline: "Join 10,000+ Creators"
- Subheadline about community benefits
- Primary CTA: "Join Discord" (opens https://discord.gg/xQAzE4bWgu)

**Benefits Grid**
- Priority Support - Get help directly from the team
- Early Access - Be first to know about new features
- Creator Network - Connect with fellow creators
- Weekly Events - Challenges, AMAs, and workshops
- Exclusive Content - Members-only tutorials and tips
- Feedback Channel - Shape the future of the platform

**Community Stats**
- Active members count
- Messages per week
- Countries represented
- Creators verified

**Testimonials**
- Quotes from Discord members about the community

**Bottom CTA**
- Large join button with Discord branding

---

## 3. Creator Spotlight Page

Showcasing creator success stories and journeys.

### Route: `/community/spotlight`

### Database Schema

**creator_spotlights table**
- `id` (uuid, primary key)
- `profile_id` (uuid, references profiles.id)
- `headline` (text) - "From Hobbyist to Full-Time Creator"
- `story` (text) - Their journey in detail
- `achievement` (text) - Notable achievement
- `quote` (text) - Featured quote
- `featured_at` (timestamp)
- `is_active` (boolean)
- `display_order` (integer)

### Page Structure

**Hero Section**
- "Creator Spotlight" headline
- Rotating featured creator banner
- "Nominate a Creator" CTA

**Featured Creator** (large card)
- Full-width banner
- Creator photo, name, verified badge
- Their headline/story excerpt
- Products count, followers count
- "View Full Story" button
- "Visit Profile" link

**Past Spotlights Grid**
- Card layout showing previous featured creators
- Photo, name, one-line about their achievement
- Click to expand or view profile

**Become a Creator CTA**
- For non-creators: encourage them to apply
- Link to creator application

---

## 4. Premium FAQ Page

A comprehensive help center covering every aspect of the platform.

### Route: `/faq`

### Page Structure

**Hero Section**
- "Help Center" headline with search bar
- Gradient background with subtle animation
- Quick links to popular topics

**Category Navigation**
- Horizontal scrollable tabs or sidebar
- Categories:
  1. Getting Started
  2. For Creators
  3. Selling & Store
  4. Subscriptions & Billing
  5. AI Tools & Credits
  6. For Buyers
  7. Account & Security
  8. Community
  9. Technical Support

**FAQ Sections** (premium accordion design)

Each category has 6-10 questions with detailed answers:

### Getting Started
- What is EditorsParadise?
- How do I create an account?
- Is EditorsParadise free to use?
- What can I find on the platform?
- How do I find creators to follow?
- What devices are supported?

### For Creators
- How do I become a creator?
- What are the requirements to sell?
- How do I get verified?
- What product types can I sell?
- How do I set up my creator profile?
- Can I customize my profile page?

### Selling & Store
- How do I create and list products?
- What file types are supported?
- How does pricing work?
- What is the platform fee?
- How do payouts work?
- How do I connect Stripe?

### Subscriptions & Billing
- What are subscription plans?
- How do I create subscription tiers?
- What benefits can I offer subscribers?
- How do subscribers access content?
- Can buyers cancel anytime?
- How do creator payouts work for subscriptions?

### AI Tools & Credits
- What are AI Tools?
- How do credits work?
- What's included in free tier?
- What tools require credits?
- Do credits expire?
- How do I get more credits?

### For Buyers
- How do I purchase products?
- Where do I find my downloads?
- How do refunds work?
- Can I save products for later?
- How do I follow creators?
- How do subscriptions work as a buyer?

### Account & Security
- How do I reset my password?
- How do I update my email?
- Is two-factor authentication available?
- How do I delete my account?
- How is my data protected?

### Community
- How do I join the Discord?
- What are community threads?
- How do I report inappropriate content?
- Can I collaborate with other creators?

### Technical Support
- My download isn't working
- Video preview not loading
- Payment failed, what now?
- How do I contact support?

**Contact Section**
- Still need help? Contact support
- Discord link for community help
- Email for direct support

### Visual Design
- Glass-morphism cards with subtle gradients
- Smooth accordion animations
- Search highlighting
- Category icons
- Mobile-responsive layout
- "Was this helpful?" feedback on each answer

---

## File Structure

```text
src/pages/
  Community.tsx              (redesigned hub page)
  community/
    Discord.tsx              (Discord community page)
    Spotlight.tsx            (Creator spotlight page)
  FAQ.tsx                    (Premium FAQ page)

src/components/community/
  ThreadCard.tsx             (Individual thread display)
  ThreadComposer.tsx         (Create new thread)
  ThreadDetail.tsx           (Full thread + replies view)
  ThreadReplyItem.tsx        (Reply component)
  CategoryFilter.tsx         (Category chips)
  CommunityNav.tsx           (Tab navigation)
```

---

## Routes to Add

```tsx
// In App.tsx
<Route path="/community" element={<MainLayout><Community /></MainLayout>} />
<Route path="/community/discord" element={<MainLayout><Discord /></MainLayout>} />
<Route path="/community/spotlight" element={<MainLayout><Spotlight /></MainLayout>} />
<Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />
```

---

## Technical Notes

### GIPHY Integration
Reuse the existing `search-giphy` edge function from the comments system for the thread composer.

### Real-time Updates
Enable Supabase Realtime on the threads table so new posts appear instantly.

### Infinite Scroll
Implement cursor-based pagination for the threads feed (load 20 at a time).

### Performance
- Lazy load images/GIFs
- Virtual scrolling for long thread lists
- Debounced search in FAQ

### RLS Considerations
- Public read access for all threads (build community)
- Authenticated write access only
- Admin controls for moderation

---

## Implementation Priority

1. **Phase 1**: Database schema + Discord page (quick win)
2. **Phase 2**: Premium FAQ page (high value, standalone)
3. **Phase 3**: Threads system (most complex)
4. **Phase 4**: Creator Spotlight page

