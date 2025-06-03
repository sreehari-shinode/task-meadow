import React from 'react';

const TimeRuler = ({ averageMinutes = 105 }) => {
  const hour = Math.floor(averageMinutes / 60);
  const minutePart = averageMinutes % 60;
  const minutesToNextHour = 60 - minutePart;

  let startHour;
  if (minutesToNextHour >= 15) {
    startHour = hour - 1 >= 0 ? hour - 1 : 0;
  } else {
    startHour = hour;
  }

  const start = startHour * 60;
  const end = start + 120;
  const totalSpan = end - start;

  const displayText = `${Math.floor(averageMinutes / 60)}h ${averageMinutes % 60}min`;
  const avgPosition = ((averageMinutes - start) / totalSpan) * 100;

  const tickInterval = 5;
  const ticks = [];
  for (let i = start; i <= end; i += tickInterval) {
    ticks.push(i);
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto h-24 !font-sans">
      <div
        className="absolute -top-0 text-center transform -translate-x-1/2 px-1 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full text-center min-w-[70px]"
        style={{ left: `${avgPosition}%` }}
      >
        {displayText}
      </div>

      <div
        className="absolute top-6 rounded-[12px] bottom-[31px] w-[3px] bg-yellow-400 z-10"
        style={{ left: `${avgPosition}%` }}
      ></div>

        {ticks.map((minute, idx) => {
        const isHour = minute % 60 === 0;     
        const isHalfHour = minute % 60 === 30; 
        const percent = ((minute - start) / totalSpan) * 100;
        const isAverage = minute === averageMinutes;
        const isHighlighted =
            Math.abs(minute - averageMinutes) <= 20 && minute !== averageMinutes;

        let heightClass = 'h-2'; 
        if (isHour) heightClass = 'h-6';     
        else if (isHalfHour) heightClass = 'h-4';

        const bgColor = isAverage || isHighlighted ? 'bg-yellow-400' : isHour ? 'bg-white' : 'bg-gray-400';

        return (
            <div
            key={idx}
            className={`absolute bottom-[32px] rounded-[12px] ${heightClass} ${bgColor} w-[3px]`}
            style={{ left: `${percent}%` }}
            />
        );
        })}


        {[0, 60, 120].map((offset, i) => {
        const labelMinutes = start + offset;
        const percent = (offset / totalSpan) * 100;

        const hour = Math.floor(labelMinutes / 60);
        const minutes = labelMinutes % 60;

        const label =
            labelMinutes === 0
            ? '0'
            : hour >= 1
            ? `${hour}H${minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`}`
            : '';

        return (
            <div
            key={i}
            className="absolute font-semibold bottom-[10px] text-xs text-white/40"
            style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
            >
            {label}
            </div>
        );
        })}

    </div>
  );
};

export default TimeRuler;
