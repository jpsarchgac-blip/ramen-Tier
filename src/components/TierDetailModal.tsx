'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { TIER_COLORS, TIER_BG_CLASSES, TIER_TEXT_CLASSES, getGoogleMapsUrl } from '@/lib/utils'
import type { TierRating, RamenShop, Member, TierLevel } from '@/types/database'
import HelpTooltip from '@/components/HelpTooltip'

const RadarChart = dynamic(() => import('./RadarChart'), { ssr: false })

interface TierDetailModalProps {
  rating: TierRating
  shop: RamenShop
  member?: Member
  org: string
  isOwn?: boolean
  onClose: () => void
}

export default function TierDetailModal({ rating, shop, member, org, isOwn, onClose }: TierDetailModalProps) {
  const [chartTab, setChartTab] = useState<'ramen' | 'store'>('ramen')

  const ramenData = [
    { subject: '麺', value: rating.score_noodle },
    { subject: '汁', value: rating.score_soup },
    { subject: '具材', value: rating.score_toppings },
  ]
  const storeData = [
    { subject: '並ぶ時間', value: rating.score_wait },
    { subject: '提供速度', value: rating.score_speed },
    { subject: '立地', value: rating.score_location },
  ]

  const hasRamenData = ramenData.some(d => d.value !== null)
  const hasStoreData = storeData.some(d => d.value !== null)
  const mapsUrl = getGoogleMapsUrl(shop.google_place_id, shop.name, shop.address)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#FFFFFF] w-full sm:max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-[#E4E0D8]">
          <div>
            <h2 className="font-bold text-[#1C1A16] text-base">{shop.name}</h2>
            {rating.tier && (
              <span
                className={`inline-block font-ui font-bold text-xs px-2 py-0.5 mt-1 ${TIER_BG_CLASSES[rating.tier as TierLevel]} ${TIER_TEXT_CLASSES[rating.tier as TierLevel]}`}
              >
                {member ? `${member.display_name}のTier: ` : '自分のTier: '}{rating.tier}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-[#9C9688] hover:text-[#1C1A16] p-1">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        {/* Radar chart */}
        {(hasRamenData || hasStoreData) && (
          <div className="p-4 border-b border-[#E4E0D8]">
            <div className="flex items-center gap-2 mb-3">
              {hasRamenData && (
                <button
                  onClick={() => setChartTab('ramen')}
                  className={`text-xs px-3 py-1.5 font-ui font-medium border transition-colors ${
                    chartTab === 'ramen'
                      ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16]'
                      : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688]'
                  }`}
                >
                  ラーメンチャート
                </button>
              )}
              {hasStoreData && (
                <button
                  onClick={() => setChartTab('store')}
                  className={`text-xs px-3 py-1.5 font-ui font-medium border transition-colors ${
                    chartTab === 'store'
                      ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16]'
                      : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688]'
                  }`}
                >
                  店チャート
                </button>
              )}
              <HelpTooltip text="ラーメンチャートは麺・汁・具材、店チャートは並ぶ時間・提供速度・立地を0〜10点で評価したレーダーチャートです。" position="right" />
            </div>
            <div className="h-48">
              <RadarChart
                data={chartTab === 'ramen' ? ramenData : storeData}
                color={rating.tier ? TIER_COLORS[rating.tier as TierLevel] : '#F2D400'}
              />
            </div>
            {/* Score labels */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {(chartTab === 'ramen' ? ramenData : storeData)
                .filter(d => d.value !== null)
                .map(d => (
                  <span key={d.subject} className="text-xs text-[#9C9688]">
                    {d.subject}: <strong className="text-[#1C1A16] font-ui">{d.value?.toFixed(1)}</strong>
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Highlights & Comment */}
        <div className="p-4 space-y-3">
          {(rating.highlights?.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className="text-xs text-[#9C9688]">一押しポイント</p>
                <HelpTooltip text="評価者がこのお店で特に良かったと感じたポイントです。複数のメンバーが同じポイントを選んでいるほど信頼度が高まります。" position="right" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rating.highlights?.map(h => (
                  <span key={h} className="bg-[#FEFAE0] border border-[#F2D400] text-[#1C1A16] text-xs px-2 py-0.5">
                    🏷 {h}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rating.comment && (
            <div>
              <p className="text-xs text-[#9C9688] mb-1">コメント</p>
              <p className="text-sm text-[#1C1A16] leading-relaxed">「{rating.comment}」</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#E4E0D8] flex items-center gap-2">
          <Link
            href={`/${org}/shops/${shop.id}`}
            onClick={onClose}
            className="flex-1 text-center text-sm font-ui font-medium text-[#1C1A16] border border-[#E4E0D8] py-2 hover:bg-[#F7F5F0] transition-colors flex items-center justify-center gap-1"
          >
            店舗詳細を見る
            <span className="material-symbols-rounded text-[14px]">chevron_right</span>
          </Link>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-ui font-medium text-[#1C1A16] border border-[#E4E0D8] px-3 py-2 hover:bg-[#F7F5F0] transition-colors"
          >
            <span className="material-symbols-rounded text-[16px]">place</span>
            Google Maps
          </a>
          {member && (
            <Link
              href={`/${org}/profile/${member.id}`}
              onClick={onClose}
              className="flex items-center gap-1 text-sm font-ui font-medium text-[#9C9688] border border-[#E4E0D8] px-3 py-2 hover:bg-[#F7F5F0] transition-colors"
            >
              <span className="material-symbols-rounded text-[16px]">person</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
