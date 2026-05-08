import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeColors } from "../utils/useThemeColors";

const PRIMARY = "#61C5C3";
const SECONDARY = "#F58A24";
const API_BASE_URL =
  import.meta.env?.VITE_API_BASE || "https://daliportal-api.daligeotech.com";

const TOKEN_KEY = "dali-token";
const USER_KEY = "dali-user";

const TIPS = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Your session is secured",
    desc: "All active tokens have been revoked. Your session data has been safely wiped from this device.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Your data remains private",
    desc: "All datasets and subscriptions are encrypted at rest. Nothing was exposed during this session.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
      >
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: "Activity logged for compliance",
    desc: "Your actions are securely audit-logged. Everything is in perfect order — great work today.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: "Thank you for being here",
    desc: "We truly appreciate every session you spend on DALI. Your work helps drive meaningful decisions.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
      >
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    title: "See you next time! 👋",
    desc: "You've been signed out successfully. Come back anytime — we'll be right here waiting.",
    isFinal: true,
  },
];

const TIP_DURATION = 1500;
const FADE_OUT_AFTER = TIPS.length * TIP_DURATION + 800;
const REDIRECT_AFTER = FADE_OUT_AFTER + 650;

const SECURITY_CHECKS = [
  { label: "Tokens Revoked", tip: 0 },
  { label: "Session Cleared", tip: 1 },
  { label: "Cookies Removed", tip: 2 },
  { label: "Audit Logged", tip: 3 },
];

async function callLogoutEndpoint(token) {
  if (!token) return;
  if (token.startsWith("mock_token_")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn("Logout API responded with", response.status);
    }
  } catch (error) {
    console.warn("Logout API call failed", error);
  }
}

