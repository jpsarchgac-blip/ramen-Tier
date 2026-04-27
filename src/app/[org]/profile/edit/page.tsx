'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { RAMEN_TYPES } from '@/lib/utils'
import type { Member, RamenShop } from '@/types/database'
import HelpTooltip from '@/components/HelpTooltip'
import { updateMember } from '@/lib/actions/members'

export default function ProfileEditPage() {
  const router = useRouter()
  const { org } = useParams<{ org: string }>()
  const [member, setMember] = useState<Member | null>(null)
  const [shops, setShops] = useState<RamenShop[]>([])
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [favoriteTypes, setFavoriteTypes] = useState<string[]>([])
  const [favoriteShopId, setFavoriteShopId] = useState<string | null>(null)
  const [tierPublic, setTierPublic] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: org_data } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', org)
        .single()
      if (!org_data) return

      const { data: m } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', org_data.id)
        .single()
      if (!m) return

      setMember(m)
      setDisplayName(m.display_name ?? '')
      setBio(m.bio ?? '')
      setFavoriteTypes(m.favorite_types ?? [])
      setFavoriteShopId(m.favorite_shop_id ?? null)
      setTierPublic(m.tier_public)
      setAvatarUrl(m.avatar_url ?? '')
      setAvatarLoadError(false)

      const { data: myShops } = await supabase
        .from('tier_ratings')
        .select('ramen_shops(id, name)')
        .eq('member_id', m.id)
      setShops((myShops ?? []).map((r: any) => r.ramen_shops).filter(Boolean) as RamenShop[])
    }
    load()
  }, [org])

  const toggleType = (t: string) =>
    setFavoriteTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !member) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const { data } = await supabase.storage
        .from('avatars')
        .upload(`${member.user_id}.${ext}`, file, { upsert: true })
      if (data) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
        setAvatarUrl(urlData.publicUrl)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return
    setSaving(true)
    try {
      const result = await updateMember(org, { displayName, bio, favoriteTypes, favoriteShopId, tierPublic, avatarUrl })
      if (!result.error) {
        router.push(`/${org}/profile/${member?.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!member) return <div className="py-8 text-center text-[#9C9688]">読み込み中...</div>

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-[#1C1A16] text-xl">プロフィール編集</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#9C9688] hover:text-[#1C1A16] flex items-center gap-1"
        >
          <span className="material-symbols-rounded text-[16px]">arrow_back</span>
          戻る
        </button>
      </div>

      <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6">
        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            {(avatarUrl && !avatarLoadError) ? (
              <Image
                src={avatarUrl}
                alt="avatar"
                width={80}
                height={80}
                unoptimized
                className="rounded-full object-cover border-2 border-[#F2D400]"
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#FEFAE0] border-2 border-[#F2D400] flex items-center justify-center">
                <span className="material-symbols-rounded text-[32px] text-[#B8A000]">person</span>
              </div>
            )}
            <label className="cursor-pointer text-sm font-medium text-[#9C9688] hover:text-[#1C1A16] flex items-center gap-1">
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
              required
              className="w-full border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400]"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-1">
              自己紹介 <span className="text-[#9C9688] font-normal text-xs">100文字以内</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={100}
              rows={2}
              className="w-full border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400] resize-none"
            />
          </div>

          {/* Favorite types */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-2">好きなラーメン種類</label>
            <div className="flex flex-wrap gap-2">
              {RAMEN_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
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

          {/* Favorite shop */}
          {shops.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#1C1A16] mb-1">一番好きな店</label>
              <select
                value={favoriteShopId ?? ''}
                onChange={e => setFavoriteShopId(e.target.value || null)}
                className="w-full border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400] bg-[#FFFFFF]"
              >
                <option value="">選択してください</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tier public */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-[#1C1A16]">Tierリストを公開する</p>
                <HelpTooltip text="ONにするとコミュニティの他のメンバーがあなたのTierリストを閲覧できます。OFFにすると自分だけが見られます。" position="right" />
              </div>
              <p className="text-xs text-[#9C9688]">OFFにすると他のメンバーに非表示</p>
            </div>
            <button
              type="button"
              onClick={() => setTierPublic(v => !v)}
              className={`relative w-12 h-6 rounded-full overflow-hidden transition-colors ${tierPublic ? 'bg-[#F2D400]' : 'bg-[#E4E0D8]'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-[#FFFFFF] shadow transition-transform ${tierPublic ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={saving || !displayName.trim()}
            className="w-full bg-[#F2D400] text-[#1C1A16] font-ui font-bold py-3 text-sm hover:bg-[#B8A000] disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </form>
      </div>
    </div>
  )
}
