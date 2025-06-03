import { useEffect, useState } from 'react';

const CustomCircularProgress = ({ value = 70, label = 'W1', isSelected = false, days = 0 }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000; // ms
    const frame = 16;

    const animate = () => {
      start += frame;
      const progress = Math.min(start / duration, 1);
      setAnimatedValue(progress * value);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  const dashOffset = circumference - (animatedValue / 100) * circumference;

  const getProgressColor = (days) => {
    if (days >= 5) return '#22c55e';
    if (days >= 3) return '#f59e0b';
    if (days > 0) return '#d62e49';
    return 'rgba(255, 255, 255, 0.1)';
  };

  const progressColor = isSelected ? '#d62e49' : getProgressColor(days);

  return (
    <div className="relative w-20 h-20 group">
      {/* SVG with track and animated progress */}
      <svg className="w-full h-full rotate-[-90deg]">
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke={progressColor}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      <div
        className={`
          absolute top-1/2 left-1/2 w-[81%] h-[81%] rounded-full 
          transform -translate-x-1/2 -translate-y-1/2 
          flex items-center justify-center
          transition-colors duration-300
          ${isSelected ? 'bg-[#d62e49]' : 'group-hover:bg-[#d62e49]/80'}
        `}
      >
        <span
          className={`
            text-lg font-semibold transition-colors duration-300
            ${isSelected ? 'text-white' : 'group-hover:text-white text-white/50'}
          `}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

export default CustomCircularProgress;
