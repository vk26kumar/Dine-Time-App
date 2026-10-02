# Security Policy

This document describes how security works in DineTime, which risks are currently known, how to configure the project safely, and how to report a vulnerability. It is written so that a reader with no prior knowledge of the project, at any time in the future, can understand where the trust boundaries are and what must be protected.

For a full description of the application itself, see [README.md](README.md).

---

## Table of Contents

1. [Supported Versions](#1-supported-versions)
2. [Reporting a Vulnerability](#2-reporting-a-vulnerability)
3. [Security Model](#3-security-model)
4. [What Is Public and What Is Secret](#4-what-is-public-and-what-is-secret)
5. [Authentication and Accounts](#5-authentication-and-accounts)
6. [Authorisation and Firestore Security Rules](#6-authorisation-and-firestore-security-rules)
7. [Payments](#7-payments)
8. [Image Uploads](#8-image-uploads)
9. [Personal Data and Privacy](#9-personal-data-and-privacy)
10. [Known Risks and Recommended Fixes](#10-known-risks-and-recommended-fixes)
11. [Checklist for Maintainers and Forks](#11-checklist-for-maintainers-and-forks)

---

## 1. Supported Versions

Only the latest released version of the application receives security fixes.

| Version | Android versionCode | Supported |
|---|---|---|
| 1.0.x (latest on Google Play) | 10 and above | Yes |
| Earlier builds | Below 10 | No |

---

## 2. Reporting a Vulnerability

Please report security problems privately. **Do not open a public GitHub issue, pull request, or discussion for a vulnerability**, because that would expose users before a fix is available.

How to report:

- Email: **dinetimeteam@gmail.com** with the subject line `SECURITY: <short description>`.
- Alternatively, use GitHub's private vulnerability reporting on this repository ("Security" tab, then "Report a vulnerability"), if it is enabled.

Please include:

1. A description of the problem and its impact (what an attacker could read, change, or pay for).
2. Exact steps to reproduce, including the app version and device or platform.
3. Any proof-of-concept code, requests, or screenshots.
4. Your name or handle if you would like to be credited.

What to expect:

| Stage | Target time |
|---|---|
| Acknowledgement of your report | Within 3 working days |
| Initial assessment and severity rating | Within 7 working days |
| Fix or mitigation for critical and high severity issues | As soon as practical, normally within 30 days |
| Public disclosure | After a fix is released, coordinated with the reporter |

Please act in good faith: do not access, modify, or delete data belonging to other people, do not disrupt the service, and do not make real payments to test the payment flow. Use only your own test accounts.

---

## 3. Security Model

DineTime has **no custom backend server**. The mobile app communicates directly with managed cloud services:

| Component | Trust level | Notes |
|---|---|---|
| Mobile app (Android, iOS) | Untrusted | Anyone can install, decompile, or modify the app. Nothing inside the app bundle is secret, and any check performed only inside the app can be bypassed. |
| Firebase Authentication | Trusted | Proves who the user is (Firebase user ID, `uid`). |
| Cloud Firestore | Trusted, if rules are correct | The **only** real protection for data is the set of Firestore Security Rules configured in the Firebase console. |
| Razorpay | Trusted | Handles all card, UPI, and bank details. DineTime never sees or stores them. |
| Cloudinary | Trusted for hosting | Stores public images. |
| Firebase Hosting | Public | Serves only public static pages. |

The central principle: **because the app runs on a device the attacker controls, every rule about who may read or write which data must be enforced on the server side (Firestore Security Rules, or a future server function), not only in the app's code.**

---

## 4. What Is Public and What Is Secret

| Item | Location | Public or secret | Guidance |
|---|---|---|---|
| Firebase web configuration (`EXPO_PUBLIC_FIREBASE_*`) | `.env`, embedded in app | Public identifier | Safe to ship in the app. Restrict the API key in Google Cloud Console to the Android package `com.project.dinetime` and its signing certificate, and to the Firebase APIs actually used. |
| `google-services.json` | Repository root | Public identifier | Contains the Android Firebase API key and project ID. This is normal for Firebase apps; protection comes from Security Rules and API key restrictions, not from hiding this file. |
| Razorpay Key ID (`EXPO_PUBLIC_RAZORPAY_KEY_ID`) | `.env`, embedded in app | Public identifier | Safe to ship. |
| Razorpay Key Secret | Must never be in this repository or app | **Secret** | Only ever used on a trusted server. If it is ever committed or embedded, regenerate it immediately in the Razorpay dashboard. |
| Cloudinary cloud name and unsigned upload preset | `utils/cloudinaryUpload.ts` | Public identifier | See [section 8](#8-image-uploads). |
| Cloudinary API secret | Must never be in this repository or app | **Secret** | Not used by the app. |
| Android upload keystore (`*.jks`), Apple keys (`*.p8`, `*.p12`), `*.pem`, `*.key` | Must never be committed | **Secret** | Already excluded by `.gitignore`. Managed by EAS credentials. |
| `.env` file | Local machine only | Treat as private | Excluded by `.gitignore`. |
| `assetlinks.json` SHA-256 fingerprint | `public/assetlinks.json` | Public | It is a fingerprint of the public signing certificate, not a private key. |

If a secret is ever committed by mistake, removing it in a later commit is not enough because it stays in the Git history. The secret must be **revoked and regenerated** at the provider.

---

## 5. Authentication and Accounts

- Sign-up and sign-in use Firebase Authentication with email and password. Password hashing, rate limiting of login attempts, and token issuance are handled by Firebase.
- A verification email is sent during sign-up, and the user profile document is created after the email address is verified.
- The login session is persisted on the device with AsyncStorage so the user remains signed in after closing the app. Signing out clears the session.
- **Account deletion** requires the user to re-enter their password (re-authentication), which prevents someone with brief access to an unlocked phone from deleting the account. Deletion removes the profile and owned restaurants, anonymises related bookings (kept for financial records), and finally deletes the Firebase Authentication account. Instructions for users are published at `https://dinetime-3be27.web.app/delete-account`.
- **Administrator access** is granted only by setting `isAdmin: true` on a user document directly in the Firebase console. Security Rules must prevent users from setting this field on their own documents (see section 6).

---

## 6. Authorisation and Firestore Security Rules

The app's screens hide functions from users who should not have them (for example, only admins see the admin panel). **Hiding a screen is not security.** The Firestore Security Rules are the real gatekeeper and must be deployed in the Firebase console for project `dinetime-3be27`.

The rules are not currently stored in this repository. Maintainers are strongly encouraged to add them as `firestore.rules`, reference them from `firebase.json`, and deploy them with `firebase deploy --only firestore:rules` so they are versioned with the code.

The following baseline expresses the intended access policy of the application. It must be reviewed and tested (for example with the Firebase Emulator Suite) before deployment:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function isAdmin() {
      return signedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // Users: each person manages only their own profile and can never make themselves admin.
    match /users/{uid} {
      allow read: if signedIn() && (request.auth.uid == uid || isAdmin());
      allow create: if signedIn() && request.auth.uid == uid
                    && request.resource.data.isAdmin == false;
      allow update: if isAdmin()
                    || (signedIn() && request.auth.uid == uid
                        && request.resource.data.isAdmin == resource.data.isAdmin);
      allow delete: if signedIn() && (request.auth.uid == uid || isAdmin());
    }

    // Restaurants: public may read approved ones; owners create as "pending"; only admins moderate.
    match /restaurants/{id} {
      allow read: if resource.data.status == 'approved'
                  || (signedIn() && (resource.data.ownerId == request.auth.uid || isAdmin()));
      allow create: if signedIn() && request.resource.data.ownerId == request.auth.uid
                    && request.resource.data.status == 'pending';
      allow update: if isAdmin()
                    || (signedIn() && resource.data.ownerId == request.auth.uid
                        && request.resource.data.status == resource.data.status);
      allow delete: if isAdmin() || (signedIn() && resource.data.ownerId == request.auth.uid);
    }

    // Bookings: visible to the diner, the restaurant owner, and admins.
    match /bookings/{id} {
      function isOwnerOf(restaurantId) {
        return get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.ownerId
               == request.auth.uid;
      }
      allow read: if signedIn() && (resource.data.userId == request.auth.uid
                  || isOwnerOf(resource.data.restaurantId) || isAdmin());
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow update: if signedIn() && (resource.data.userId == request.auth.uid
                    || isOwnerOf(resource.data.restaurantId) || isAdmin());
    }

    // Favourites and notifications: private to their user.
    match /favourites/{id} {
      allow read, delete: if signedIn() && resource.data.userId == request.auth.uid;
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
    }
    match /notifications/{id} {
      allow read, update: if signedIn() && resource.data.userId == request.auth.uid;
      allow create: if signedIn();
    }
  }
}
```

Notes on this baseline:

- The account deletion flow anonymises bookings by clearing `userId`; the rules must allow that specific update by the original user.
- Owners and admins create notifications for diners, which is why `create` on `notifications` is allowed for any signed-in user. A server function would allow this to be tightened.
- The restaurant `totalBookings` counter is incremented by the diner's app after booking; the rules must allow that single-field increment, or the increment should move to a server function.

---

## 7. Payments

Current behaviour:

1. The app opens the Razorpay checkout with the amount calculated on the device (`number of guests x booking fee per person`, in paise).
2. Razorpay collects the payment. Card numbers, UPI PINs, and bank credentials are entered into Razorpay's own interface and never pass through DineTime.
3. When Razorpay reports success to the app, the app writes the booking to Firestore with `payment.status = "success"` and stores the Razorpay payment ID (and order ID and signature when provided).

Known weakness: because the booking is written by the app and there is no server-side check, a modified app could create a booking marked as paid without paying, or pay a smaller amount than the listed fee. Owners should reconcile bookings against the Razorpay dashboard using the stored `razorpayPaymentId`.

Recommended fix (planned): move order creation and verification to a trusted server, for example Firebase Cloud Functions:

1. The server creates a Razorpay order with the correct amount, computed from Firestore data, not from the app.
2. After checkout, the server verifies the `razorpay_signature` using the Razorpay Key Secret (HMAC-SHA256 of `order_id|payment_id`).
3. Only the server writes the confirmed booking. Security Rules then deny direct booking creation by clients.
4. A Razorpay webhook confirms captured payments independently of the device.

---

## 8. Image Uploads

Images are uploaded directly from the app to Cloudinary using an **unsigned upload preset**. This avoids putting a Cloudinary secret in the app, but it means anyone who reads the preset name from the app can upload images to the account.

Mitigations to configure in the Cloudinary console:

- Restrict the preset to image formats only, set a maximum file size and maximum dimensions.
- Force uploads into fixed folders (`restaurants/cover`, `restaurants/gallery`, `restaurants/menu`).
- Enable moderation if available, and monitor usage.
- For stronger protection, switch to signed uploads, where a server function issues a short-lived signature.

All uploaded images are publicly readable by URL. Users should not upload images that contain private information.

---

## 9. Personal Data and Privacy

Data collected: email address, full name, phone number, profile photo, GPS location and saved addresses (only with permission), booking details, and payment identifiers (not card or bank details). The complete privacy policy is published at `https://dinetime-3be27.web.app/privacy-policy` and its source is `public/privacy-policy.html`.

Principles followed:

- Location is requested only with the user's permission and is used to show nearby restaurants.
- Payment instruments are handled exclusively by Razorpay.
- Users can delete their account and data from inside the app.
- Bookings are retained in anonymised form after account deletion for financial record keeping.

Developers must not log personal data in production builds. The current code prints some user profile fields to the debug console during development; these logs should be removed or disabled in release builds.

---

## 10. Known Risks and Recommended Fixes

| Risk | Severity | Current state | Recommended fix |
|---|---|---|---|
| Bookings can be created without server payment verification | High | Booking is written by the app after client-side success | Server-side order creation and signature verification (section 7). |
| Data access depends on Security Rules that are not versioned in this repository | High | Rules exist only in the Firebase console | Add `firestore.rules` to the repository, review against section 6, test with the emulator, deploy. |
| Users could attempt to set `isAdmin` or change a restaurant's `status` | High if rules are missing | Prevented only by rules | Enforce the field restrictions in section 6. |
| Unsigned Cloudinary uploads can be abused | Medium | Preset name is in the app | Restrict the preset or move to signed uploads (section 8). |
| Double booking of the same table | Medium (integrity) | No availability check | Firestore transaction or server function that checks table, date, and slot. |
| Cleartext HTTP traffic permitted on Android | Low | `usesCleartextTraffic: true` in `app.config.js` | Set to `false` if no HTTP endpoint is required; all current services use HTTPS. |
| Admin "delete user" leaves the Authentication account | Low | Only the Firestore profile is removed | Use the Firebase Admin SDK in a server function to delete the Auth account too. |
| Debug logging of profile data | Low | Console logs in `AuthContext` | Remove or guard logs in production. |
| Firebase API key misuse | Low | Key is public by design | Apply API key restrictions in Google Cloud Console; enable Firebase App Check. |

---

## 11. Checklist for Maintainers and Forks

Before releasing a build or deploying a fork:

- [ ] `.env` is present locally and is not committed.
- [ ] No Razorpay Key Secret, Cloudinary API secret, keystore, or private key exists anywhere in the repository or its history.
- [ ] Firestore Security Rules are deployed and tested; users cannot set `isAdmin`, cannot approve their own restaurants, and cannot read other users' bookings, favourites, or notifications.
- [ ] Firebase API keys are restricted to the correct app package and signing certificate.
- [ ] Firebase App Check is enabled (recommended).
- [ ] The Cloudinary upload preset is restricted to images with size limits.
- [ ] Razorpay is in live mode only for production builds, and test keys are used everywhere else.
- [ ] Dependencies are up to date: run `npm audit` and review the results.
- [ ] Debug logs containing personal data are removed from the release build.
- [ ] The privacy policy and account deletion pages are deployed and accurate.

---

Contact for security matters: **dinetimeteam@gmail.com**
