# Android Play Billing setup

Product IDs (must match `js/entitlements.js`):

| Product | ID | Play Console type |
| --- | --- | --- |
| Yearly Premium | `heavens_clock_yearly_premium` | Subscription (auto-renewing) |
| Lifetime Premium | `heavens_clock_lifetime_premium` | In-app product (one-time) |

## Play Console

1. Open [Google Play Console](https://play.google.com/console) → your app.
2. **Monetize → Products**:
   - Create **subscription** `heavens_clock_yearly_premium` (1 year base plan).
   - Create **in-app product** `heavens_clock_lifetime_premium` (managed product / one-time).
3. Activate both products and add them to a release track (internal testing is enough for device tests).
4. Add license testers under **Settings → License testing** (your Gmail accounts).

## Device testing

1. Build and install a **signed** build (debug via Android Studio is OK if the app is uploaded to internal testing once).
2. Sign in on the device with a **license tester** account.
3. In the app, open **Premium** → choose a plan → **Continue**.
4. Complete the Play purchase UI (test cards are not charged for license testers).

## Restore

**Restore purchases** calls Google Play and re-applies entitlements from owned products.

## Code

- Billing bridge: `js/billing.mjs` → bundled to `js/billing-bundle.js`
- UI: `js/premium-bundle.js`, `premium.html`
- Plugin: `capacitor-plugin-cdv-purchase` (Google Play Billing 8.x)

Rebuild web assets before sync:

```bash
npm run cap:sync
```

## Notes

- Products must exist in Play Console before `store.initialize()` can load prices.
- Web / browser still uses **local preview** purchases (no Play Billing).
- Server receipt validation is not wired yet (task 8); entitlements are granted client-side after Play confirms ownership.
