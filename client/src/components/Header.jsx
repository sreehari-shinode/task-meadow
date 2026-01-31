import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Profile from "./Profile";

const StickyHeader = ({ onHeightChange, onShrinkChange }) => {
  const maxHeight = window.innerHeight;
  const minHeight = 80;
  const [scrollY, setScrollY] = useState(0);
  const [isShrunk, setIsShrunk] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [profileTriggerPosition, setProfileTriggerPosition] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollY(currentScroll);

      const shouldShrink = currentScroll >= maxHeight - minHeight;
      setIsShrunk(shouldShrink);
      setLocked(shouldShrink);

      // Show the scroll-down button only when we are near the top
      // (hero visible). Hide it once we've scrolled down.
      setShowScrollButton(currentScroll < maxHeight * 0.1);

      if (onShrinkChange) {
        onShrinkChange(shouldShrink);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [maxHeight, minHeight, onShrinkChange]);

  const calculatedHeight = isShrunk
    ? minHeight
    : Math.max(maxHeight - scrollY, minHeight);

  useEffect(() => {
    if (onHeightChange) {
      onHeightChange(calculatedHeight);
    }
  }, [calculatedHeight, onHeightChange]);

  // Fade calculations
  const fadeStart = maxHeight * 0.3;
  const fadeEnd = maxHeight * 0.6;

  const descriptionFadeProgress = Math.min(
    Math.max((scrollY - fadeStart) / (fadeEnd - fadeStart), 0),
    1
  );

  const descriptionOpacity = 1 - descriptionFadeProgress;
  const hideDescription = scrollY >= fadeEnd;

  // Text fade and position calculation
  const textFadeStart = maxHeight * 0.2;
  const textFadeEnd = maxHeight * 0.4;
  const textFadeProgress = Math.min(
    Math.max((scrollY - textFadeStart) / (textFadeEnd - textFadeStart), 0),
    1
  );
  const textOpacity = 1 - textFadeProgress;
  const textTranslateY = -scrollY * 1.2;

  const perspective = 1000;
  const rotateX = (scrollY / maxHeight) * 20;
  const translateZ = -scrollY * 0.5;

  const handleProfileClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setProfileTriggerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    });
    setShowProfile(true);
  };

  const handleScrollDownClick = () => {
    // Smoothly scroll to (and slightly past) the main tabs section
    // so that at least ~85vh of tab content is in view.
    const target = document.getElementById("home-tabs-root");
    // Hide the button immediately on click; it will only reappear
    // once the user scrolls back up to the hero area.
    setShowScrollButton(false);
    if (target) {
      const rect = target.getBoundingClientRect();
      const currentScroll = window.scrollY;
      // Scroll so that about 75vh of tab content is visible
      const extraOffset = window.innerHeight * 0.75;
      const targetY = currentScroll + rect.top + extraOffset;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    } else {
      // Fallback: scroll a bit further down the page
      const targetY = window.innerHeight * 1.5;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Fixed Profile Icon */}
      <div className="fixed top-10 group right-10 z-50">
        <div 
          className="w-12 h-12 rounded-full shadow-lg flex items-center group-hover:scale-100 justify-center cursor-pointer group-hover:shadow-xl transition-all duration-500 relative overflow-hidden bg-white"
          onClick={handleProfileClick}
        >
          <div className="absolute inset-0 bg-[#d62e49] transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-full"></div>
          
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-[#d62e49] group-hover:text-white relative z-10 transition-colors duration-500"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
            />
          </svg>
        </div>
      </div>

      {/* Center Bottom Scroll-Down Button (visible only near top / hero) */}
      {showScrollButton && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
          <div
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transition-all duration-500 relative overflow-hidden bg-white group"
            onClick={handleScrollDownClick}
          >
            <div className="absolute inset-0 bg-[#d62e49] transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out rounded-full" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#d62e49] group-hover:text-white relative z-10 transition-colors duration-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      )}

      <motion.header
        className="fixed top-0 left-0 right-0 z-40 overflow-hidden pointer-events-none"
        style={{ 
          height: calculatedHeight,
          backgroundColor: 'transparent',
          perspective: `${perspective}px`
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative h-full w-full">
          {/* 3D Container */}
          <div 
            className="relative h-full w-full"
            style={{
              transform: `perspective(${perspective}px) rotateX(${rotateX}deg) translateZ(${translateZ}px)`,
              transformStyle: 'preserve-3d',
              transition: 'transform 0.1s ease-out'
            }}
          >
            {/* Content Container */}
            <div className="relative h-full flex items-center justify-center">
              {isShrunk ? (
                // Sticky Header Content
                <motion.h1 
                  className="text-2xl font-bold text-[#d62e49]"
                  style={{ fontFamily: 'Oswald, sans-serif' }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  TASK MEADOW
                </motion.h1>
              ) : (
                // Hero Section Content
                <>
                  <div
                    className="overflow-hidden w-full"
                    style={{
                      opacity: textOpacity,
                      transform: `translateY(${textTranslateY}px)`,
                      transformStyle: 'preserve-3d',
                      transition: 'all 0.1s ease-out'
                    }}
                  >
                    <div className="flex whitespace-nowrap animate-marquee" style={{ display: 'inline-flex' }}>
                      {/* First set of text */}
                      {[...Array(15)].map((_, i) => (
                        <span
                          key={`first-${i}`}
                          className="text-[400px] font-semibold text-[#d62e49] inline-block mr-16"
                          style={{ fontFamily: 'Oswald, sans-serif' }}
                        >
                          TASK MEADOW
                        </span>
                      ))}
                      {/* Duplicate set for seamless loop */}
                      {[...Array(15)].map((_, i) => (
                        <span
                          key={`second-${i}`}
                          className="text-[400px] font-semibold text-[#d62e49] inline-block mr-16"
                          style={{ fontFamily: 'Oswald, sans-serif' }}
                        >
                          TASK MEADOW
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Profile Modal */}
      <Profile 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)}
        triggerPosition={profileTriggerPosition}
      />
    </>
  );
};

export default StickyHeader;
