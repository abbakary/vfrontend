import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const TOKEN_KEY = "dali-token";
const USER_KEY = "dali-user";

const AuthContext = createContext(null);

function readStorage() {
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!token || !raw) return null;
  try {
    return { token, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(() => readStorage());

  const refresh = useCallback(() => {
    setAuthUser(readStorage());
  }, []);

  useEffect(() => {
    window.addEventListener("auth:updated", refresh);
    return () => window.removeEventListener("auth:updated", refresh);
  }, [refresh]);

  const isLoggedIn = Boolean(authUser?.token);

  /** Normalised user id — handles id / _id / userId field variants */
  const userId = authUser?.id ?? authUser?._id ?? authUser?.userId ?? null;

  /** Normalised display name */
  const displayName =
    authUser?.full_name ||
    authUser?.name ||
    authUser?.username ||
    authUser?.email ||
    "User";

  const value = {
    authUser,
    isLoggedIn,
    userId,
    displayName,
    token: authUser?.token ?? null,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
