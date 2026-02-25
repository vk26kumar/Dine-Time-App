import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Restaurant } from "../types";

export const restaurantService = {
  // Get approved restaurants
  getRestaurants: async (
    lastDoc?: DocumentSnapshot,
    limitCount: number = 10,
  ) => {
    try {
      let q = query(
        collection(db, "restaurants"),
        where("status", "==", "approved"),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const restaurants: Restaurant[] = [];

      snapshot.forEach((doc) => {
        restaurants.push({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate(),
        } as Restaurant);
      });

      return {
        restaurants,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === limitCount,
      };
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      throw error;
    }
  },

  // Search restaurants
  searchRestaurants: async (searchQuery: string) => {
    try {
      const q = query(
        collection(db, "restaurants"),
        where("status", "==", "approved"),
        where("searchKeywords", "array-contains", searchQuery.toLowerCase()),
      );

      const snapshot = await getDocs(q);
      const restaurants: Restaurant[] = [];

      snapshot.forEach((doc) => {
        restaurants.push({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as Restaurant);
      });

      return restaurants;
    } catch (error) {
      console.error("Error searching restaurants:", error);
      throw error;
    }
  },

  // Filter restaurants by cuisine
  filterByCuisine: async (cuisine: string) => {
    try {
      const q = query(
        collection(db, "restaurants"),
        where("status", "==", "approved"),
        where("cuisine", "array-contains", cuisine),
        orderBy("createdAt", "desc"),
      );

      const snapshot = await getDocs(q);
      const restaurants: Restaurant[] = [];

      snapshot.forEach((doc) => {
        restaurants.push({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as Restaurant);
      });

      return restaurants;
    } catch (error) {
      console.error("Error filtering restaurants:", error);
      throw error;
    }
  },
};
