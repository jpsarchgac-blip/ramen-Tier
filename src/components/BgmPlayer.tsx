'use client'

import { useEffect, useRef, useState } from 'react'
import HelpTooltip from '@/components/HelpTooltip'

interface BgmPlayerProps {
  bgmUrl: string
  defaultVolume?: number
}

export default function BgmPlayer({ bgmUrl, defaultVolume = 50 }: BgmPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume / 100)
  const [interacted, setInteracted] = useState(false)

  useEffect(() => {
    const audio = new Audio(bgmUrl)
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio
    return () => { audio.pause(); audioRef.current = null }
  }, [bgmUrl])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const toggle = () => {
    if (!audioRef.current) return
    setInteracted(true)
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().catch(() => {})
      setPlaying(true)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-[#FFFFFF] border border-[#E4E0D8] shadow-lg px-3 py-2">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-sm font-ui font-medium text-[#1C1A16] hover:text-[#F2D400]"
        title={playing ? 'BGMをミュート' : 'BGMを再生'}
      >
        <span className="material-symbols-rounded text-[20px]">
          {playing ? 'music_note' : 'music_off'}
        </span>
        <span className="text-xs hidden sm:inline">{playing ? 'BGM ON' : 'BGM OFF'}</span>
      </button>
      <HelpTooltip text="フィードページで流れるBGMです。クリックして再生・停止を切り替えられます。音量スライダーで調整も可能です。" position="top" />
      {playing && (
        <input
          type="range"
          min={0} max={1} step={0.05}
          value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))}
          className="w-16"
          title="音量"
        />
      )}
      {!interacted && (
        <span className="text-xs text-[#9C9688]">クリックで再生</span>
      )}
    </div>
  )
}
