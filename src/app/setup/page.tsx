'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RAMEN_TYPES } from '@/lib/utils'
import { setupUser } from '@/lib/actions/setup'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [favoriteTypes, setFavoriteTypes] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Check if already done
      const { data: member } = await supabase
        .from('members')
        .select('is_setup_done, display_name, avatar_url, organizations(slug)')
        .eq('user_id', user.id)
        .single()

      if (member?.is_setup_done) {
        const slug = (member.organizations as unknown as { slug: string } | null)?.slug
        router.push(`/${slug}/dashboard`)
        return
      }

      setDisplayName(member?.display_name ?? user.user_metadata?.full_name ?? '')
      setAvatarUrl(member?.avatar_url ?? user.user_metadata?.avatar_url ?? '')
    }
    loadUser()
  }, [router])

  const toggleType = (t: string) =>
    setFavoriteTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ext = file.name.split('.').pop()
      const { data } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}.${ext}`, file, { upsert: true })
      if (data) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
        setAvatarUrl(urlData.publicUrl)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return
    setLoading(true)
    try {
      const result = await setupUser({ displayName, bio, favoriteTypes, avatarUrl })
      if (result.orgSlug) {
        router.push(`/${result.orgSlug}/dashboard`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center px-4 py-8">
      <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🍜</div>
          <h1 className="font-display text-[#1C1A16] text-xl font-bold mb-1">ラーメンTier へようこそ！</h1>
          <p className="text-[#9C9688] text-sm">まず、プロフィールを設定してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[#F2D400]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#FEFAE0] border-2 border-[#F2D400] flex items-center justify-center">
                  <span className="material-symbols-rounded text-[32px] text-[#B8A000]">person</span>
                </div>
              )}
            </div>
            <label className="cursor-pointer text-sm font-ui font-medium text-[#9C9688] hover:text-[#1C1A16] flex items-center gap-1">
              <span className="material-symbols-rounded text-[16px]">photo_camera</span>
              {uploading ? 'アップロード中...' : '画像を変更する'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-1">表示名 <span className="text-[#E8593C]">*</span></label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="田中 太郎"
              required
              className="w-full border border-[#E4E0D8] px-3 py-2 text-sm text-[#1C1A16] bg-[#FFFFFF] outline-none focus:border-[#F2D400]"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-1">
              自己紹介 <span className="text-[#9C9688] font-normal text-xs">任意・50文字程度</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={100}
              placeholder="ラーメン大好きエンジニア"
              rows={2}
              className="w-full border border-[#E4E0D8] px-3 py-2 text-sm text-[#1C1A16] bg-[#FFFFFF] outline-none focus:border-[#F2D400] resize-none"
            />
          </div>

          {/* Favorite types */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-2">好きなラーメンの種類</label>
            <div className="flex flex-wrap gap-2">
              {RAMEN_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 text-sm border transition-colors ${
                    favoriteTypes.includes(t)
                      ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16] font-medium'
                      : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688] hover:border-[#F2D400]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !displayName.trim()}
            className="w-full bg-[#F2D400] text-[#1C1A16] font-ui font-bold py-3 text-sm hover:bg-[#B8A000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '設定中...' : 'はじめる'}
          </button>
        </form>
      </div>
    </div>
  )
}
