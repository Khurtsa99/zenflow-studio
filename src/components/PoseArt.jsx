// Ангийн төрлийн дүрслэл (зураг оруулаагүй үед харагдана)
export default function PoseArt({ pose = 'seated', color = '#0E1B33', className = '' }) {
  const art = {
    seated: (
      <>
        <circle cx="200" cy="92" r="24" fill={color} stroke="none" />
        <path d="M200 128 L200 192" />
        <path d="M200 146 L166 182 L156 208" />
        <path d="M200 146 L234 182 L244 208" />
        <path d="M136 218 Q200 176 264 218 Q200 240 136 218 Z" fill={color} fillOpacity=".18" />
      </>
    ),
    warrior: (
      <>
        <circle cx="200" cy="66" r="24" fill={color} stroke="none" />
        <path d="M200 100 L200 170" />
        <path d="M122 118 L278 118" />
        <path d="M200 170 L264 206 L270 254" />
        <path d="M200 170 L132 254" />
      </>
    ),
    plank: (
      <>
        <circle cx="106" cy="158" r="22" fill={color} stroke="none" />
        <path d="M135 172 L300 205" />
        <path d="M168 180 L168 252" />
        <path d="M300 205 L324 252" />
      </>
    ),
    jump: (
      <>
        <circle cx="200" cy="58" r="24" fill={color} stroke="none" />
        <path d="M200 92 L200 160" />
        <path d="M200 108 L152 50" />
        <path d="M200 108 L248 50" />
        <path d="M200 160 L160 238" />
        <path d="M200 160 L240 238" />
      </>
    ),
    legraise: (
      <>
        <circle cx="94" cy="234" r="22" fill={color} stroke="none" />
        <path d="M122 249 L250 249" />
        <path d="M250 249 L292 138" />
        <path d="M250 249 L338 196" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden="true">
      <line x1="60" y1="262" x2="340" y2="262" stroke={color} strokeOpacity=".25" strokeWidth="6" strokeLinecap="round" />
      <g stroke={color} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {art[pose] ?? art.seated}
      </g>
    </svg>
  )
}
