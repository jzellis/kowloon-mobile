#!/usr/bin/env node
// Distribute the latest EAS Android build to Firebase App Distribution.
//
// EAS Submit only targets the app stores (Google Play / App Store), so it can't
// push to Firebase App Distribution. This bridges the two: it finds the newest
// FINISHED Android build on EAS, downloads its APK, and hands it to the Firebase
// CLI for your tester group — testers get an email + in-app notification, and
// installs live in one place instead of a fresh URL per build.
//
// One-time setup (see scripts/DISTRIBUTE.md):
//   1. Authenticate the Firebase CLI:  npx firebase-tools login
//      (or set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON with the
//       "Firebase App Distribution Admin" role — better for CI).
//   2. In the Firebase console -> App Distribution -> Testers & Groups, create a
//      group and add tester emails. Default group alias below is "testers".
//
// Usage:
//   npm run distribute:android                 # newest finished build -> "testers"
//   GROUP=alpha npm run distribute:android     # a different tester group
//   NOTES="try the video fix" npm run distribute:android

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GROUP = process.env.GROUP || "testers";

function capture(cmd) {
  // stdout piped (for JSON), stderr inherited (npx/eas warnings stay visible).
  return execSync(cmd, { stdio: ["inherit", "pipe", "inherit"], encoding: "utf8" });
}

// 1. Firebase Android app id — read from google-services.json so it never drifts.
const gs = JSON.parse(readFileSync(new URL("../google-services.json", import.meta.url)));
const appId = gs.client[0].client_info.mobilesdk_app_id;

// 2. Newest FINISHED Android build with an APK artifact.
console.log("Looking up the latest finished Android build on EAS...");
const raw = capture(
  "npx eas-cli@latest build:list --platform android --limit 5 --non-interactive --json"
);
const builds = JSON.parse(raw.slice(raw.indexOf("[")));
const build = builds.find(
  (b) => b.status === "FINISHED" && b.artifacts?.applicationArchiveUrl
);
if (!build) {
  console.error(
    "No finished Android build found.\nRun:  eas build --profile preview --platform android"
  );
  process.exit(1);
}
const apkUrl = build.artifacts.applicationArchiveUrl;
console.log(`Build ${build.id}  (v${build.appVersion ?? "?"})`);

// 3. Download the APK.
const apkPath = join(mkdtempSync(join(tmpdir(), "kwln-apk-")), "kowloon.apk");
console.log("Downloading APK...");
const res = await fetch(apkUrl);
if (!res.ok) {
  console.error(`Download failed: HTTP ${res.status}`);
  process.exit(1);
}
writeFileSync(apkPath, Buffer.from(await res.arrayBuffer()));

// 4. Release notes: NOTES env override, else the build's git commit subject.
const notes =
  process.env.NOTES ||
  (build.gitCommitMessage || "").split("\n")[0] ||
  "Kowloon Android build";

// 5. Distribute (inherit stdio so Firebase auth prompts / progress are visible).
console.log(`Distributing to Firebase App Distribution group "${GROUP}"...`);
execSync(
  `npx firebase-tools appdistribution:distribute "${apkPath}" ` +
    `--app "${appId}" --groups "${GROUP}" ` +
    `--release-notes ${JSON.stringify(notes)}`,
  { stdio: "inherit" }
);
console.log(`\nDone. Testers in "${GROUP}" get an email + in-app notification.`);
