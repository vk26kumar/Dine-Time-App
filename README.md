<div align="center">

# 🍽️ DineTime

### A Restaurant Table Booking Mobile Application

[![React Native](https://img.shields.io/badge/React_Native-0.81.4-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo_SDK-54.0.13-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Play Store](https://img.shields.io/badge/Google_Play-Published-414141?style=for-the-badge&logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=com.project.dinetime)

**[📲 Download on Google Play](https://play.google.com/store/apps/details?id=com.project.dinetime)**


</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#️-architecture)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [User Roles](#-user-roles)
- [Screens & Flows](#-screens--flows)
- [Deployment](#-deployment)
- [Future Work](#-future-work)
- [Authors](#-authors)

---

## 📌 About

DineTime solves a real problem in the Indian dining experience — **walking into a restaurant and being turned away because there's no table available**.

It is a **full-featured, cross-platform mobile application** that allows consumers to discover restaurants and book tables in advance, empowers restaurant owners to manage their listings and bookings, and gives administrators complete governance over the platform.

> Built and published to the **Google Play Store** (internal testing) with package `com.project.dinetime`.

---

## ✨ Features

### 👤 For Consumers
- Animated restaurant discovery with 10 curated dining themes
- Search by cuisine, name, or city
- 4-step booking wizard: **Date → Time → Guests → Tables**
- GPS-based restaurant discovery with reverse geocoding
- Saved favourites with heart animations
- In-app notification centre (booking confirmed, completed, cancelled)
- Booking history with status tracking

### 🏪 For Restaurant Owners
- 5-step restaurant registration wizard (Info → Location → Hours → Tables → Media)
- Real-time dashboard with revenue, bookings, and guest analytics
- Booking management: mark as Completed, No-Show, or Cancelled
- Multi-image upload via Cloudinary CDN
- Operating hours configuration per day

### 🔐 For Admins
- Platform-wide analytics dashboard
- Restaurant approval / rejection workflow (with mandatory reason)
- Suspend / unsuspend restaurant listings
- User management: search and delete accounts
- Per-restaurant revenue breakdown

### 💳 Payments
- Razorpay integration: UPI, cards, and net banking
- Booking created atomically after payment confirmation
- Non-refundable policy disclosed at 3 touchpoints
- Razorpay error code 2 (user dismissed) handled silently

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.81.4 | Cross-platform mobile UI |
| Expo SDK | 54.0.13 | Managed native API access & builds |
| TypeScript | 5.9.2 | Static type safety |
| Expo Router | 6.0.12 | File-based navigation |
| react-native-paper | 5.14.5 | Material Design components |
| expo-location | 19.0.7 | GPS & reverse geocoding |
| expo-image-picker | 17.0.8 | Device image library access |
| expo-linear-gradient | 15.0.7 | Gradient UI effects |

### Backend & Services

| Service | Provider | Usage |
|---|---|---|
| Authentication | Firebase Auth | Email/password login, session persistence |
| Database | Cloud Firestore | NoSQL real-time document database |
| Image CDN | Cloudinary | Restaurant & profile image hosting |
| Payments | Razorpay v2.3.1 | UPI, cards, net banking |
| Web Hosting | Firebase Hosting | Privacy policy, assetlinks.json |
| Geocoding | expo-location | GPS detection & reverse geocoding |

---

## 🏗️ Architecture

DineTime follows a **serverless client-cloud architecture** — no dedicated backend server. The React Native app communicates directly with Firebase, Cloudinary, and Razorpay. Firebase Security Rules enforce all data access control.

```
React Native Mobile App (Expo SDK / TypeScript / Expo Router)
          │
          ├──────────────────────────────────────────────────
          │                    │                            │
          ▼                    ▼                            ▼
    Firebase              Cloudinary                   Razorpay
 (Auth + Firestore)    (REST API - CDN)           (Payment Gateway)
          │
          ▼
  Firebase Hosting
   (Web assets)
```

### Role-Based Navigation

```
App Launch
    │
    ▼
Firebase Auth State Check
    │
    ├── Not Logged In ──────────────► (auth)/landing
    │
    ├── isAdmin = true ─────────────► Admin Panel
    │
    └── Logged In (rolePreference)
              │
              ├── owner ──────────► Owner Tabs
              └── consumer ───────► Consumer Tabs
```

---

## 🗄 Database Schema

Firestore collections:

```
Firestore Root
│
├── users/{uid}
│     ├── uid, email, fullName, phoneNumber
│     ├── rolePreference, isAdmin
│     ├── profileImage, location
│     ├── savedAddresses[]
│     ├── ownedRestaurants[]
│     └── bookingHistory[]
│
├── restaurants/{id}
│     ├── ownerId, name, description
│     ├── cuisine[], address{}, operatingHours{}
│     ├── tables[], images{}
│     ├── status, bookingFeePerPerson
│     ├── amenities[], searchKeywords[]
│     └── totalBookings (atomic counter)
│
├── bookings/{id}
│     ├── restaurantId, userId
│     ├── date, timeSlot, numberOfGuests
│     ├── tableIds[], status
│     ├── isNonRefundable
│     └── payment { razorpayId, ... }
│
├── favourites/{id}
│     ├── userId, restaurantId, savedAt
│
└── notifications/{id}
      ├── userId, type, title, body, read
```

---

## 📁 Project Structure

```
├── app/                        # Expo Router pages (file-based routing)
│   ├── (admin)/                # Admin screens
│   ├── (auth)/                 # Login, Signup, Verification
│   ├── (consumer)/             # Explore, Booking, Favourites, Profile
│   ├── (owner)/                # Dashboard, Registration, Bookings
│   ├── _layout.tsx             # Root auth guard + role router
│   └── index.tsx               # Entry redirect
│
├── components/                 # Shared UI components
├── config/                     # Firebase & Cloudinary config
├── constants/                  # App-wide constants
├── contexts/                   # AuthContext, LocationContext
├── hooks/                      # useRazorpayCheckout, custom hooks
├── services/                   # All Firestore operation functions
├── types/                      # TypeScript interfaces
├── utils/                      # Helper utilities
├── assets/                     # Images, fonts
│
├── .env                        # Environment variables (not committed)
├── app.config.js               # Expo config with env injection
├── eas.json                    # EAS Build profiles
├── firebase.json               # Firebase Hosting config
└── google-services.json        # Android Firebase config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- A Firebase project (Firestore + Auth enabled)
- A Cloudinary account (unsigned upload preset)
- A Razorpay account (test key)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vk26kumar/Dine-Time-App.git
cd Dine-Time-App

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)
cp .env.example .env

# 4. Start the development server
npx expo start
```

### Running on a Device

```bash
# Android (physical device or emulator)
npx expo run:android

# iOS (Mac only)
npx expo run:ios

# Scan QR with Expo Go app for quick testing
npx expo start
```

---

## 🔐 Environment Variables

Create a `.env` file at the root with the following keys. **Never commit this file.**

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

# Razorpay
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

> For production builds, set these as **EAS Secrets** in the Expo dashboard — never in version control.

---

## 👥 User Roles

| Role | Access | How to Get |
|---|---|---|
| **Consumer** | Browse & book restaurants | Default on signup |
| **Restaurant Owner** | Register & manage restaurants | Switch role in profile |
| **Admin** | Full platform governance | `isAdmin: true` in Firestore (manual) |

Role switching updates `rolePreference` in Firestore, and the root `_layout.tsx` automatically re-routes the user via `router.replace()`.

---

## 📱 Screens & Flows

### Consumer Booking Flow (4 Steps)
```
Date Selection → Time Slot → Guest Count → Table Selection → Summary → Razorpay Payment → Confirmation
```

### Owner Registration Flow (5 Steps)
```
Basic Info → Location (GPS) → Operating Hours → Table Setup → Media Upload → Submit for Approval
```

### Admin Approval Flow
```
Pending Queue → Review Submission → Approve / Reject (with reason) → Owner Notified
```

---

## 📦 Deployment

### Build for Android (Play Store)

```bash
# Login to EAS
eas login

# Production build (signed AAB)
eas build --platform android --profile production
```

### Firebase Hosting (Web Assets)

```bash
firebase deploy --only hosting
```

Hosted at: [https://dinetime-3be27.web.app](https://dinetime-3be27.web.app)

Hosts:
- `/privacy-policy` — required by Google Play
- `/delete-account` — required by Google Play policy
- `/.well-known/assetlinks.json` — Android App Links verification

### Play Store

- **Package:** `com.project.dinetime`
- **Track:** Internal Testing
- **Build Tool:** EAS Build (Expo Application Services)

---

## 🔮 Future Work

- [ ] **Full-text search** using Algolia or Typesense (fuzzy/partial match)
- [ ] **Review & Rating System** after completed bookings
- [ ] **iOS App Store** distribution via Apple Developer Account
- [ ] **Real-time table locking** via Firestore transactions to prevent double booking
- [ ] **Firebase Cloud Functions** for Razorpay webhook-based payment verification
- [ ] **AI-based recommendations** using booking history and preference analysis
- [ ] **WhatsApp / SMS confirmations** via Twilio or MSG91

---

## 👨‍💻 Authors

| Name | Roll No. | GitHub |
|---|---|---|
| **Vishal Kumar** | 2023011085 | [@vk26kumar](https://github.com/vk26kumar) |


## 📄 License

This project was developed as an academic submission for the B.Tech degree at MMMUT Gorakhpur. All rights reserved by the authors.

---

<div align="center">

Made with ❤️ in Gorakhpur, India

[![Download on Google Play](https://img.shields.io/badge/Download-Google_Play-green?style=for-the-badge&logo=google-play)](https://play.google.com/store/apps/details?id=com.project.dinetime)

</div>
