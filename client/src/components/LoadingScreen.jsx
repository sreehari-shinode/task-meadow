import React from 'react';

const LoadingScreen = ({ message = "LOADING SYSTEM" }) => {
  return (
    <div className="fixed inset-0 bg-[#1d2145] bg-gradient-to-b from-[#1d2145] to-[#141832] flex flex-col items-center justify-between py-8">
      {/* Top space */}
      <div></div>
      
      {/* Loading animation */}
      <div className="loader">
        <div className="before"></div>
        <div className="after"></div>
      </div>

      {/* Bottom text with internal ripple effect */}
      <div className="text-md font-normal font-sans relative">
        <span className="text-ripple">{message}</span>
      </div>

      <style jsx>{`
        .loader {
          width: 40px;
          aspect-ratio: 1;
          position: relative;
        }
        .loader:before,
        .loader:after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          margin: -8px 0 0 -8px;
          width: 16px;
          aspect-ratio: 1;
          background: #d62e49;
          animation:
            l2-1 2s infinite,
            l2-2 1s infinite;
        }
        .loader:after {
          background: white;
          animation-delay: -1s, 0s;
        }
        @keyframes l2-1 {
          0%   {top:0   ;left:0}
          25%  {top:100%;left:0}
          50%  {top:100%;left:100%}
          75%  {top:0   ;left:100%}
          100% {top:0   ;left:0}
        }
        @keyframes l2-2 {
          40%,50% {transform: rotate(0.25turn) scale(0.5)}
          100%    {transform: rotate(0.5turn) scale(1)}
        }
        .text-ripple {
          background: linear-gradient(
            to right,
            white 0%,
            white 45%,
            #d62e49 50%,
            white 55%,
            white 100%
          );
          background-size: 200% auto;
          color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
          animation: text-shine 2s linear infinite;
        }
        @keyframes text-shine {
          to {
            background-position: 200% center;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen; 