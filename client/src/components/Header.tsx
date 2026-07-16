import logoOrielSrc from "/oriel-signal-mark.png";
import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import ArcanaSignalTransition from "./ArcanaSignalTransition";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [arcanaTuning, setArcanaTuning] = useState(false);
  const tuningRef = useRef(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Tune from the current signal onto the ARKANA frequency: a brief
  // signal-loss / recalibration overlay, then route to /arcana.
  const navigateToArcana = () => {
    setMobileMenuOpen(false);
    if (location.startsWith("/arcana") || tuningRef.current) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setLocation("/arcana");
      return;
    }

    tuningRef.current = true;
    setArcanaTuning(true);
    // Navigate while the static fully covers the screen...
    window.setTimeout(() => setLocation("/arcana"), 650);
    // ...then let the overlay recalibrate and fade out.
    window.setTimeout(() => {
      setArcanaTuning(false);
      tuningRef.current = false;
    }, 1200);
  };

  const navLinks = [
    { href: "/", label: "Ψ" },
    { href: "/arcana", label: "ARKIVA" },
    { href: "/bio-architecture", label: "BIO-ARCHITECTURE" },
    { href: "/protocol", label: "PROTOCOL" },
    { href: "/conduit", label: "CHANNEL ORIEL" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/arcana") {
      return (
        location.startsWith("/arcana") ||
        location.startsWith("/knowledge") ||
        location.startsWith("/archive") ||
        location.startsWith("/transmission") ||
        location.startsWith("/oracle") ||
        location.startsWith("/cosmichronica") ||
        location.startsWith("/core-concepts") ||
        location.startsWith("/models-maps")
      );
    }
    if (href === "/bio-architecture") {
      return (
        location.startsWith("/bio-architecture") ||
        location.startsWith("/codex")
      );
    }
    return location.startsWith(href);
  };

  return (
    <header
      className="liquid-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-24 items-center justify-between gap-5">
          {/* Logo */}
          <Link href="/">
            <span
              aria-label="ORIEL SIGNAL home"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                minWidth: 0,
              }}
            >
              <img
                src={logoOrielSrc}
                alt="ORIEL Emblem"
                style={{
                  height: "clamp(66px, 6.2vw, 84px)",
                  width: "auto",
                  objectFit: "contain",
                  opacity: 0.98,
                  filter:
                    "brightness(1.12) contrast(1.08) drop-shadow(0 0 22px rgba(246,176,94,0.52))",
                }}
              />
              <span className="signal-wordmark--holo signal-wordmark--nav">
                ORIEL SIGNAL
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map(link => {
              const spanStyle = {
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                letterSpacing: "0.18em",
                padding: "7px 10px",
                cursor: "pointer",
                transition: "all 0.28s ease",
                color: isActive(link.href)
                  ? "#f6b05e"
                  : "rgba(232,228,220,0.62)",
                borderBottom: isActive(link.href)
                  ? "1px solid rgba(246,176,94,0.5)"
                  : "none",
                display: "inline-block",
                textShadow: isActive(link.href)
                  ? "0 0 18px rgba(246,176,94,0.42)"
                  : "none",
              } as const;

              if (link.href === "/arcana") {
                return (
                  <span
                    key={link.href}
                    role="link"
                    tabIndex={0}
                    style={spanStyle}
                    onClick={navigateToArcana}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigateToArcana();
                      }
                    }}
                  >
                    {link.label}
                  </span>
                );
              }

              return (
                <Link key={link.href} href={link.href}>
                  <span style={spanStyle}>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth Links - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <Link href="/profile">
                  <span
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 10,
                      color: "#9a968e",
                      cursor: "pointer",
                      letterSpacing: "0.12em",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <User size={12} />
                    PROFILE
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    color: "#9a968e",
                    cursor: "pointer",
                    letterSpacing: "0.12em",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  <LogOut size={12} />
                  LOGOUT
                </button>
              </>
            ) : (
              <a
                href={getLoginUrl()}
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  color: "#9a968e",
                  cursor: "pointer",
                  letterSpacing: "0.12em",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <LogIn size={12} />
                LOGIN
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            style={{
              color: "#bda36b",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden pb-4 mt-2"
            style={{ borderTop: "1px solid rgba(189,163,107,0.12)" }}
          >
            <div className="flex flex-col pt-3">
              {navLinks.map(link => {
                const mSpanStyle = {
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  letterSpacing: "0.17em",
                  display: "block",
                  padding: "8px 12px",
                  cursor: "pointer",
                  color: isActive(link.href)
                    ? "#f6b05e"
                    : "rgba(232,228,220,0.62)",
                  borderLeft: isActive(link.href)
                    ? "2px solid #f6b05e"
                    : "2px solid transparent",
                } as const;

                if (link.href === "/arcana") {
                  return (
                    <span
                      key={link.href}
                      role="link"
                      tabIndex={0}
                      style={mSpanStyle}
                      onClick={navigateToArcana}
                    >
                      {link.label}
                    </span>
                  );
                }

                return (
                  <Link key={link.href} href={link.href}>
                    <span
                      style={mSpanStyle}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </span>
                  </Link>
                );
              })}

              {/* Mobile Auth */}
              <div
                style={{
                  borderTop: "1px solid rgba(189,163,107,0.12)",
                  marginTop: 8,
                  paddingTop: 8,
                }}
              >
                {isAuthenticated && user ? (
                  <>
                    <Link href="/profile">
                      <span
                        style={{
                          fontFamily: "var(--font-ritual)",
                          fontSize: 11,
                          color: "#9a968e",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 12px",
                          cursor: "pointer",
                          letterSpacing: "0.12em",
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User size={12} /> PROFILE
                      </span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      style={{
                        fontFamily: "var(--font-ritual)",
                        fontSize: 11,
                        color: "#9a968e",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 12px",
                        cursor: "pointer",
                        letterSpacing: "0.12em",
                        background: "none",
                        border: "none",
                        width: "100%",
                        textAlign: "left" as const,
                      }}
                    >
                      <LogOut size={12} /> LOGOUT
                    </button>
                  </>
                ) : (
                  <a
                    href={getLoginUrl()}
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 11,
                      color: "#9a968e",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      cursor: "pointer",
                      letterSpacing: "0.12em",
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={12} /> LOGIN
                  </a>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>

      <ArcanaSignalTransition active={arcanaTuning} />
    </header>
  );
}
