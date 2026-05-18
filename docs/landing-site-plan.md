# Heaven's Clock Landing Site Plan

## Goal

The landing site is the first public-facing page for Heaven's Clock.

Its role is not to explain every app feature in detail. Its role is to communicate the philosophy quickly:

- Life is finite.
- Today matters.
- Heaven's Clock helps people remember, choose, and act.
- The long-term direction is a global community of people who share goals, bucket lists, and a more intentional way of living.

The primary target is global, so the default language is English.

## Current Development Status

The first landing site draft has been implemented under:

- `site/index.html`
- `site/site.js`
- `site/locales/en.json`
- `site/locales/ko.json`

The site is currently a static landing page with:

- English-first copywriting
- Korean translation support
- Language selector
- Premium hero section with animated app mockup
- App feature section
- Android beta path section
- Community manifesto section
- Early join / coming soon section

## Language Strategy

The landing site follows the same direction as the app:

- English is the default global language.
- Korean is included as the first secondary language.
- Text is separated into JSON locale files.
- The HTML uses `data-i18n` keys.
- `site/site.js` loads the selected locale and applies translated text.

Current locale files:

- `site/locales/en.json`
- `site/locales/ko.json`

Future languages can be added by creating more files in the same structure, for example:

- `site/locales/ja.json`
- `site/locales/es.json`
- `site/locales/fr.json`

After adding a locale file, the language selector in `site/index.html` should be expanded.

## Current Site Message

Main positioning:

> Count less. Live more.

Core explanation:

> Time is not only running out. It is calling you back to the day in front of you. Heaven's Clock is a life clock, a bucket reminder, and a daily ritual for people who refuse to drift.

The tone should stay:

- Global
- Philosophical
- Premium
- Simple
- Human, not corporate

## Sections Implemented

### Header

Includes:

- Brand name
- App link
- Community link
- Join link
- Language selector

### Hero

Purpose:

- Deliver the emotional core in the first screen.
- Make the product feel bigger than a simple clock app.

Current headline:

> Count less. Live more.

### App Section

Explains three product pillars:

- Life Clock
- Today's Bucket
- Clock Skins

Also includes direction tags:

- Android first
- Global languages
- Premium lifetime option
- Community later

### Community Section

Purpose:

- Introduce the long-term vision.
- Prepare users for the idea that Heaven's Clock is not only a tool, but a future community.

Current idea:

> One person can remember for a day. A circle can remember for a lifetime.

### Join Section

Current state:

- Email input exists.
- Form validates email on the frontend.
- The preview stores submitted emails only in local browser storage.
- A real waitlist provider still needs to be connected before public release.

This is intentional for now. The first version should move fast and validate interest before adding backend/email infrastructure.

### Beta Path Section

Purpose:

- Make it clear that the app comes before the community.
- Show the user how the project moves from Android beta to public launch.
- Prevent the site from feeling like a vague community promise before the app is ready.

Current steps:

1. Stabilize the app.
2. Open beta notice.
3. Publish Android.
4. Grow the circle.

## Next Development Steps

### 1. Visual Upgrade

Improve the landing site with stronger visual identity:

- Add app screenshot or phone mockup.
- Add a premium clock skin visual.
- Add subtle animated glow or ring background.
- Keep the page fast and lightweight.

### 2. Email Collection

Connect the early access form.

Possible simple options:

- Google Form
- Tally
- ConvertKit
- Mailchimp
- Supabase backend later

Recommended first step:

Use a simple external form tool first. Do not build a full backend yet.

### 3. Deploy

Deploy the site separately from the app.

Recommended options:

- GitHub Pages
- Netlify
- Vercel

Recommended first choice:

Netlify or Vercel, because they are fast for static landing pages and easy to connect to a custom domain later.

### 4. Expand Languages

After the English/Korean version feels right, add more languages in the same JSON pattern.

Priority candidates:

- Japanese
- Spanish
- French
- German
- Portuguese
- Chinese Simplified

### 5. Add Product Proof

After the app UI stabilizes:

- Add screenshots.
- Add Android install/test instructions.
- Add "private beta" message.
- Add short founder/community note.

## What Not To Do Yet

Do not build these too early:

- Full payment page
- Full user account system
- Complex community platform
- Blog CMS
- Heavy backend

Reason:

The product still needs fast validation. The landing page should collect interest and explain the vision before monetization infrastructure is built.

## Recommended Order From Here

1. Finish Android MVP stability.
2. Use the landing site as beta support, not as the main product.
3. Connect a simple email waitlist provider.
4. Prepare Google Play listing assets.
5. Deploy the landing site.
6. Share with early testers.
7. Collect feedback.
8. Then plan payment/subscription page.

## Current Decision

The landing site should be developed before the payment page.

Reason:

Payment only makes sense after people understand the philosophy, see the app direction, and show interest. The site creates that context.
