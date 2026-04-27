'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TIER_LEVELS, TIER_COLORS, getGoogleMapsUrl } from '@/lib/utils'
import type { TierLevel, TierRatingWithShop, RamenShop } from '@/types/database'
import dynamic from 'next/dynamic'
import HelpTooltip from '@/components/HelpTooltip'
import { upsertTier, deleteTier, getMyTiers } from '@/lib/actions/tiers'

const TIER_HELP: Record<string, string> = {
  S: '殿堂入り・また絶対行く。コミュニティで最高評価のお店です。迷ったらここへ行けば間違いなし！',
  A: 'かなり好き・おすすめできる。自信を持って人に勧められる優秀なお店です。',
  B: '普通においしい。外れではないが特筆するほどでもない、安定した評価のお店です。',
  C: 'まあまあ・好みが分かれる。人によって評価が割れるお店。好みに合えば刺さります。',
  D: '自分には合わなかった。味の好みが合わなかったお店。他のメンバーには合うかもしれません。',
}

const TierDetailModal = dynamic(() => import('@/components/TierDetailModal'), { ssr: false })
const ShopAddModal = dynamic(() => import('@/components/ShopAddModal'), { ssr: false })

interface TierClientProps {
  org: string
  initialRatings: (TierRatingWithShop & { ramen_shops: RamenShop })[]
  memberId: string
}

export default function TierClient({ org, initialRatings, memberId }: TierClientProps) {
  const [ratings, setRatings] = useState(initialRatings)
  const [selectedRating, setSelectedRating] = useState<TierRatingWithShop | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOverTier, setDragOverTier] = useState<TierLevel | null>(null)

  const grouped = TIER_LEVELS.reduce((acc, tier) => {
    acc[tier] = ratings.filter(r => r.tier === tier && r.ramen_shops != null)
    return acc
  }, {} as Record<TierLevel, typeof ratings>)

  const handleDragStart = (ratingId: string) => setDragging(ratingId)
  const handleDragEnd = () => { setDragging(null); setDragOverTier(null) }

  const handleDrop = async (newTier: TierLevel) => {
    if (!dragging || !newTier) return
    const rating = ratings.find(r => r.id === dragging)
    if (!rating || rating.tier === newTier) { setDragging(null); setDragOverTier(null); return }

    setRatings(prev => prev.map(r => r.id === dragging ? { ...r, tier: newTier } : r))
    setDragging(null)
    setDragOverTier(null)

    await upsertTier(org, { shopId: rating.shop_id, tier: newTier })
  }

  const handleDelete = async (ratingId: string, shopId: string) => {
    if (!confirm('このTier評価を削除しますか？')) return
    const backup = ratings
    setRatings(prev => prev.filter(r => r.id !== ratingId))
    const result = await deleteTier(org, shopId)
    if (result.error) {
      setRatings(backup)
      alert(`削除に失敗しました: ${result.error}`)
    }
  }

  const handleRefresh = async () => {
    const data = await getMyTiers(org)
    setRatings(data as any)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-[#1C1A16] text-xl">自分のTierリスト</h1>
          <HelpTooltip
            text="S〜Dの5段階でラーメン屋を格付けするリストです。カードをドラッグ&ドロップでTier間を移動できます。カードをクリックすると詳細な評価を確認できます。"
            position="bottom"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#F2D400] text-[#1C1A16] font-ui font-semibold text-sm px-4 py-2 hover:bg-[#B8A000] transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-rounded text-[18px]">add</span>
          店を追加
        </button>
      </div>

      {/* Tier list */}
      <div className="space-y-4">
        {TIER_LEVELS.map(tier => (
          <div
            key={tier}
            className={`border transition-all ${
              dragOverTier === tier
                ? 'border-[#F2D400] bg-[#FEFAE0]'
                : 'border-[#E4E0D8] bg-[#FFFFFF]'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOverTier(tier) }}
            onDrop={() => handleDrop(tier)}
            onDragLeave={() => setDragOverTier(null)}
          >
            {/* Tier header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-[#E4E0D8]"
              style={{ borderLeftWidth: 4, borderLeftColor: TIER_COLORS[tier], borderLeftStyle: 'solid' }}
            >
              <span className="font-ui font-bold text-xl" style={{ color: TIER_COLORS[tier] }}>{tier}</span>
              <span className="text-xs text-[#9C9688]">{grouped[tier].length}店</span>
              <HelpTooltip
                text={TIER_HELP[tier]}
                position="right"
              />
            </div>

            {/* Shop cards */}
            <div className="p-2">
              {grouped[tier].length === 0 && (
                <div className="py-4 text-center text-[#9C9688] text-sm">
                  ドラッグして店舗を移動できます
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {grouped[tier].map(rating => {
                  const shop = rating.ramen_shops
                  const mapsUrl = getGoogleMapsUrl(shop.google_place_id, shop.name, shop.address)
                  return (
                    <div
                      key={rating.id}
                      draggable
                      onDragStart={() => handleDragStart(rating.id)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 bg-[#F7F5F0] border border-[#E4E0D8] p-2 cursor-grab active:cursor-grabbing transition-all ${
                        dragging === rating.id ? 'opacity-50 scale-105 shadow-lg' : 'hover:border-[#F2D400]'
                      }`}
                    >
                      <span className="material-symbols-rounded text-[14px] text-[#9C9688]">drag_indicator</span>
                      {shop.photo_url ? (
                        <Image src={shop.photo_url} alt={shop.name} width={40} height={40} className="object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center" style={{ background: TIER_COLORS[tier] }}>
                          <span className="text-white text-xs font-bold">{shop.name[0]}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <button
                          onClick={() => setSelectedRating(rating)}
                          className="text-sm font-medium text-[#1C1A16] hover:text-[#F2D400] truncate text-left block max-w-32"
                          title={shop.name}
                        >
                          {shop.name}
                        </button>
                        <div className="flex items-center gap-1 mt-0.5">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[#9C9688] hover:text-[#1C1A16]"
                            title="Google Maps"
                          >
                            <span className="material-symbols-rounded text-[12px]">place</span>
                          </a>
                          <Link
                            href={`/${org}/shops/${shop.id}`}
                            className="text-[#9C9688] hover:text-[#1C1A16]"
                            title="店舗詳細"
                          >
                            <span className="material-symbols-rounded text-[12px]">open_in_new</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(rating.id, shop.id)}
                            className="text-[#9C9688] hover:text-[#E8593C] ml-1"
                            title="削除"
                          >
                            <span className="material-symbols-rounded text-[12px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tier detail modal */}
      {selectedRating && (
        <TierDetailModal
          rating={selectedRating}
          shop={selectedRating.ramen_shops}
          org={org}
          isOwn
          onClose={() => setSelectedRating(null)}
        />
      )}

      {/* Shop add modal */}
      {showAddModal && (
        <ShopAddModal
          org={org}
          onClose={() => setShowAddModal(false)}
          onSaved={handleRefresh}
        />
      )}
    </>
  )
}
