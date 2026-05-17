# iOS and WidgetKit Roadmap

## Build Requirement

iOS native builds require macOS and Xcode. This Windows workspace can prepare the web core, Capacitor config, shared data model, product IDs, and Android implementation, but it cannot compile or sign the iOS app locally.

## Options

1. Use a Mac with Xcode.
2. Use a cloud build service for Capacitor iOS builds.
3. Continue Android-first until the product direction is validated.

## iOS App Scope

- Package the current web core with Capacitor.
- Reuse `memento-mori-settings` for app-side settings.
- Mirror widget data into an App Group container for WidgetKit.
- Keep the in-app clock as the only second-by-second experience.

## iOS Widget Scope

### Supported MVP

- Small widget: days left + Memento Mori.
- Medium widget: days left + percent left + daily quote.
- Theme-matched background styles.

### Avoid in MVP

- Per-second widget refresh.
- Heavy animation in widgets.
- Custom Apple Watch face claims.

## Data Contract

Use the same snapshot shape created in `js/widget-data.js`:

```json
{
  "version": 1,
  "updatedAt": "2026-05-18T00:00:00.000Z",
  "locale": "en",
  "theme": "void",
  "quote": "This day will not come again. Make it count.",
  "timeZone": "Asia/Seoul",
  "birthAt": "1990-01-01T00:00:00.000Z",
  "targetAt": "2070-01-01T00:00:00.000Z",
  "lifespanYears": 80,
  "daysLeft": 15900,
  "hoursLeftToday": 12,
  "percentLeft": 54.12
}
```

## Revenue Notes

- Reuse product IDs from `js/entitlements.js`.
- If RevenueCat is adopted, map store products to:
  - `premiumThemes`
  - `premiumWidgets`
  - `lifetimePremium`

