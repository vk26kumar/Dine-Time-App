import React, { createContext, useState, useEffect, useContext } from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User, RolePreference } from "../types";

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  createAuthAccount: (email: string, password: string) => Promise<void>;
  createUserDocument: (rolePreference: RolePreference) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "🔥 AuthContext: Auth state changed:",
        firebaseUser?.uid || "No user",
      );

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            console.log("✅ AuthContext: User data loaded:", {
              fullName: data.fullName,
              phoneNumber: data.phoneNumber,
              rolePreference: data.rolePreference,
              location: data.location,
            });

            setUserData({
              ...data,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            } as User);
          } else {
            setUserData(null);
          }
        } catch (error) {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 🔹 Sign In — no verification block needed
  // Verification is guaranteed during signup flow
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // 🔹 Sign Up — original kept for backward compatibility
  const signUp = async (email: string, password: string) => {
    console.log("AuthContext: signUp called");
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      console.log("AuthContext: signUp successful", result.user.uid);

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        phoneNumber: "",
        fullName: "",
        location: null,
        coordinates: null,
        savedAddresses: [],
        rolePreference: "consumer" as RolePreference,
        isAdmin: false,
        ownedRestaurants: [],
        bookingHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("AuthContext: Initial user document created");
    } catch (error) {
      console.error("AuthContext: signUp error", error);
      throw error;
    }
  };

  // 🔹 NEW — Step 1 of new signup flow
  // Creates Firebase Auth account only, no Firestore doc yet
  const createAuthAccount = async (email: string, password: string) => {
    const existing = auth.currentUser;
    // If already created with same email skip recreation
    if (existing && existing.email === email) return;
    await createUserWithEmailAndPassword(auth, email, password);
  };

  // 🔹 NEW — Step 2 of new signup flow
  // Writes Firestore doc only — Auth account already exists from createAuthAccount
  // fullName and phoneNumber left empty — user fills from profile later
  const createUserDocument = async (rolePreference: RolePreference) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user found.");

    await setDoc(doc(db, "users", currentUser.uid), {
      uid: currentUser.uid,
      email: currentUser.email,
      fullName: "",
      phoneNumber: "",
      rolePreference,
      location: null,
      coordinates: null,
      savedAddresses: [],
      isAdmin: false,
      ownedRestaurants: [],
      bookingHistory: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(
      "AuthContext: User document created with role:",
      rolePreference,
    );
  };

  const logout = async () => {
    console.log("AuthContext: logout called");
    try {
      await signOut(auth);
      console.log("AuthContext: logout successful");
    } catch (error) {
      console.error("AuthContext: logout error", error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!user) {
      console.log("AuthContext: updateUserProfile - no user logged in");
      return;
    }

    console.log("AuthContext: updateUserProfile called with data:", data);

    try {
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), updateData, { merge: true });
      console.log("AuthContext: User profile updated in Firestore");

      setUserData((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          ...data,
          updatedAt: new Date(),
        };
        console.log("AuthContext: Local user data updated:", updated);
        return updated;
      });
    } catch (error) {
      console.error("AuthContext: updateUserProfile error", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signUp,
        createAuthAccount,
        createUserDocument,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
