// ==================== USER TYPES ====================

export type RolePreference = "consumer" | "owner" | "both";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  coordinates: Coordinates;
  isActive: boolean;
}

export interface User {
  uid: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  location: string | null;
  coordinates: Coordinates | null;
  savedAddresses?: SavedAddress[];
  rolePreference: RolePreference;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  isAdmin: boolean;
  ownedRestaurants?: string[];
  bookingHistory?: string[];
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// ==================== RESTAURANT TYPES ====================

export type RestaurantStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export type TableLocation = "indoor" | "outdoor" | "private";

/**
 * Price tier derived from bookingFeePerPerson at runtime.
 * Use getPriceTier() helper — never store this in Firestore.
 * 1 = budget (₹0–199), 2 = mid (₹200–499), 3 = upscale (₹500–999), 4 = luxury (₹1000+)
 */
export type PriceTier = 1 | 2 | 3 | 4;

/** Returns a display label like "₹₹" derived from the actual fee. */
export function getPriceTier(bookingFeePerPerson: number): PriceTier {
  if (bookingFeePerPerson < 200) return 1;
  if (bookingFeePerPerson < 500) return 2;
  if (bookingFeePerPerson < 1000) return 3;
  return 4;
}

/** Returns the symbolic string for display only — never use for logic. */
export function getPriceLabel(bookingFeePerPerson: number): string {
  return "₹".repeat(getPriceTier(bookingFeePerPerson));
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OperatingHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface Table {
  tableId: string;
  capacity: number;
  tableNumber: string;
  location: TableLocation;
}

export interface RestaurantImages {
  coverImage: string;
  gallery: string[];
  menuImages?: string[];
}

export interface CancellationPolicy {
  allowCancellation: boolean;
  isRefundable: boolean;
  minimumNoticeHours: number;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerContact: string;

  // Basic Info
  name: string;
  description: string;
  cuisine: string[];

  // Location
  address: Address;
  coordinates: Coordinates;

  // Contact
  phone: string;
  email?: string;
  website?: string;

  // Hours
  operatingHours: {
    monday: OperatingHours;
    tuesday: OperatingHours;
    wednesday: OperatingHours;
    thursday: OperatingHours;
    friday: OperatingHours;
    saturday: OperatingHours;
    sunday: OperatingHours;
  };

  // Tables
  tables: Table[];
  totalCapacity: number;

  // Images
  images: RestaurantImages;

  // Amenities
  amenities: string[];
  features: string[];

  // Booking Fee — this is the single source of truth for pricing.
  // Use getPriceTier() / getPriceLabel() for display purposes only.
  bookingFeePerPerson: number;
  cancellationPolicy: CancellationPolicy;

  // Status
  status: RestaurantStatus;
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string;

  // Stats
  totalBookings: number;
  averageRating?: number;
  totalReviews?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Search
  searchKeywords: string[];
}

// ==================== BOOKING TYPES ====================

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no-show";

export type PaymentStatus = "pending" | "success" | "failed";
export type PaymentMethod =
  | "card"
  | "upi"
  | "netbanking"
  | "wallet"
  | "razorpay";
export type CancelledBy = "user" | "restaurant" | "admin";

export interface Payment {
  /** Total charged = perPersonFee × totalGuests */
  amount: number;
  perPersonFee: number;
  totalGuests: number;
  currency: string;
  paymentIntentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: PaymentStatus;
  paidAt?: Date;
  method?: PaymentMethod;
}

export interface Booking {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;

  // Booking Details
  date: Date;
  timeSlot: string;
  numberOfGuests: number;
  tableIds: string[];

  // Status
  status: BookingStatus;

  // Payment
  payment: Payment;

  // Special Requests
  specialRequests?: string;
  occasion?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  completedAt?: Date;

  cancellationReason?: string;
  cancelledBy?: CancelledBy;
  isNonRefundable: boolean;
}

// ==================== REVIEW TYPES ====================

export interface Review {
  id: string;
  restaurantId: string;
  userId: string;
  userName: string;
  bookingId: string;
  rating: number;
  review: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}
