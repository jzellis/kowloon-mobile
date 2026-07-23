# Distributing Android builds to testers

EAS Submit only targets Google Play / the App Store, so we bridge EAS → **Firebase
App Distribution** with `npm run distribute:android`. It grabs the newest finished
EAS Android build and pushes the APK to a tester group. Testers get an email + an
in-app notification for every new build and install from one place — no per-build
links to re-send. No device/UDID limit on Android.

## One-time setup

1. **Authenticate the Firebase CLI** (either option):
   - Interactive (simplest for local use): `npx firebase-tools login`
   - Service account (better for automation): create a key in Firebase console →
     Project settings → Service accounts, give it the **Firebase App Distribution
     Admin** role, save it as `firebase-service-account.json` (gitignored), and
     `export GOOGLE_APPLICATION_CREDENTIALS=$PWD/firebase-service-account.json`.

2. **Create a tester group.** Firebase console → **App Distribution → Testers &
   Groups** → add a group (default alias this script expects: `testers`) and add
   tester emails. First time only, App Distribution asks you to enable it.

3. Testers accept the invite email, then install builds from the link or the
   **Firebase App Tester** app.

## Each release

```bash
eas build --profile preview --platform android   # build (counts against quota)
npm run distribute:android                        # push it to testers
```

Options:
- `GROUP=alpha npm run distribute:android` — target a different tester group.
- `NOTES="what to test" npm run distribute:android` — custom release notes
  (defaults to the build's git commit subject).

## Automatic distribution (one command)

`eas build --profile preview --platform android` now auto-distributes on success —
no separate `distribute:android` step. The `eas-build-on-success` hook
(`scripts/eas-distribute-onsuccess.mjs`) runs on EAS's builders after a successful
Android/preview build and pushes the APK to Firebase. The manual
`npm run distribute:android` still works as a fallback / for re-pushing an older build.

**One-time setup — store the Firebase service account as an EAS secret:**
1. Firebase console → Project settings → **Service accounts** → **Generate new
   private key**. Give that service account the **Firebase App Distribution Admin**
   role (Google Cloud console → IAM).
2. Save the JSON, then:
   ```bash
   eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT \
     --type file --value ./firebase-service-account.json
   ```
   EAS mounts it on the builder and exposes the path as `$GOOGLE_SERVICE_ACCOUNT`.

If the secret isn't set, the hook logs and **skips** (the build still succeeds) —
so builds never fail over distribution, and you can fall back to the manual script.

## Notes

- The Firebase app id is read from `google-services.json`, so it stays in sync.