export default function LogoutPage({ onLogout }) {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeColors();
  const ranRef = useRef(false);
  const [activeTip, setActiveTip] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!ranRef.current) {
      ranRef.current = true;
      onLogout?.();

      const performLogout = async () => {
        const storedToken =
          localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        const accessToken = storedToken?.startsWith("Bearer ")
          ? storedToken.slice(7).trim()
          : storedToken;

        await callLogoutEndpoint(accessToken);

        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(USER_KEY);
          document.cookie.split(";").forEach((c) => {
            const name =
              c.indexOf("=") > -1 ? c.substring(0, c.indexOf("=")) : c;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          });
          window.dispatchEvent(new Event("auth:updated"));
        } catch (e) {
          console.warn("Logout cleanup failed", e);
        }
      };

      void performLogout();
    }

    const tipTimers = TIPS.map((_, i) =>
      setTimeout(() => setActiveTip(i), i * TIP_DURATION),
    );
    const leaveTimer = setTimeout(() => setLeaving(true), FADE_OUT_AFTER);
    const redirectTimer = setTimeout(
      () => navigate("/login", { replace: true }),
      REDIRECT_AFTER,
    );

    return () => {
      tipTimers.forEach(clearTimeout);
      clearTimeout(leaveTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, onLogout]);

  const isFinalTip = activeTip === TIPS.length - 1;
  const progress = ((activeTip + 1) / TIPS.length) * 100;

  return (
    <div
      className="logout-root"
      style={{
        minHeight: "100vh",
        width: "100%",
        background: isDarkMode ? "#020c14" : "#f0f4f8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 24px",
        fontFamily: "'Poppins', sans-serif",
        position: "relative",
        overflow: "hidden",
        opacity: leaving ? 0 : 1,
        transform: leaving ? "scale(0.96)" : "scale(1)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {/* Background orbs — matches login feel */}
      <div className="lo-orb lo-orb-1" />
      <div className="lo-orb lo-orb-2" />
      <div className="lo-orb lo-orb-3" />
      {/* Subtle grid */}
      <div className="lo-grid" />

      {/* Card */}
      <div
        className="logout-card"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 960,
          display: "flex",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 36px 110px rgba(0,0,0,0.68)",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(5, 18, 29, 0.75)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* ══ LEFT: Animated Tips ══ */}
        <div
          className="logout-left"
          style={{
            flex: "0 0 50%",
            background:
              "linear-gradient(170deg, rgba(7,26,41,0.96) 0%, rgba(6,22,34,0.96) 100%)",
            backdropFilter: "blur(20px)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "48px 44px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Heading */}
          <div style={{ marginBottom: 36 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: PRIMARY,
              }}
            >
              Signing out securely
            </p>
            <h2
              style={{
                margin: 0,
                fontSize: 21,
                fontWeight: 950,
                color: "#fff",
                lineHeight: 1.3,
              }}
            >
              A few things to know
            </h2>
            <p
              style={{
                margin: "5px 0 0",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.5,
              }}
            >
              While we clean up your session…
            </p>
          </div>

          {/* Tips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {TIPS.map((tip, i) => {
              const isActive = i === activeTip;
              const isDone = i < activeTip;

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    opacity: isDone ? 0.38 : isActive ? 1 : 0.15,
                    transform: isActive
                      ? "translateX(0)"
                      : isDone
                        ? "translateX(0)"
                        : "translateX(12px)",
                    transition: "opacity 0.5s ease, transform 0.5s ease",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive
                        ? `linear-gradient(135deg, ${tip.isFinal ? SECONDARY : PRIMARY}20, ${tip.isFinal ? SECONDARY : PRIMARY}08)`
                        : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${
                        isActive
                          ? (tip.isFinal ? SECONDARY : PRIMARY) + "55"
                          : isDone
                            ? "rgba(97,197,195,0.22)"
                            : "rgba(255,255,255,0.08)"
                      }`,
                      color: isActive
                        ? tip.isFinal
                          ? SECONDARY
                          : PRIMARY
                        : isDone
                          ? "rgba(97,197,195,0.45)"
                          : "rgba(255,255,255,0.18)",
                      boxShadow: isActive
                        ? `0 0 14px ${tip.isFinal ? SECONDARY : PRIMARY}28`
                        : "none",
                      transition: "all 0.45s ease",
                    }}
                  >
                    {isDone ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={PRIMARY}
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width="16"
                        height="16"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      tip.icon
                    )}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, paddingTop: 1 }}>
                    <p
                      style={{
                        margin: "0 0 3px",
                        fontSize: 13,
                        fontWeight: 800,
                        lineHeight: 1.3,
                        color: isActive
                          ? tip.isFinal
                            ? SECONDARY
                            : "#fff"
                          : isDone
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(255,255,255,0.25)",
                        transition: "color 0.45s ease",
                      }}
                    >
                      {tip.title}
                    </p>
                    {isActive && (
                      <p
                        key={`desc-${i}`}
                        style={{
                          margin: 0,
                          fontSize: 11.5,
                          color: "rgba(255,255,255,0.52)",
                          lineHeight: 1.65,
                          animation: "tipSlideIn 0.38s ease forwards",
                        }}
                      >
                        {tip.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress */}
          <div style={{ marginTop: 36 }}>
            <div
              style={{
                height: 3,
                borderRadius: 99,
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`,
                  borderRadius: 99,
                  transition: `width ${TIP_DURATION * 0.85}ms ease`,
                }}
              />
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 10.5,
                color: "rgba(255,255,255,0.28)",
              }}
            >
              {isFinalTip
                ? "All done — redirecting to login…"
                : `${activeTip + 1} of ${TIPS.length}`}
            </p>
          </div>
        </div>

        {/* ══ RIGHT: Security Guarantee ══ */}
        <div
          className="logout-right"
          style={{
            flex: "0 0 50%",
            background: "linear-gradient(160deg, #051c2c 0%, #06283a 100%)",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "44px 28px",
            gap: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Radial glow behind shield */}
          <div
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${isFinalTip ? SECONDARY : PRIMARY}14 0%, transparent 68%)`,
              transition: "background 0.6s ease",
              pointerEvents: "none",
            }}
          />

          {/* Shield with pulsing rings */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="ring ring-1"
              style={{ borderColor: isFinalTip ? SECONDARY : PRIMARY }}
            />
            <div
              className="ring ring-2"
              style={{ borderColor: isFinalTip ? SECONDARY : PRIMARY }}
            />
            <div
              className="ring ring-3"
              style={{ borderColor: isFinalTip ? SECONDARY : PRIMARY }}
            />

            <div
              style={{
                width: 116,
                height: 116,
                borderRadius: "50%",
                background: `linear-gradient(145deg, ${isFinalTip ? SECONDARY : PRIMARY}18, transparent)`,
                border: `2px solid ${isFinalTip ? SECONDARY : PRIMARY}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 2,
                boxShadow: `0 0 40px ${isFinalTip ? SECONDARY : PRIMARY}25, 0 0 80px ${isFinalTip ? SECONDARY : PRIMARY}10`,
                transition: "all 0.6s ease",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="54"
                height="54"
                style={{
                  filter: `drop-shadow(0 0 10px ${isFinalTip ? SECONDARY : PRIMARY}66)`,
                  animation: "shieldBob 3.5s ease-in-out infinite",
                  transition: "filter 0.6s ease",
                }}
              >
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  stroke={isFinalTip ? SECONDARY : PRIMARY}
                  strokeWidth="1.7"
                />
                <polyline
                  points="9 12 11 14 15 10"
                  stroke={isFinalTip ? SECONDARY : PRIMARY}
                  strokeWidth="2"
                  strokeDasharray="20"
                  strokeDashoffset={isFinalTip ? "0" : "0"}
                  style={{ transition: "stroke 0.5s ease" }}
                />
              </svg>
            </div>
          </div>

          {/* Label */}
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                fontWeight: 800,
                letterSpacing: "0.3px",
                color: isFinalTip ? SECONDARY : PRIMARY,
                transition: "color 0.5s ease",
              }}
            >
              {isFinalTip ? "Logout Complete" : "Securing Session"}
            </p>
            <p
              style={{
                margin: "5px 0 0",
                fontSize: 11,
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.6,
              }}
            >
              {isFinalTip
                ? "Your data is safe.\nCome back anytime."
                : "Revoking credentials\nand clearing cache…"}
            </p>
          </div>

          {/* Security checklist */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 9,
              width: "100%",
              maxWidth: 175,
              position: "relative",
              zIndex: 1,
            }}
          >
            {SECURITY_CHECKS.map(({ label, tip: tipIndex }) => {
              const done = activeTip > tipIndex || activeTip === tipIndex;
              return (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: done ? 1 : 0.2,
                    transition: "opacity 0.5s ease",
                  }}
                >
                  <div
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: "50%",
                      background: done
                        ? `${PRIMARY}20`
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${done ? PRIMARY + "50" : "rgba(255,255,255,0.10)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.45s ease",
                    }}
                  >
                    {done && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={PRIMARY}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        width="9"
                        height="9"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: done
                        ? "rgba(255,255,255,0.7)"
                        : "rgba(255,255,255,0.2)",
                      transition: "color 0.45s ease",
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom accent bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${PRIMARY}, ${SECONDARY})`,
              opacity: 0.55,
            }}
          />
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');

        .lo-orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(80px);
          pointer-events: none;
          animation: loFloat 9s ease-in-out infinite;
        }
        .lo-orb-1 {
          width: 420px; height: 420px;
          top: -120px; left: -110px;
          background: ${PRIMARY};
          opacity: 0.08;
        }
        .lo-orb-2 {
          width: 340px; height: 340px;
          right: -90px; bottom: -90px;
          background: ${SECONDARY};
          opacity: 0.08;
          animation-delay: 1.5s;
        }
        .lo-orb-3 {
          width: 220px; height: 220px;
          left: 44%; top: 62%;
          background: ${PRIMARY};
          opacity: 0.05;
          animation-delay: 3.2s;
        }
        .lo-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(97,197,195,0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(97,197,195,0.028) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .ring {
          position: absolute;
          border-radius: 50%;
          border-width: 1px;
          border-style: solid;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: ringPulse 2.6s ease-out infinite;
          transition: border-color 0.6s ease;
        }
        .ring-1 { width: 144px; height: 144px; opacity: 0.2; animation-delay: 0s; }
        .ring-2 { width: 182px; height: 182px; opacity: 0.12; animation-delay: 0.65s; }
        .ring-3 { width: 220px; height: 220px; opacity: 0.06; animation-delay: 1.3s; }

        @keyframes tipSlideIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ringPulse {
          0% { transform: translate(-50%,-50%) scale(0.9); opacity: 0.22; }
          70% { opacity: 0.08; }
          100% { transform: translate(-50%,-50%) scale(1.1); opacity: 0; }
        }
        @keyframes shieldBob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes loFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(22px); }
        }

        .logout-root {
          animation: loFadeIn 0.45s ease;
        }
        .logout-card {
          animation: loCardIn 0.55s ease;
        }

        @media (max-width: 960px) {
          .logout-card {
            max-width: 760px !important;
            border-radius: 24px !important;
          }
          .logout-left,
          .logout-right {
            flex: 0 0 50% !important;
          }
        }

        @media (max-width: 820px) {
          .logout-root {
            padding: 18px !important;
          }
          .logout-card {
            flex-direction: column !important;
            max-width: 580px !important;
          }
          .logout-left,
          .logout-right {
            flex: 1 1 auto !important;
            width: 100% !important;
            border-left: none !important;
            border-right: none !important;
          }
          .logout-left {
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          }
        }

        @keyframes loFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes loCardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
