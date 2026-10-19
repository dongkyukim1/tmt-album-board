import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function ThumbUpIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3z" />
      <path d="M7 10l4-7a2.5 2.5 0 0 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7.4a2.7 2.7 0 0 1-2.7 2.3H7" />
    </Base>
  )
}

export function ThumbDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3z" />
      <path d="M17 14l-4 7a2.5 2.5 0 0 1-2.5-2.5V15h-5a2 2 0 0 1-2-2.3l1.2-7.4A2.7 2.7 0 0 1 7.4 3H17" />
    </Base>
  )
}

export function HeartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 20.5s-7.5-4.6-9-9.4C2 7.6 4.2 4.5 7.4 4.5c1.9 0 3.5 1 4.6 2.6 1.1-1.6 2.7-2.6 4.6-2.6 3.2 0 5.4 3.1 4.4 6.6-1.5 4.8-9 9.4-9 9.4z" />
    </Base>
  )
}

export function QuestionIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8" />
      <path d="M12 17h.01" />
    </Base>
  )
}

export function UndoIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </Base>
  )
}

export function QuoteIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M4 18v-5.2C4 8.6 6.3 6 10 5.4v2.3c-1.9.5-2.9 1.7-3 3.5H10V18H4zm10 0v-5.2c0-4.2 2.3-6.8 6-7.4v2.3c-1.9.5-2.9 1.7-3 3.5H20V18h-6z" />
    </svg>
  )
}

export function DiscIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.6" />
    </Base>
  )
}
