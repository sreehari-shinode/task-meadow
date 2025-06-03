import React from 'react';

const BORDER = 10; // thickness of the border in px
const RADIUS = 20; // border radius in px

const ScreenBorder = ({ children }) => (
  <div className="relative min-h-screen">
    {/* Content */}
    <div className="relative z-10">
      {children}
    </div>

    {/* Border Overlay */}
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      width="100vw"
      height="100vh"
    >
      <defs>
        <mask id="border-mask">
          {/* Outer white rectangle (visible) */}
          <rect x="0" y="0" width="100vw" height="100vh" fill="white" />
          {/* Inner black rounded rectangle (transparent area) */}
          <rect 
            x={BORDER} 
            y={BORDER} 
            width={`calc(100vw - ${BORDER * 2}px)`} 
            height={`calc(100vh - ${BORDER * 2}px)`} 
            rx={RADIUS} 
            ry={RADIUS} 
            fill="black" 
          />
        </mask>
      </defs>
      {/* White overlay with transparent center */}
      <rect 
        x="0" 
        y="0" 
        width="100vw" 
        height="100vh" 
        fill="white" 
        mask="url(#border-mask)" 
      />
    </svg>
  </div>
);

export default ScreenBorder; 