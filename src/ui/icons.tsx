/** Monochrome inline icons per design spec (no emoji). */
const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const IconExpand = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" {...{ style: { display: 'block' } }}>
    <g {...p}>
      <path d="M11.5 3.5h5v5" />
      <path d="M8.5 16.5h-5v-5" />
      <path d="M16.5 3.5 11 9" />
      <path d="M3.5 16.5 9 11" />
    </g>
  </svg>
)

export const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" style={{ display: 'block' }}>
    <g {...p}>
      <path d="M10 3v9" />
      <path d="m6 8.5 4 4 4-4" />
      <path d="M3.5 16.5h13" />
    </g>
  </svg>
)

export const IconChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" style={{ display: 'block' }}>
    <g {...p}>
      <path d="m2.5 4 3.5 4 3.5-4" />
    </g>
  </svg>
)

export const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" style={{ display: 'block' }}>
    <g {...p} strokeWidth={1.3}>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 7.2v3.6" />
      <path d="M8 5v.1" />
    </g>
  </svg>
)

export const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ display: 'block' }}>
    <g {...p}>
      <path d="M8 2.5v11" />
      <path d="M2.5 8h11" />
    </g>
  </svg>
)

export const IconRedo = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" style={{ display: 'block' }}>
    <g {...p}>
      <path d="M4 10a6 6 0 1 1 1.8 4.3" />
      <path d="M4 15v-4.5h4.5" />
    </g>
  </svg>
)

export const IconVideo = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" style={{ display: 'block' }}>
    <g {...p}>
      <rect x="2.5" y="5" width="10" height="10" rx="2" />
      <path d="m12.5 9 5-2.8v7.6l-5-2.8" />
    </g>
  </svg>
)

export const IconCard = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" style={{ display: 'block' }}>
    <g {...p}>
      <rect x="3" y="3" width="14" height="14" rx="3" />
      <path d="M10 7v6M7 10h6" />
    </g>
  </svg>
)
