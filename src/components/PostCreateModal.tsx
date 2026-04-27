'use client'

import { useState, useEffect } from 'react'
import { RAMEN_TYPES } from '@/lib/utils'
import type { RamenShop } from '@/types/database'
import { getMyShops } from '@/lib/actions/shops'
import { createClient } from '@/lib/supabase/client'

interface Props {
  org: string
  onClose: () => void
  onPosted: () => void
}

export default function PostCreateModal({ org, onClose, onPosted }: Props) {
  const [caption, setCaption] = useState('')
  const [ramenType, setRamenType] = useState('')
  const [shopId, setShopId] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [shops, setShops] = useState<RamenShop[]>([])
  const [uploading, setUploading] = useState(false)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    getMyShops(org).then(setShops).catch(() => {})
  }, [org])

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setPosting(true)
    try {
      const supabase = createClient()
      const imageUrls: string[] = []

      if (images.length > 0) {
        setUploading(true)
        const { data: orgData } = await supabase
          .from('organizations').select('id').eq('slug', org).single()
        if (orgData) {
          const postId = crypto.randomUUID()
          for (const file of images.slice(0, 4)) {
            const ext = file.name.split('.').pop() ?? 'jpg'
            const path = `${orgData.id}/${postId}/${crypto.randomUUID()}.${ext}`
            const { data } = await supabase.storage
              .from('post-images')
              .upload(path, file, { contentType: file.type })
            if (data) {
              const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
              imageUrls.push(urlData.publicUrl)
            }
          }
        }
        setUploading(false)
      }

      const res = await fetch(`/api/orgs/${org}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, ramenType, shopId: shopId || null, imageUrls }),
      })
      const result = await res.json()
      if (!result.error) {
        onPosted()
        onClose()
      }
    } finally {
      setPosting(false)
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#FFFFFF] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#E4E0D8]">
          <h2 className="font-bold text-[#1C1A16]">新しい投稿</h2>
          <button onClick={onClose} className="text-[#9C9688] hover:text-[#1C1A16]">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <form onSubmit={handlePost} className="p-4 space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-2">
              写真 <span className="text-[#9C9688] font-normal text-xs">最大4枚</span>
            </label>
            {previews.length > 0 ? (
              <div className="flex gap-2 mb-2 flex-wrap">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="" className="w-20 h-20 object-cover border border-[#E4E0D8]" />
                ))}
              </div>
            ) : null}
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#E4E0D8] p-4 cursor-pointer hover:border-[#F2D400] hover:bg-[#FEFAE0] transition-colors text-[#9C9688]">
              <span className="material-symbols-rounded text-[24px]">photo_camera</span>
              <span className="text-sm">写真を選択</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
          </div>

          {/* Shop */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-1">店舗 <span className="text-[#9C9688] font-normal text-xs">任意</span></label>
            <select
              value={shopId}
              onChange={e => setShopId(e.target.value)}
              className="w-full border border-[#E4E0D8] px-3 py-2 text-sm bg-[#FFFFFF] outline-none focus:border-[#F2D400]"
            >
              <option value="">選択してください</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Ramen type */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-2">ラーメン種類 <span className="text-[#9C9688] font-normal text-xs">任意</span></label>
            <div className="flex flex-wrap gap-2">
              {RAMEN_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRamenType(r => r === t ? '' : t)}
                  className={`px-2.5 py-1 text-xs border transition-colors ${
                    ramenType === t
                      ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16] font-medium'
                      : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-[#1C1A16] mb-1">コメント</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={3}
              placeholder="今日のラーメン..."
              className="w-full border border-[#E4E0D8] px-3 py-2 text-sm outline-none focus:border-[#F2D400] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={posting || (!caption.trim() && images.length === 0)}
            className="w-full bg-[#F2D400] text-[#1C1A16] font-ui font-bold py-3 text-sm hover:bg-[#B8A000] disabled:opacity-50"
          >
            {uploading ? '画像アップロード中...' : posting ? '投稿中...' : '投稿する'}
          </button>
        </form>
      </div>
    </div>
  )
}
