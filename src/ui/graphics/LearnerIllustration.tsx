import Box from '@mui/material/Box';

/**
 * Modern illustrative SVG vector aligned with the Adaptiq light Material and Graph design language.
 * Featuring a learner exploring a knowledge graph and neural learning mechanisms with animated floating elements.
 */
export function LearnerIllustration() {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 460,
        height: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <svg
        viewBox="0 0 500 500"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Subtle background glow circle */}
        <circle cx="250" cy="250" r="180" fill="#E8F0FD" opacity="0.6" />

        {/* Ambient floating node connections (Graph aesthetic) */}
        <g stroke="#1A5FD0" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4">
          <line x1="140" y1="120" x2="250" y2="90" />
          <line x1="250" y1="90" x2="360" y2="140" />
          <line x1="360" y1="140" x2="390" y2="260" />
          <line x1="140" y1="120" x2="110" y2="240" />
        </g>

        {/* Floating Concept Nodes with Halftone Dot pattern fills */}
        <defs>
          <pattern id="node-dots-1" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.5" fill="#1B7F4B" />
          </pattern>
          <pattern id="node-dots-2" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.8" fill="#1A5FD0" />
          </pattern>
        </defs>

        {/* Node 1: Mastered */}
        <g className="floating-node-1">
          <circle cx="140" cy="120" r="28" fill="#D8F0E2" stroke="#1B7F4B" strokeWidth="2" />
          <circle cx="140" cy="120" r="24" fill="url(#node-dots-1)" opacity="0.8" />
          <circle cx="140" cy="120" r="10" fill="#FFFFFF" />
          <path d="M136 120 L139 123 L145 117" stroke="#1B7F4B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Node 2: Adaptive In-Progress */}
        <g className="floating-node-2">
          <circle cx="360" cy="140" r="32" fill="#E8F0FD" stroke="#1A5FD0" strokeWidth="2" />
          <circle cx="360" cy="140" r="28" fill="url(#node-dots-2)" opacity="0.8" />
          <circle cx="360" cy="140" r="12" fill="#FFFFFF" />
          <circle cx="360" cy="140" r="5" fill="#1A5FD0" />
        </g>

        {/* Ground platform shadow */}
        <ellipse cx="250" cy="430" rx="140" ry="12" fill="#111A2B" opacity="0.08" />

        {/* Character: Learner standing holding tablet/phone */}
        <g id="learner-character">
          {/* Legs */}
          <path
            d="M230 270 L220 410 L238 412 L245 285"
            fill="#111A2B"
          />
          <path
            d="M255 270 L268 410 L250 412 L242 285"
            fill="#111A2B"
          />

          {/* Shoes */}
          <path d="M214 410 C214 410 210 422 238 422 L242 410 Z" fill="#1A5FD0" />
          <path d="M248 410 C248 410 244 422 272 422 L274 410 Z" fill="#1A5FD0" />

          {/* Torso & Outfit */}
          <path
            d="M220 180 C220 170 270 170 270 180 L262 275 C262 275 245 280 228 275 Z"
            fill="#FFFFFF"
            stroke="#DCE0E6"
            strokeWidth="2"
          />

          {/* Neck & Head */}
          <rect x="240" y="155" width="10" height="20" fill="#FDDAC4" rx="3" />
          <circle cx="245" cy="140" r="22" fill="#FDDAC4" />

          {/* Hair */}
          <path
            d="M225 140 C225 115 265 115 265 140 C265 155 255 160 255 160 C250 148 240 148 235 160 C225 160 225 150 225 140 Z"
            fill="#111A2B"
          />

          {/* Right Arm holding device */}
          <path
            d="M224 185 L200 225 L215 235 L232 200"
            fill="#FFFFFF"
            stroke="#DCE0E6"
            strokeWidth="1.5"
          />
          <path d="M198 222 L192 240" stroke="#FDDAC4" strokeWidth="8" strokeLinecap="round" />

          {/* Left Arm */}
          <path
            d="M266 185 L285 240 L275 245 L258 200"
            fill="#FFFFFF"
            stroke="#DCE0E6"
            strokeWidth="1.5"
          />

          {/* Learning Device / Smart Pad */}
          <rect
            x="175"
            y="200"
            width="28"
            height="46"
            rx="4"
            fill="#111A2B"
            transform="rotate(-15 175 200)"
          />
          <rect
            x="178"
            y="204"
            width="22"
            height="38"
            rx="2"
            fill="#1A5FD0"
            transform="rotate(-15 175 200)"
          />
          {/* Signal beam from device to knowledge graph */}
          <circle cx="186" cy="216" r="3" fill="#FFFFFF" />
        </g>

        {/* Plant / Growth symbol beside learner */}
        <g id="growth-sprout" transform="translate(130, 360)">
          <path
            d="M30 65 C10 50 15 10 30 0 C45 10 50 50 30 65 Z"
            fill="#111A2B"
          />
          <path
            d="M30 65 L30 5"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <circle cx="30" cy="68" r="8" fill="#DCE0E6" />
        </g>
      </svg>
    </Box>
  );
}
