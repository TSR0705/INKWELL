import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { GoArrowUpRight } from "react-icons/go";
import "./CardNav.css";

/**
 * CardNav (Inkwell)
 *
 * Props:
 * - logo: image path for the logo
 * - logoAlt: alt text for logo
 * - items: array of { label, bgColor, textColor, links: [{ label, ariaLabel, href }] }
 * - className: extra class
 * - ease: gsap ease
 * - baseColor: navbar background (default uses CSS var)
 * - menuColor: color for hamburger & text
 * - buttonBgColor, buttonTextColor: CTA button colors
 *
 * Example usage (in App.jsx):
 * <CardNav
 *   logo="/logo.svg"
 *   logoAlt="Inkwell"
 *   items={items}
 *   baseColor="var(--light-card)"
 *   menuColor="var(--text-light)"
 *   buttonBgColor="var(--light-accent)"
 *   buttonTextColor="var(--text-light)"
 * />
 */
const CardNav = ({
  logo,
  logoAlt = "Inkwell",
  items = [],
  className = "",
  ease = "power3.out",
  baseColor = "var(--light-card)",
  menuColor,
  buttonBgColor = "var(--light-accent)",
  buttonTextColor = "var(--text-light)",
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content");
      if (contentEl) {
        // Temporarily make it visible to measure
        const prev = {
          visibility: contentEl.style.visibility,
          pointerEvents: contentEl.style.pointerEvents,
          position: contentEl.style.position,
          height: contentEl.style.height,
        };

        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";

        // force reflow
        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        // restore
        contentEl.style.visibility = prev.visibility;
        contentEl.style.pointerEvents = prev.pointerEvents;
        contentEl.style.position = prev.position;
        contentEl.style.height = prev.height;

        return topBar + contentHeight + padding;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(
      navEl,
      {
        height: calculateHeight,
        duration: 0.42,
        ease,
      },
      0
    );

    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.42, ease, stagger: 0.08 },
      "-=0.08"
    );

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i) => (el) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""}`}
        style={{ backgroundColor: baseColor }}
      >
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
            style={{ color: menuColor || "var(--text-light)" }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container" style={{ pointerEvents: "auto" }}>
            {logo ? (
              <img src={logo} alt={logoAlt} className="logo" />
            ) : (
              <div className="ink-logo">IW</div>
            )}
          </div>

          <button
            type="button"
            className="card-nav-cta-button"
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
          >
            Get Started
          </button>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{
                backgroundColor: item.bgColor || "var(--light-card)",
                color: item.textColor || "var(--text-light)",
              }}
            >
              <div className="nav-card-label">{item.label}</div>

              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    href={lnk.href || "#"}
                    aria-label={lnk.ariaLabel}
                  >
                    <GoArrowUpRight className="nav-card-link-icon" aria-hidden />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
