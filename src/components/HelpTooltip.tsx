'use client'

import { useState, useRef, useEffect } from 'react'

interface HelpTooltipProps {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function HelpTooltip({ text, position = 'top' }: HelpTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const posClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position]

  const arrowClass = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1C1A16] border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1C1A16] border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1C1A16] border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1C1A16] border-y-transparent border-l-transparent border-4',
  }[position]

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-[#E4E0D8] text-[#9C9688] hover:bg-[#F2D400] hover:text-[#1C1A16] flex items-center justify-center text-[10px] font-ui font-bold transition-colors shrink-0 leading-none"
        aria-label="説明を表示"
      >
        ?
      </button>
      {open && (
        <div
          className={`absolute z-50 w-56 ${posClass}`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="bg-[#1C1A16] text-white text-xs leading-relaxed px-3 py-2 shadow-lg">
            {text}
          </div>
          <div className={`absolute ${arrowClass} w-0 h-0`} />
        </div>
      )}
    </div>
  )
}
