# In-App Purchase Plan

## First Paid Products

| Product | Store ID | Type | Suggested Price |
| --- | --- | --- | --- |
| Premium Theme Pack 01 | `heavens_clock_theme_pack_01` | One-time | USD 2.99-4.99 |
| Premium Widget Pack 01 | `heavens_clock_widget_pack_01` | One-time | USD 2.99-4.99 |
| Lifetime Premium | `heavens_clock_lifetime_premium` | One-time | USD 6.99-12.99 |

## Free Tier

- Main Memento Mori life clock
- Onboarding and life expectancy editing
- Daily quote
- Void theme
- Basic Android widget: days left, percent left, Memento Mori

## Premium Tier

- Ember, Cosmos, Chronograph themes
- Advanced widget skins matching premium themes
- Future: quote packs and bucket-list widget

## Why One-Time Purchase First

- The current app does not yet provide enough recurring content for a subscription.
- Visual ownership (themes/widgets) is easier to sell as a one-time purchase.
- Subscription can be reconsidered only after bucket-list reminders, reports, or guided programs exist.

## Implementation Order

1. Keep product IDs in `js/entitlements.js`.
2. Use local mock entitlements during design/testing.
3. Android first: connect Google Play Billing or RevenueCat.
4. iOS later: reuse the same product IDs with RevenueCat or StoreKit.
5. Gate premium themes and premium widget styles, not the core life clock.

## Store Review Notes

- Do not imply medical, psychological, or fortune-telling claims.
- Present the product as a reflective productivity/lifestyle tool.
- Keep Memento Mori language strong but not coercive or harmful.

