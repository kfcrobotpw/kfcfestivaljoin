import React from 'react';

interface KFCLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'icon' | 'badge';
  transparent?: boolean;
}

export const KFCLogo: React.FC<KFCLogoProps> = ({
  className = 'w-10 h-10',
  size,
  transparent = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
      style={style}
    >
      {/* Background */}
      {!transparent && <rect width="800" height="800" rx="16" fill="#FFFFFF" />}

      {/* Horizontal Axis Line with Dashes and Arrows */}
      <g stroke="#000000" strokeWidth="12" strokeLinecap="square">
        {/* Left outer dash */}
        <line x1="0" y1="400" x2="20" y2="400" strokeWidth="14" />
        {/* Left second dash */}
        <line x1="55" y1="400" x2="95" y2="400" strokeWidth="14" />

        {/* Left arrowhead '<' */}
        <path
          d="M 135 382 L 105 400 L 135 418"
          stroke="#000000"
          strokeWidth="8"
          fill="none"
          strokeLinejoin="miter"
          strokeLinecap="round"
        />

        {/* Main horizontal equator line across globe */}
        <line x1="110" y1="400" x2="690" y2="400" strokeWidth="8" />

        {/* Right arrowhead '>' */}
        <path
          d="M 665 382 L 695 400 L 665 418"
          stroke="#000000"
          strokeWidth="8"
          fill="none"
          strokeLinejoin="miter"
          strokeLinecap="round"
        />

        {/* Right first dash */}
        <line x1="705" y1="400" x2="745" y2="400" strokeWidth="14" />
        {/* Right outer dash */}
        <line x1="780" y1="400" x2="800" y2="400" strokeWidth="14" />
      </g>

      {/* Globe Outer Circle */}
      <circle cx="400" cy="400" r="255" stroke="#000000" strokeWidth="18" fill="none" />

      {/* Globe Vertical Center Meridian */}
      <line x1="400" y1="145" x2="400" y2="655" stroke="#000000" strokeWidth="14" />

      {/* Globe Side Meridians (Inner Arcs) */}
      <ellipse cx="400" cy="400" rx="116" ry="255" stroke="#000000" strokeWidth="14" fill="none" />

      {/* Globe Latitudes / Parallels (Curving downward) */}
      {/* Upper Latitude */}
      <path d="M 216 270 Q 400 318 584 270" stroke="#000000" strokeWidth="14" fill="none" />
      {/* Lower Latitude */}
      <path d="M 200 540 Q 400 588 600 540" stroke="#000000" strokeWidth="14" fill="none" />

      {/* Main KFC Bold Italic Typography */}
      <text
        x="396"
        y="470"
        textAnchor="middle"
        fontFamily="'Arial Black', Impact, 'Trebuchet MS', sans-serif"
        fontSize="205"
        fontWeight="900"
        fontStyle="italic"
        letterSpacing="-6"
        fill="#000000"
      >
        K.F.C.
      </text>

      {/* Korea Fun Club Black Ribbon Banner with Jagged Ends */}
      <g>
        <path
          d="M 230 522 
             L 214 535 
             L 226 548 
             L 214 561 
             L 230 574 
             L 570 574 
             L 586 561 
             L 574 548 
             L 586 535 
             L 570 522 
             Z"
          fill="#000000"
        />
        <text
          x="400"
          y="559"
          textAnchor="middle"
          fontFamily="'Pretendard', -apple-system, 'Segoe UI', Arial, sans-serif"
          fontSize="33"
          fontWeight="700"
          letterSpacing="0.5"
          fill="#FFFFFF"
        >
          Korea Fun Club
        </text>
      </g>
    </svg>
  );
};
