<div align="center">

# DineTime

### A Restaurant Table Booking Mobile Application

[![React Native](https://img.shields.io/badge/React_Native-0.81.4-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_|_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**[Download on Google Play](https://play.google.com/store/apps/details?id=com.project.dinetime)**

</div>

---

## Table of Contents

1. [Purpose of This Document](#1-purpose-of-this-document)
2. [What DineTime Is](#2-what-dinetime-is)
3. [The Problem It Solves](#3-the-problem-it-solves)
4. [Features](#4-features)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Navigation and Role Routing](#7-navigation-and-role-routing)
8. [Data Model (Cloud Firestore)](#8-data-model-cloud-firestore)
9. [Business Rules](#9-business-rules)
10. [End-to-End Flows](#10-end-to-end-flows)
11. [Project Structure](#11-project-structure)
12. [Screen Reference](#12-screen-reference)
13. [Getting Started](#13-getting-started)
14. [Configuration and Environment Variables](#14-configuration-and-environment-variables)
15. [Building and Deployment](#15-building-and-deployment)
16. [Required Firestore Indexes](#16-required-firestore-indexes)
17. [Known Limitations](#17-known-limitations)
18. [Future Work](#18-future-work)
19. [Glossary](#19-glossary)
20. [Security](#20-security)
21. [License](#21-license)
22. [Authors and Contributors](#22-authors-and-contributors)

---

## 1. Purpose of This Document

This README is written to be the single, complete, and self-contained description of the DineTime project. It is intended to be understandable by any reader at any point in the future, including a reader who has never seen the application running, who does not have access to the original developers, and who may be reading long after the tools mentioned here have changed or disappeared.

For that reason, this document does not only say *what* to run; it also explains *why* each part exists, *how* the parts fit together, and *what each term means*. Where an external service or tool is mentioned, its role is described in plain words so that the design can still be understood (and re-implemented with other tools) if that service no longer exists.

Companion documents:

- [SECURITY.md](SECURITY.md) - security model, known risks, and how to report a vulnerability.
- [LICENSE](LICENSE) - the legal terms under which this source code may be used.

---

## 2. What DineTime Is

DineTime is a cross-platform mobile application (Android and iOS, built from one codebase) that lets people reserve a table at a restaurant in advance by paying a small, non-refundable booking fee per guest.

The application serves three kinds of people, called **roles**:

| Role | Who they are | What they do in the app |
|---|---|---|
| Consumer | A diner | Discovers restaurants, books tables, pays the booking fee, tracks bookings, saves favourites. |
| Restaurant Owner | A person running a restaurant | Registers a restaurant, defines its tables and opening hours, manages incoming bookings, views revenue and guest analytics. |
| Administrator (Admin) | The platform operator | Approves or rejects new restaurants, suspends listings, manages user accounts, and views platform-wide revenue. |

The application is published on the Google Play Store under the Android package name `com.project.dinetime`. Supporting web pages (privacy policy and account deletion instructions) are hosted at `https://dinetime-3be27.web.app`.

---

## 3. The Problem It Solves

In many Indian cities, diners often travel to a restaurant only to be told that no table is available, especially on weekends and holidays. Restaurants, on the other hand, lose revenue when people reserve by phone and then do not arrive ("no-shows").

DineTime addresses both sides:

- **For diners**: a guaranteed table for a chosen date, time slot, and party size, confirmed instantly inside the app.
- **For restaurants**: a small prepaid, non-refundable fee per guest that discourages no-shows, plus a digital record of every booking.
- **For the platform**: an approval process so that only verified restaurants are shown to the public.

---

## 4. Features

### 4.1 Consumer Features

- Animated "Explore" home screen with rotating curated dining themes (for example Rooftop Dining, Best Buffets, Fine Dining, Family Spots, Late Night, Quick Bites).
- Restaurant search by name, cuisine, or city (keyword-based).
- Restaurant detail page with cover image, gallery, menu images, amenities, opening hours, and booking fee.
- A four-step booking wizard: **Date, then Time Slot, then Number of Guests, then Table Selection**, followed by a summary and payment.
- Location detection using the device GPS, converted into a human-readable address (reverse geocoding). Up to two recent addresses are remembered.
- Favourites (saved restaurants) with a heart toggle.
- In-app notification centre (booking confirmed, completed, cancelled, marked as no-show) with unread counts and "mark all as read".
- Booking history with status tracking and the ability to cancel an upcoming booking.
- Profile editing (name, phone number, profile photo) and self-service account deletion.

### 4.2 Restaurant Owner Features

- A five-step restaurant registration wizard: **Basic Information, Location, Operating Hours, Tables, Media (images)**.
- "My Restaurants" list showing each restaurant's status (pending, approved, rejected with reason, suspended).
- Booking management: confirm, mark as completed, mark as no-show, or cancel.
- Analytics: revenue, number of bookings, and guest counts across the owner's restaurants.
- Image upload (cover, gallery, menu) to the Cloudinary image hosting service.

### 4.3 Administrator Features

- Platform dashboard with counts of users, restaurants by status, and bookings.
- Pending approvals queue: approve a restaurant, or reject it with a mandatory written reason that the owner can see.
- Restaurant management: suspend and un-suspend approved listings.
- User management: search users and remove a user's profile data.
- Revenue analytics broken down per restaurant.

### 4.4 Payments

- Payments are processed by Razorpay, an Indian payment gateway supporting UPI, debit and credit cards, and net banking.
- The total amount is `number of guests x booking fee per person`, charged in Indian Rupees (INR).
- The booking record is created only after the payment gateway reports success.
- The non-refundable nature of the fee is shown to the consumer before payment, on the booking confirmation, and on cancellation.
- If the user simply closes the payment window (Razorpay error code `2`), it is treated as a cancellation by the user and no error is shown.

---

## 5. Technology Stack

### 5.1 Application (Client)

| Technology | Version | Role in the project |
|---|---|---|
| React Native | 0.81.4 | Framework for building native mobile apps using JavaScript/TypeScript and React components. |
| Expo SDK | 54 | A toolkit around React Native that provides ready-made native modules (location, image picker, notifications) and a cloud build service. |
| TypeScript | 5.9 | A typed superset of JavaScript; catches type errors before the app runs. |
| React | 19.1 | The UI component library used by React Native. |
| Expo Router | 6 | File-based navigation: each file under `app/` becomes a screen, and folders in parentheses group screens without affecting the URL. |
| React Native Paper | 5.14 | Material Design UI components and theming. |
| React Native Reanimated | 4.1 | High-performance animations. |
| expo-location | 19 | GPS access and reverse geocoding. |
| expo-image-picker | 17 | Selecting images from the device gallery. |
| expo-notifications | 0.32 | Registering for push notifications (works only in native builds, not in Expo Go). |
| expo-linear-gradient | 15 | Gradient backgrounds. |
| AsyncStorage | 2.2.0 | On-device key-value storage; used to keep the user logged in between app launches. |
| react-native-razorpay | 2.3.1 | Native Razorpay checkout screen. |
| zod, react-hook-form resolvers | 4.1 / 5.2 | Form schema validation. |

### 5.2 Cloud Services (Backend)

DineTime has **no custom backend server**. All server-side capability is provided by managed cloud services:

| Service | Provider | What it does for DineTime |
|---|---|---|
| Authentication | Firebase Authentication (Google) | Email and password sign-up and sign-in, email verification, session persistence, re-authentication before account deletion. |
| Database | Cloud Firestore (Google) | A NoSQL document database that stores users, restaurants, bookings, favourites, and notifications. |
| Image hosting | Cloudinary | Stores and serves restaurant and profile images over a content delivery network (CDN). Uploads use an unsigned upload preset. |
| Payments | Razorpay | Collects the booking fee from the consumer. |
| Static web hosting | Firebase Hosting (Google) | Serves the privacy policy, the account deletion page, and the Android App Links verification file. |
| Builds | Expo Application Services (EAS) | Produces signed Android App Bundles (AAB) for the Play Store in the cloud. |

---

## 6. System Architecture

DineTime follows a **serverless client-to-cloud architecture**. The mobile app talks directly to each cloud service. Access control for the database is expected to be enforced by Firestore Security Rules configured in the Firebase console (see [SECURITY.md](SECURITY.md)).

```
+-----------------------------------------------------------------+
|                DineTime Mobile App (Android / iOS)              |
|        React Native + Expo + TypeScript + Expo Router           |
|                                                                 |
|  Screens (app/)  ->  Contexts (Auth, Location)  ->  Services    |
+-----------+-------------------+-------------------+-------------+
            |                   |                   |
            v                   v                   v
   +-----------------+  +----------------+  +------------------+
   | Firebase Auth   |  | Cloudinary     |  | Razorpay         |
   | Cloud Firestore |  | (image upload  |  | (payment         |
   |                 |  |  and CDN)      |  |  gateway)        |
   +-----------------+  +----------------+  +------------------+

   +------------------------------------------------------------+
   | Firebase Hosting: /privacy-policy, /delete-account,        |
   | /.well-known/assetlinks.json                               |
   +------------------------------------------------------------+
```

### 6.1 Layers Inside the App

| Layer | Folder | Responsibility |
|---|---|---|
| Screens | `app/` | What the user sees. One file per screen, grouped by role. |
| Components | `components/` | Reusable UI pieces (booking selectors, restaurant cards, modals). |
| Contexts | `contexts/` | Global state shared across screens: the logged-in user (`AuthContext`) and the user's location (`LocationContext`). |
| Services | `services/` | Functions that read and write Firestore (restaurants, payments and bookings, favourites, notifications). |
| Hooks | `hooks/` | Reusable logic, notably `useRazorpayCheckout`, which runs the full pay-then-book sequence. |
| Configuration | `config/` | Initialises the Firebase app, authentication, Firestore, and storage. |
| Types | `types/` | TypeScript definitions for every data entity. |
| Utilities | `utils/` | Cloudinary upload helpers. |
| Constants | `constants/` | Visual theme: colours, spacing, font sizes, border radius, shadows. |

---

## 7. Navigation and Role Routing

The root layout (`app/_layout.tsx`) wraps the whole app in three providers, from outermost to innermost: `AuthProvider`, `LocationProvider`, and `PaperProvider` (theme). It then decides which section of the app to show:

```
App launch
   |
   v
Wait until Firebase Auth state AND the user's Firestore profile are loaded
   |
   +-- No signed-in user ................ go to (auth)/landing
   |
   +-- Profile has isAdmin = true ....... go to (admin)/dashboard
   |
   +-- rolePreference = "owner" ......... go to (owner)/my-restaurants
   |
   +-- anything else (consumer) ......... go to (consumer)/explore
```

While this decision is pending, a loading spinner is shown so the user never sees a screen that belongs to another role. When a user switches role in the profile screen, `rolePreference` is updated in Firestore and the root layout automatically re-routes them.

---

## 8. Data Model (Cloud Firestore)

Firestore stores data as **documents** grouped into **collections**. Each document has an ID and a set of fields. The full TypeScript definitions are in `types/index.ts`.

### 8.1 `users/{uid}`

The document ID equals the Firebase Authentication user ID.

| Field | Type | Meaning |
|---|---|---|
| `uid` | string | Firebase Auth user ID. |
| `email` | string | Login email. |
| `fullName` | string (optional) | Display name. |
| `phoneNumber` | string (optional) | Contact number; also prefilled into the payment screen. |
| `rolePreference` | `"consumer"`, `"owner"`, or `"both"` | Which section of the app the user is routed to. |
| `isAdmin` | boolean | `true` grants the admin panel. Set manually in the Firebase console only. |
| `profileImage` | string (optional) | Cloudinary URL. |
| `location` | string or null | Current human-readable address. |
| `coordinates` | `{ latitude, longitude }` or null | Current GPS position. |
| `savedAddresses` | array | Up to two recent addresses, one marked `isActive`. |
| `ownedRestaurants` | array of string | IDs of restaurants this user registered. |
| `bookingHistory` | array of string | IDs of bookings this user made. |
| `expoPushToken` | string (optional) | Device push token (native builds only). |
| `createdAt`, `updatedAt` | timestamp | Server timestamps. |

### 8.2 `restaurants/{id}`

| Field | Type | Meaning |
|---|---|---|
| `ownerId`, `ownerName`, `ownerContact` | string | The registering owner. |
| `name`, `description` | string | Public listing text. |
| `cuisine` | array of string | Cuisine tags (used for filtering). |
| `address` | `{ street, city, state, pincode, landmark? }` | Postal address. |
| `coordinates` | `{ latitude, longitude }` | Map position. |
| `phone`, `email?`, `website?` | string | Contact details. |
| `operatingHours` | object keyed `monday` .. `sunday` | Each day has `open` ("HH:MM", 24-hour), `close`, and `closed` (boolean). |
| `tables` | array | Each table has `tableId`, `tableNumber`, `capacity`, and `location` (`indoor`, `outdoor`, `private`). |
| `totalCapacity` | number | Sum of all table capacities; also the maximum party size. |
| `images` | `{ coverImage, gallery[], menuImages[]? }` | Cloudinary URLs. |
| `amenities`, `features` | array of string | Descriptive tags. |
| `bookingFeePerPerson` | number (INR) | Fee charged per guest. |
| `cancellationPolicy` | `{ allowCancellation, isRefundable, minimumNoticeHours }` | Stated policy. |
| `status` | `pending`, `approved`, `rejected`, `suspended` | Moderation state. Only `approved` restaurants are visible to consumers. |
| `rejectionReason` | string (optional) | Written by the admin on rejection. |
| `approvedAt`, `approvedBy` | timestamp, string | Approval audit. |
| `totalBookings` | number | Incremented atomically on each booking. |
| `averageRating`, `totalReviews` | number (optional) | Reserved for a future review system. |
| `searchKeywords` | array of string | Lower-case words used for search. |
| `createdAt`, `updatedAt` | timestamp | Server timestamps. |

### 8.3 `bookings/{id}`

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Copy of the document ID. |
| `restaurantId`, `restaurantName`, `restaurantAddress`, `restaurantPhone` | string | Snapshot of the restaurant at booking time. |
| `userId`, `userName`, `userPhone`, `userEmail` | string | Snapshot of the diner at booking time. |
| `date` | timestamp | Booking date. |
| `timeSlot` | string | For example `"19:30 - 21:30"`. |
| `numberOfGuests` | number | Party size. |
| `tableIds` | array of string | Tables reserved. |
| `status` | `confirmed`, `cancelled`, `completed`, `no-show` | Lifecycle state. |
| `payment` | object | `amount`, `perPersonFee`, `totalGuests`, `currency` (`INR`), `status`, `method` (`razorpay`), `paidAt`, and when available `razorpayPaymentId`, `razorpayOrderId`, `razorpaySignature`. |
| `specialRequests`, `occasion` | string | Free text from the diner. |
| `isNonRefundable` | boolean | Always `true`. |
| `cancellationReason`, `cancelledBy`, `cancelledAt` | string, `user`/`restaurant`/`admin`, timestamp | Cancellation audit. |
| `completedAt` | timestamp | Set when the owner marks the visit completed. |
| `createdAt`, `updatedAt` | timestamp | Server timestamps. |

### 8.4 `favourites/{id}`

`userId`, `restaurantId`, plus a denormalised snapshot used to render the list without extra reads: `restaurantName`, `coverImage`, `cuisine`, `city`, `bookingFeePerPerson`, `averageRating`, and `savedAt`.

### 8.5 `notifications/{id}`

`userId`, `type` (`booking_confirmed`, `booking_cancelled`, `booking_completed`, `booking_reminder`, `general`), `title`, `body`, `data` (for example the booking ID), `read` (boolean), and `createdAt`.

### 8.6 Relationships

```
users (1) ----< restaurants      via restaurants.ownerId
users (1) ----< bookings         via bookings.userId
restaurants (1) ----< bookings   via bookings.restaurantId
users (1) ----< favourites       via favourites.userId
users (1) ----< notifications    via notifications.userId
```

---

## 9. Business Rules

These rules are implemented in the application code and describe how the product behaves.

1. **Visibility**: consumers only see restaurants whose `status` is `approved`.
2. **Moderation**: every newly registered restaurant starts as `pending`. An admin must approve it. A rejection requires a written reason, which the owner sees on "My Restaurants". An approved restaurant can later be `suspended` and then restored to `approved`.
3. **Booking window**: the date selector offers the next 14 days, starting today.
4. **Time slots**: generated from that day's operating hours in 30-minute steps, from opening time until closing time. Each slot represents a two-hour sitting (for example `19:30 - 21:30`). Days marked `closed` offer no slots. Slots earlier than the current time on today's date are disabled.
5. **Party size**: from one guest up to the restaurant's `totalCapacity`.
6. **Fee**: `total = numberOfGuests x bookingFeePerPerson`, in INR. Razorpay receives the amount in paise (one rupee equals 100 paise).
7. **Refunds**: booking fees are never refunded, including when the diner cancels.
8. **Cancellation**: a diner can cancel only their own booking, and only if it is not already cancelled or completed.
9. **Owner actions on a booking**: confirm, mark completed (records `completedAt`), mark no-show, or cancel. Completing, marking no-show, and cancelling each send the diner an in-app notification.
10. **Price tier**: a display-only label derived at runtime from the fee and never stored: tier 1 below INR 200, tier 2 from INR 200 to 499, tier 3 from INR 500 to 999, tier 4 at INR 1000 and above.
11. **Saved addresses**: at most two are kept; the newest becomes active.
12. **Admin role**: can only be granted by manually setting `isAdmin: true` on the user's document in the Firebase console. There is no in-app way to become an admin.
13. **Account deletion** (self-service, requires the current password):
    - The user's profile document is deleted, together with all restaurants they own (for owners).
    - Bookings made by the user are kept for financial records but anonymised (name becomes "Deleted User"; email, phone, and user ID are cleared).
    - Bookings at the deleted owner's restaurants are kept but the restaurant details are anonymised ("Deleted Restaurant").
    - The Firebase Authentication account is deleted last, so a failure earlier leaves the user able to retry.

---

## 10. End-to-End Flows

### 10.1 Sign-up and Sign-in

1. The user opens the landing screen and chooses Sign Up or Sign In.
2. Sign-up collects full name, phone number, email, password, and a role card (Consumer or Restaurant Owner).
3. A Firebase Authentication account is created and a verification email is sent. Once the email address is verified, a matching `users/{uid}` document is written with the chosen role.
4. Sign-in uses email and password. The session is persisted on the device with AsyncStorage, so the user stays logged in after restarting the app.

### 10.2 Consumer Booking and Payment

```
Explore / Search
  -> Restaurant detail
  -> Booking wizard: Date -> Time slot -> Guests -> Tables
  -> Summary (fee and non-refundable notice)
  -> Razorpay checkout (name, email, phone prefilled)
  -> On success:
       1. Create bookings/{id} with status "confirmed" and payment details
       2. Append the booking ID to users/{uid}.bookingHistory
       3. Increment restaurants/{id}.totalBookings
       4. Create a "booking_confirmed" notification
  -> Confirmation dialog -> "View Booking"
```

This sequence is implemented in `hooks/useRazorpayCheckout.ts` and `services/paymentService.ts`.

### 10.3 Owner Restaurant Registration

```
Step 1 Basic information (name, description, cuisine, contact, fee)
  -> Step 2 Location (GPS or manual address)
  -> Step 3 Operating hours for each day of the week
  -> Step 4 Tables (number, capacity, indoor/outdoor/private)
  -> Step 5 Media (cover, gallery, menu images uploaded to Cloudinary)
  -> Submit: restaurant saved with status "pending";
             its ID is added to users/{uid}.ownedRestaurants
```

### 10.4 Admin Approval

```
Pending approvals queue
  -> Review submission
  -> Approve  (status "approved", approvedAt, approvedBy)
     or Reject (status "rejected", rejectionReason required)
  -> Owner sees the outcome on "My Restaurants"
```

---

## 11. Project Structure

```
Dine-Time-App/
|-- app/                              Screens (Expo Router, file-based routing)
|   |-- _layout.tsx                   Root providers and role-based redirect
|   |-- index.tsx                     Initial loading screen
|   |-- (auth)/                       landing, login, signup
|   |-- (consumer)/                   explore, search, restaurant/[id], booking/[id],
|   |                                 payment, bookings, favourites, notifications,
|   |                                 location-selector, profile
|   |-- (owner)/                      my-restaurants, manage-bookings, analytics, profile,
|   |   `-- register-restaurant/      step1 .. step5 registration wizard
|   `-- (admin)/                      dashboard, pending-approvals, manage-restaurants,
|                                     manage-users, revenue-analytics
|-- components/
|   |-- booking/                      DateSelector, TimeSlotSelector, GuestSelector, TableSelector
|   |-- common/                       DeleteAccountModal, LocationPermissionModal, LocationFetchingModal
|   |-- consumer/                     ExploreHeader (animated themes)
|   `-- restaurant/                   RestaurantCard, SearchBar
|-- config/firebase.ts                Firebase initialisation
|-- constants/theme.ts                Colours, spacing, typography, shadows
|-- contexts/                         AuthContext, LocationContext
|-- hooks/useRazorpayCheckout.ts      Pay-then-book sequence
|-- services/                         restaurantService, paymentService,
|                                     favouritesService, notificationService
|-- types/                            index.ts (data model), react-native-razorpay.d.ts
|-- utils/cloudinaryUpload.ts         Single and multiple image upload
|-- assets/                           App icon, adaptive icon, splash, favicon, logo
|-- public/                           Firebase Hosting site: privacy-policy.html,
|                                     delete-account.html, assetlinks.json, index.html
|-- app.config.js                     Active Expo configuration (version, package, plugins)
|-- app.json                          Legacy Expo configuration (superseded by app.config.js)
|-- eas.json                          EAS build profiles
|-- firebase.json, .firebaserc        Firebase Hosting configuration and project alias
|-- google-services.json              Android Firebase client configuration
|-- babel.config.js, tsconfig.json    Compiler configuration (path alias "@/*")
|-- App.tsx, index.ts                 Default Expo template files, not used
|                                     (the real entry point is "expo-router/entry")
|-- README.md, SECURITY.md, LICENSE   Project documentation
```

---

## 12. Screen Reference

| Route | Role | Purpose |
|---|---|---|
| `(auth)/landing` | Public | Welcome screen with entry to sign up or sign in. |
| `(auth)/signup` | Public | Account creation with role selection. |
| `(auth)/login` | Public | Email and password sign-in. |
| `(consumer)/explore` | Consumer | Home: themed discovery and restaurant list. |
| `(consumer)/search` | Consumer | Keyword and cuisine search. |
| `(consumer)/restaurant/[id]` | Consumer | Restaurant details. |
| `(consumer)/booking/[id]` | Consumer | Four-step booking wizard. |
| `(consumer)/payment` | Consumer | Booking summary and Razorpay checkout. |
| `(consumer)/bookings` | Consumer | Booking history and cancellation. |
| `(consumer)/favourites` | Consumer | Saved restaurants. |
| `(consumer)/notifications` | Consumer | Notification centre. |
| `(consumer)/location-selector` | Consumer | Choose or refresh current address. |
| `(consumer)/profile` | Consumer | Profile, role switch, sign out, delete account. |
| `(owner)/my-restaurants` | Owner | List and status of owned restaurants. |
| `(owner)/register-restaurant/step1..step5` | Owner | Registration wizard. |
| `(owner)/manage-bookings` | Owner | Confirm, complete, no-show, cancel bookings. |
| `(owner)/analytics` | Owner | Revenue, bookings, and guest statistics. |
| `(owner)/profile` | Owner | Profile, role switch, sign out, delete account. |
| `(admin)/dashboard` | Admin | Platform overview. |
| `(admin)/pending-approvals` | Admin | Approve or reject restaurants. |
| `(admin)/manage-restaurants` | Admin | Suspend or restore restaurants. |
| `(admin)/manage-users` | Admin | Search and remove users. |
| `(admin)/revenue-analytics` | Admin | Revenue per restaurant. |

---

## 13. Getting Started

### 13.1 Prerequisites

- Node.js version 18 or newer, and npm.
- EAS command-line tool for builds: `npm install -g eas-cli`.
- A Firebase project with Email/Password Authentication and Cloud Firestore enabled.
- A Cloudinary account with an unsigned upload preset.
- A Razorpay account (test mode keys are sufficient for development).
- For running on Android: Android Studio with an emulator, or a physical Android device.

### 13.2 Installation

```bash
# 1. Clone the repository
git clone https://github.com/vk26kumar/Dine-Time-App.git
cd Dine-Time-App

# 2. Install dependencies exactly as locked
npm install

# 3. Create a .env file in the project root (see section 14)

# 4. Start the Metro development server
npx expo start
```

### 13.3 Running on a Device

```bash
npx expo run:android     # Build and run a native Android development build
npx expo run:ios         # Build and run on iOS (requires macOS and Xcode)
```

Important: Razorpay checkout and push notifications use native modules that are not included in the Expo Go app. To test payments, use a native development build (`npx expo run:android`) or an EAS build, not Expo Go.

---

## 14. Configuration and Environment Variables

Create a file named `.env` in the project root. It is listed in `.gitignore` and must never be committed.

```env
# Firebase (Project settings -> General -> Your apps -> Web app config)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Razorpay (Dashboard -> Settings -> API Keys). Use only the public Key ID.
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

Notes:

- Variables prefixed with `EXPO_PUBLIC_` are embedded into the app bundle and can be read by anyone who has the app. Only public, client-safe identifiers may be placed here. Never put the Razorpay Key Secret or any server credential in this file.
- The Cloudinary cloud name and unsigned upload preset are currently set as constants in `utils/cloudinaryUpload.ts`. To use your own Cloudinary account, edit `CLOUD_NAME` and `UPLOAD_PRESET` in that file.
- `google-services.json` holds the Android Firebase client configuration. Replace it with the file downloaded from your own Firebase project if you fork the project.
- For production builds, define the same variables as EAS environment variables or secrets in the Expo dashboard instead of relying on a local `.env` file.

---

## 15. Building and Deployment

### 15.1 Android Build (Play Store)

```bash
eas login
eas build --platform android --profile production
```

Build profiles in `eas.json`:

| Profile | Purpose |
|---|---|
| `development` | Development client, internal distribution. |
| `preview` | Internal test build. |
| `production` | Store build; the Android `versionCode` is incremented automatically and the version source is remote (managed by EAS). |

Current application identity (from `app.config.js`): name `DineTime`, slug `dinetime`, URL scheme `dinetime`, version `1.0.2`, Android package `com.project.dinetime`.

### 15.2 Firebase Hosting (Supporting Web Pages)

```bash
firebase deploy --only hosting
```

Served from the `public/` folder at `https://dinetime-3be27.web.app`:

| Path | Purpose |
|---|---|
| `/privacy-policy` | Privacy policy required by Google Play. |
| `/delete-account` | Account and data deletion instructions required by Google Play. |
| `/.well-known/assetlinks.json` | Android App Links verification, proving that the app `com.project.dinetime` is allowed to open links for this domain. |

### 15.3 Play Store Listing

- Package: `com.project.dinetime`
- Store page: https://play.google.com/store/apps/details?id=com.project.dinetime
- Build tool: EAS Build

---

## 16. Required Firestore Indexes

Firestore requires composite indexes for queries that filter and sort on different fields. Create these in the Firebase console (Firestore -> Indexes) or by following the link Firestore prints in the error message the first time the query runs:

| Collection | Fields | Used by |
|---|---|---|
| `restaurants` | `status` ascending, `createdAt` descending | Restaurant listing on Explore. |
| `restaurants` | `status` ascending, `cuisine` array-contains, `createdAt` descending | Cuisine filter. |
| `restaurants` | `status` ascending, `searchKeywords` array-contains | Keyword search. |
| `notifications` | `userId` ascending, `createdAt` descending | Notification centre (falls back to client-side sorting if missing). |

---

## 17. Known Limitations

These are documented honestly so that future maintainers understand the current state of the system:

1. **No server-side payment verification**: the booking is written by the app immediately after Razorpay reports success on the device. The Razorpay signature is stored but not verified on a server. See [SECURITY.md](SECURITY.md).
2. **No table locking**: the app does not check whether a table is already booked for the same date and time slot, so two diners could reserve the same table.
3. **Non-atomic booking writes**: the booking, booking history, booking counter, and notification are written as separate operations rather than one transaction.
4. **Simple search**: search matches whole lower-case keywords only; partial and fuzzy matches are not supported.
5. **Admin user removal**: deleting a user from the admin panel removes their Firestore profile but not their Firebase Authentication account.
6. **Notifications are in-app only**: notification documents are stored in Firestore; push tokens are registered, but no server sends push messages.
7. **Reviews and ratings**: data types exist, but there is no review screen yet.
8. **iOS**: the project can be built for iOS but has not been published to the Apple App Store.

---

## 18. Future Work

- Full-text search using a dedicated search engine (for example Algolia or Typesense) for partial and fuzzy matching.
- A review and rating system available after a completed booking.
- Real-time table locking using Firestore transactions to prevent double booking.
- Server-side payment verification and Razorpay webhooks using Firebase Cloud Functions (create the Razorpay order on the server and verify the signature before confirming the booking).
- Server-sent push notifications and booking reminders.
- Personalised recommendations based on booking history.
- WhatsApp or SMS booking confirmations.
- iOS App Store distribution.

---

## 19. Glossary

| Term | Meaning |
|---|---|
| AAB | Android App Bundle, the file format uploaded to the Google Play Store. |
| AsyncStorage | Simple persistent key-value storage on the phone. |
| CDN | Content Delivery Network; servers worldwide that deliver images quickly. |
| Collection / Document | In Firestore, a document is a record of fields; a collection is a group of documents. |
| EAS | Expo Application Services, Expo's cloud build and submission service. |
| Expo Go | A ready-made app for previewing Expo projects; it cannot load custom native modules such as Razorpay. |
| Firestore Security Rules | Server-side rules in Firebase that decide who may read or write each document. |
| INR / Paise | Indian Rupee; one rupee equals 100 paise. |
| No-show | A diner who booked a table but did not arrive. |
| Reverse geocoding | Converting GPS coordinates into a street address. |
| Unsigned upload preset | A Cloudinary setting that allows uploads from the app without a secret key. |
| UPI | Unified Payments Interface, India's real-time bank payment system. |

---

## 20. Security

Please read [SECURITY.md](SECURITY.md) for the security model, the recommended Firestore Security Rules, known risks, and how to report a vulnerability privately. Do not open public issues for security problems.

---

## 21. License

This project is released under the MIT License. See [LICENSE](LICENSE) for the full text.

The names "DineTime", the application icon, and the Google Play listing are identifiers of the published application; the license covers the source code in this repository.

---

## 22. Authors and Contributors

| Name | Role | GitHub |
|---|---|---|
| Vishal Kumar | Author and maintainer | [@vk26kumar](https://github.com/vk26kumar) |
| Tarkeshvar | Contributor (authentication and Firebase persistence) | [@Tarkeshvar](https://github.com/Tarkeshvar) |

Contact: dinetimeteam@gmail.com

<div align="center">

[![Download on Google Play](https://img.shields.io/badge/Download-Google_Play-green?style=for-the-badge&logo=google-play)](https://play.google.com/store/apps/details?id=com.project.dinetime)

</div>
