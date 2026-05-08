import { authService } from "./apiService";

const USER_KEY = "dali-user";

export function getCachedUserId() {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    const id = u?.id ?? u?.user_id;
    return id != null ? id : null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId() {
  const cached = getCachedUserId();
  if (cached != null) return cached;
  const res = await authService.me();
  const u = res.data?.data || res.data;
  const id = u?.id ?? u?.user_id;
  if (id == null) throw new Error("Not authenticated");
  return id;
}

const wishlistKey = (userId) =>
  userId != null ? `dali-wishlist-${userId}` : "dali-wishlist-guest";

export function readWishlistIdsForUser(userId) {
  try {
    const ids = JSON.parse(localStorage.getItem(wishlistKey(userId)) || "[]");
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
}

export function writeWishlistIdsForUser(userId, ids) {
  localStorage.setItem(
    wishlistKey(userId),
    JSON.stringify((ids || []).map(String))
  );
}
