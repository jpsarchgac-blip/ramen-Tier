'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface Props {
  org: string
  orgId: string
  initialBgmUrl: string | null
  initialEnabled: boolean
  initialVolume: number
}

export default function SoundsClient({ org, orgId, initialBgmUrl, initialEnabled, initialVolume }: Props) {
  const [bgmUrl, setBgmUrl] = useState(initialBgmUrl)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [volume, setVolume] = useState(initialVolume)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズは10MB以内にしてください')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/orgs/${org}/settings/sounds/upload`, { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setBgmUrl(data.url)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/orgs/${org}/settings/sounds`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bgmUrl, bgmEnabled: enabled, bgmVolume: volume }),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('BGMを削除しますか？')) return
    setDeleting(true)
    try {
      await fetch(`/api/orgs/${org}/settings/sounds`, { method: 'DELETE' })
      setBgmUrl(null)
      setEnabled(false)
      if (audioRef.current) { audioRef.current.pause(); setPreviewPlaying(false) }
    } finally {
      setDeleting(false)
    }
  }

  const togglePreview = () => {
    if (!bgmUrl) return
    if (!audioRef.current) {
      audioRef.current = new Audio(bgmUrl)
      audioRef.current.loop = true
    }
    if (previewPlaying) {
      audioRef.current.pause()
      setPreviewPlaying(false)
    } else {
      audioRef.current.volume = volume / 100
      audioRef.current.play()
      setPreviewPlaying(true)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${org}/settings`} className="text-[#9C9688] hover:text-[#1C1A16]">
          <span className="material-symbols-rounded text-[20px]">arrow_back</span>
        </Link>
        <h1 className="font-bold text-[#1C1A16] text-xl">BGM管理</h1>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-5 space-y-5">
        {/* Current BGM */}
        <div>
          <p className="text-sm font-medium text-[#1C1A16] mb-2">現在のBGM</p>
          {bgmUrl ? (
            <div className="flex items-center gap-3 bg-[#F7F5F0] border border-[#E4E0D8] px-3 py-2">
              <span className="material-symbols-rounded text-[20px] text-[#F2D400]">music_note</span>
              <span className="text-sm text-[#1C1A16] flex-1 truncate">BGMファイル登録済み</span>
              <button
                onClick={togglePreview}
                className="text-[#9C9688] hover:text-[#1C1A16] text-xs font-ui"
              >
                {previewPlaying ? '停止' : '試聴'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[#E8593C] hover:opacity-70 text-xs font-ui disabled:opacity-50"
              >
                削除
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#9C9688]">BGMが設定されていません</p>
          )}
        </div>

        {/* Upload */}
        <div>
          <p className="text-sm font-medium text-[#1C1A16] mb-1">BGMをアップロード</p>
          <p className="text-xs text-[#9C9688] mb-2">mp3 / m4a / wav（最大10MB）· 著作権フリー音源のみ</p>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#E4E0D8] p-4 cursor-pointer hover:border-[#F2D400] hover:bg-[#FEFAE0] transition-colors text-[#9C9688]">
            <span className="material-symbols-rounded text-[20px]">upload</span>
            <span className="text-sm">{uploading ? 'アップロード中...' : 'ファイルを選択'}</span>
            <input
              type="file"
              accept="audio/mp3,audio/mpeg,audio/m4a,audio/wav"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-[#9C9688] mt-1">
            著作権フリー音源: <a href="https://dova-s.jp/" target="_blank" rel="noopener noreferrer" className="underline">DOVA-SYNDROME</a> など
          </p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1C1A16]">BGMを有効にする</p>
            <p className="text-xs text-[#9C9688]">フィードページで自動再生（ブラウザ制限あり）</p>
          </div>
          <button
            onClick={() => setEnabled(v => !v)}
            disabled={!bgmUrl}
            className={`relative w-12 h-6 transition-colors disabled:opacity-40 ${enabled && bgmUrl ? 'bg-[#F2D400]' : 'bg-[#E4E0D8]'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-[#FFFFFF] transition-transform ${enabled && bgmUrl ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Volume */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-[#1C1A16]">デフォルト音量</p>
            <span className="font-ui text-sm text-[#9C9688]">{volume}%</span>
          </div>
          <input
            type="range"
            min={0} max={100} step={5}
            value={volume}
            onChange={e => {
              const v = parseInt(e.target.value)
              setVolume(v)
              if (audioRef.current) audioRef.current.volume = v / 100
            }}
            className="w-full"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#F2D400] text-[#1C1A16] font-ui font-bold py-3 text-sm hover:bg-[#B8A000] disabled:opacity-50"
        >
          {saving ? '保存中...' : '設定を保存する'}
        </button>
      </div>
    </div>
  )
}
