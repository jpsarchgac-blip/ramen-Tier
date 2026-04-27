'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { TIER_COLORS } from '@/lib/utils'
import type { TierLevel, TierRating, RamenShop, Member } from '@/types/database'
import HelpTooltip from '@/components/HelpTooltip'

const RadarChart = dynamic(() => import('@/components/RadarChart'), { ssr: false })
const TierDetailModal = dynamic(() => import('@/components/TierDetailModal'), { ssr: false })

interface AvgChart {
  noodle: number | null
  soup: number | null
  toppings: number | null
  wait: number | null
  speed: number | null
  location: number | null
}

interface MemberRating {
  id: string
  tier: TierLevel | null
  score_noodle: number | null
  score_soup: number | null
  score_toppings: number | null
  score_wait: number | null
  score_speed: number | null
  score_location: number | null
  highlights: string[] | null
  comment: string | null
  member: { id: string; display_name: string | null; avatar_url: string | null } | null
}

interface Props {
  org: string
  avgChart: AvgChart
  memberRatings: MemberRating[]
  shop: RamenShop
}

export default function ShopDetailInteractive({ org, avgChart, memberRatings, shop }: Props) {
  const [chartTab, setChartTab] = useState<'ramen' | 'store'>('ramen')
  const [selectedRating, setSelectedRating] = useState<MemberRating | null>(null)

  const ramenData = [
    { subject: '麺', value: avgChart.noodle },
    { subject: '汁', value: avgChart.soup },
    { subject: '具材', value: avgChart.toppings },
  ]
  const storeData = [
    { subject: '並ぶ時間', value: avgChart.wait },
    { subject: '提供速度', value: avgChart.speed },
    { subject: '立地', value: avgChart.location },
  ]

  const hasRamen = ramenData.some(d => d.value !== null)
  const hasStore = storeData.some(d => d.value !== null)
  const hasAny = hasRamen || hasStore

  const currentData = chartTab === 'ramen' ? ramenData : storeData

  return (
    <>
      {/* Community avg radar chart */}
      <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-4">
        <h2 className="font-bold text-[#1C1A16] mb-3 flex items-center gap-2">
          コミュニティ平均チャート
          <HelpTooltip text="コミュニティ全メンバーの麺・汁・具材・並ぶ時間・提供速度・立地スコアの平均値をチャートで可視化したものです。評価した人が多いほど信頼度が上がります。" position="bottom" />
        </h2>
        {!hasAny ? (
          <p className="text-sm text-[#9C9688]">評価データがまだありません</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              {hasRamen && (
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
              {hasStore && (
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
            </div>
            <div className="h-52">
              <RadarChart data={currentData} color="#F2D400" />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {currentData.filter(d => d.value !== null).map(d => (
                <span key={d.subject} className="text-xs text-[#9C9688]">
                  {d.subject}: <strong className="text-[#1C1A16] font-ui">{d.value?.toFixed(1)}</strong>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Member ratings */}
      <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-4">
        <h2 className="font-bold text-[#1C1A16] mb-3 flex items-center gap-2">
          メンバーの評価
          <HelpTooltip text="コミュニティメンバーがこのお店につけたTierを表示します。クリックするとそのメンバーの詳細評価（レーダーチャートや一押しポイント）を確認できます。" position="bottom" />
        </h2>
        {memberRatings.length === 0 ? (
          <p className="text-sm text-[#9C9688]">まだ評価がありません</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {memberRatings.map(r => {
              if (!r.member) return null
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRating(r)}
                  className="flex items-center gap-2 border border-[#E4E0D8] px-3 py-2 hover:border-[#F2D400] transition-colors text-left"
                  style={{ borderLeftWidth: 3, borderLeftColor: r.tier ? TIER_COLORS[r.tier] : '#E4E0D8', borderLeftStyle: 'solid' }}
                >
                  {r.member.avatar_url ? (
                    <Image src={r.member.avatar_url} alt="" width={24} height={24} className="rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#FEFAE0] flex items-center justify-center">
                      <span className="material-symbols-rounded text-[12px] text-[#B8A000]">person</span>
                    </div>
                  )}
                  <span className="text-xs text-[#1C1A16]">{r.member.display_name}</span>
                  {r.tier && (
                    <span className="font-ui font-bold text-xs" style={{ color: TIER_COLORS[r.tier] }}>{r.tier}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Tier detail modal */}
      {selectedRating && selectedRating.member && (
        <TierDetailModal
          rating={{
            id: selectedRating.id,
            member_id: selectedRating.member.id,
            shop_id: shop.id,
            organization_id: shop.organization_id,
            tier: selectedRating.tier,
            score_noodle: selectedRating.score_noodle,
            score_soup: selectedRating.score_soup,
            score_toppings: selectedRating.score_toppings,
            score_wait: selectedRating.score_wait,
            score_speed: selectedRating.score_speed,
            score_location: selectedRating.score_location,
            highlights: selectedRating.highlights,
            comment: selectedRating.comment,
            updated_at: '',
          }}
          shop={shop}
          member={selectedRating.member as unknown as Member}
          org={org}
          onClose={() => setSelectedRating(null)}
        />
      )}
    </>
  )
}
