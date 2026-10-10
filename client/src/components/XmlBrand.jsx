const XmlBrandIcon = ({ size = 100 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AI Data Intelligence Platform logo"
    >
      <defs>
        <linearGradient
          id="xmlNet"
          x1="20"
          y1="20"
          x2="160"
          y2="160"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <radialGradient id="xmlAura">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="90" cy="90" r="80" fill="url(#xmlAura)" />

      <g
        stroke="url(#xmlNet)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M90 79 L47 43 L23 63" />
        <path d="M90 79 L133 43 L156 63" />
        <path d="M90 101 L47 137 L23 117" />
        <path d="M90 101 L133 137 L156 117" />
        <path d="M47 43 L133 43" opacity="0.4" />
        <path d="M47 137 L133 137" opacity="0.4" />
      </g>

      <g fill="#0F172A" stroke="url(#xmlNet)" strokeWidth="2.8">
        <circle cx="47" cy="43" r="7" />
        <circle cx="23" cy="63" r="5" />
        <circle cx="133" cy="43" r="7" />
        <circle cx="156" cy="63" r="5" />
        <circle cx="47" cy="137" r="7" />
        <circle cx="23" cy="117" r="5" />
        <circle cx="133" cy="137" r="7" />
        <circle cx="156" cy="117" r="5" />
      </g>

      <rect
        x="57"
        y="53"
        width="66"
        height="74"
        rx="12"
        fill="#111B34"
        stroke="url(#xmlNet)"
        strokeWidth="2.5"
      />

      <path
        d="M105 53 V70 H123"
        fill="#1E2B4A"
        stroke="url(#xmlNet)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M78 80 L69 90 L78 100" stroke="#60A5FA" strokeWidth="3.5" />
        <path d="M102 80 L111 90 L102 100" stroke="#A78BFA" strokeWidth="3.5" />
        <path d="M96 77 L84 103" stroke="#C4B5FD" strokeWidth="3" />
        <path d="M73 112 H107" stroke="#475569" strokeWidth="2" />
      </g>
    </svg>
  );
};

export default XmlBrandIcon;
