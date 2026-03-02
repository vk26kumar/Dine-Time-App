// services/favouritesService.ts
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";
import { Restaurant } from "../types";

export interface FavouriteItem {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  coverImage: string;
  cuisine: string[];
  city: string;
  bookingFeePerPerson: number;
  averageRating?: number;
  savedAt: Date;
}

export const favouritesService = {
  // ── Add ──────────────────────────────────────────────────────────────────
  add: async (restaurant: Restaurant): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in");

    const existing = await getDocs(
      query(
        collection(db, "favourites"),
        where("userId", "==", user.uid),
        where("restaurantId", "==", restaurant.id),
      ),
    );
    if (!existing.empty) return existing.docs[0].id;

    const ref = await addDoc(collection(db, "favourites"), {
      userId: user.uid,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      coverImage: restaurant.images?.coverImage ?? "",
      cuisine: restaurant.cuisine ?? [],
      city: restaurant.address?.city ?? "",
      bookingFeePerPerson: restaurant.bookingFeePerPerson ?? 0,
      averageRating: restaurant.averageRating ?? 0,
      savedAt: serverTimestamp(),
    });
    return ref.id;
  },

  // ── Remove ───────────────────────────────────────────────────────────────
  remove: async (restaurantId: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in");

    const snap = await getDocs(
      query(
        collection(db, "favourites"),
        where("userId", "==", user.uid),
        where("restaurantId", "==", restaurantId),
      ),
    );
    await Promise.all(
      snap.docs.map((d) => deleteDoc(doc(db, "favourites", d.id))),
    );
  },

  // ── Toggle — single Firestore read, no double queries ────────────────────
  toggle: async (restaurant: Restaurant): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in");

    const snap = await getDocs(
      query(
        collection(db, "favourites"),
        where("userId", "==", user.uid),
        where("restaurantId", "==", restaurant.id),
      ),
    );

    if (!snap.empty) {
      // Already saved → remove
      await Promise.all(
        snap.docs.map((d) => deleteDoc(doc(db, "favourites", d.id))),
      );
      return false;
    } else {
      // Not saved → add
      await addDoc(collection(db, "favourites"), {
        userId: user.uid,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        coverImage: restaurant.images?.coverImage ?? "",
        cuisine: restaurant.cuisine ?? [],
        city: restaurant.address?.city ?? "",
        bookingFeePerPerson: restaurant.bookingFeePerPerson ?? 0,
        averageRating: restaurant.averageRating ?? 0,
        savedAt: serverTimestamp(),
      });
      return true;
    }
  },

  // ── isSaved ───────────────────────────────────────────────────────────────
  isSaved: async (restaurantId: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    const snap = await getDocs(
      query(
        collection(db, "favourites"),
        where("userId", "==", user.uid),
        where("restaurantId", "==", restaurantId),
      ),
    );
    return !snap.empty;
  },

  // ── Get all ───────────────────────────────────────────────────────────────
  getAll: async (): Promise<FavouriteItem[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    const snap = await getDocs(
      query(collection(db, "favourites"), where("userId", "==", user.uid)),
    );
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        savedAt: data.savedAt?.toDate?.() ?? new Date(),
      } as FavouriteItem;
    });
  },
};

export default favouritesService;
