'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TIER_COLORS, TIER_LEVELS, RAMEN_TYPES } from '@/lib/utils'
import type { TierLevel } from '@/types/database'
import HelpTooltip from '@/components/HelpTooltip'

interface ShopStat {
  shopId: string
  name: string
  photo_url: string | null
  place_id: string | null
  address: string | null
  ramen_type: string[] | null
  tiers: Record<TierLevel, number>
  total: number
}

interface RecentPost {
  id: string
  image_urls: string[] | null
  memberName: string | null
  shopName: string | null
}

interface Props {
  org: string
  shopStats: ShopStat[]
  members: { id: string; display_name: string | null; avatar_url: string | null }[]
  recentPosts: RecentPost[]
  myMemberId: string | null
}

export default function DashboardClient({ org, shopStats, members, recentPosts, myMemberId }: Props) {
  const [filter, setFilter] = useState<string | null>(null)

  const filtered = filter
    ? shopStats.filter(s => s.ramen_type?.includes(filter))
    : shopStats

  const topShops = filtered.slice(0, 5)
  const topThree = filtered.slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Ramen type filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 text-xs font-ui font-medium border transition-colors ${
            filter === null
              ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16]'
              : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688] hover:border-[#F2D400]'
          }`}
        >
          すべて
        </button>
        {RAMEN_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(f => f === t ? null : t)}
            className={`px-3 py-1 text-xs font-ui font-medium border transition-colors ${
              filter === t
                ? 'bg-[#F2D400] border-[#B8A000] text-[#1C1A16]'
                : 'bg-[#FFFFFF] border-[#E4E0D8] text-[#9C9688] hover:border-[#F2D400]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Top 5 */}
      <section>
        <h2 className="font-bold text-[#1C1A16] text-lg mb-3 flex items-center gap-2">
          <span className="material-symbols-rounded text-[#F2D400]">star</span>
          コミュニティの人気ラーメン屋 TOP5
          <HelpTooltip text="コミュニティ全メンバーのTier評価をもとに、S評価が多い順でランキングされたお店のTOP5です。" position="bottom" />
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {topShops.length === 0 && (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative flex-none w-36 h-44 border border-dashed border-[#E4E0D8] bg-[#FFFFFF] flex flex-col items-center justify-center gap-1">
                <span className="material-symbols-rounded text-[28px] text-[#E4E0D8]">ramen_dining</span>
                <span className="text-[10px] text-[#E4E0D8] font-ui">#{i + 1}</span>
              </div>
            ))
          )}
          {topShops.map((shop, i) => (
            <Link
              key={shop.shopId}
              href={`/${org}/shops/${shop.shopId}`}
              className="relative flex-none w-36 h-44 overflow-hidden border border-[#E4E0D8] block group"
            >
              {shop.photo_url ? (
                <Image src={shop.photo_url} alt={shop.name} fill className="object-cover group-hover:scale-105 transition-transform" sizes="144px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: TIER_COLORS[(['S', 'A', 'B', 'C', 'D'] as TierLevel[])[i]] }}>
                  <span className="text-white text-2xl">🍜</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="font-ui font-bold text-white text-xs mb-0.5">#{i + 1}</div>
                <div className="text-white text-xs font-medium leading-tight truncate">{shop.name}</div>
                {shop.ramen_type && shop.ramen_type.length > 0 && (
                  <div className="text-white/70 text-[10px] truncate">{shop.ramen_type.join('・')}</div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-ui font-bold text-[10px] px-1.5 py-0.5" style={{ background: TIER_COLORS.S, color: '#fff' }}>S</span>
                  <span className="text-white text-[10px]">{shop.tiers.S}人</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tier distribution chart */}
      <section>
        <h2 className="font-bold text-[#1C1A16] text-lg mb-3 flex items-center gap-2">
          評価分布
          <HelpTooltip text="人気TOP3のお店について、S〜Dの各Tier評価に何人がつけたかを棒グラフで表示します。コミュニティの評価傾向が一目でわかります。" position="bottom" />
        </h2>
        <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-4">
          {topThree.length === 0 ? (
            <p className="text-sm text-[#9C9688] text-center py-2">まだ評価データがありません。Tierでラーメン屋を追加してみましょう！</p>
          ) : (
            topThree.map(shop => (
              <div key={shop.shopId} className="mb-4 last:mb-0">
                <Link href={`/${org}/shops/${shop.shopId}`} className="text-sm font-medium text-[#1C1A16] mb-2 truncate hover:text-[#F2D400] block">{shop.name}</Link>
                <div className="space-y-1">
                  {TIER_LEVELS.map(tier => {
                    const count = shop.tiers[tier]
                    const max = Math.max(...Object.values(shop.tiers), 1)
                    return (
                      <div key={tier} className="flex items-center gap-2">
                        <span className="font-ui font-bold text-xs w-4 text-center" style={{ color: TIER_COLORS[tier] }}>{tier}</span>
                        <div className="flex-1 bg-[#F7F5F0] h-4 overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${(count / max) * 100}%`, background: TIER_COLORS[tier] }}
                          />
                        </div>
                        <span className="text-xs text-[#9C9688] w-8 text-right font-ui">{count}人</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Members */}
      <section>
        <h2 className="font-bold text-[#1C1A16] text-lg mb-3 flex items-center gap-2">
          コミュニティメンバー ({members.length}人)
          <HelpTooltip text="このコミュニティに参加しているメンバーの一覧です。アイコンをクリックするとプロフィールとTierリストを確認できます。" position="bottom" />
        </h2>
        <div className="flex flex-wrap gap-3">
          {members.map(member => (
            <Link
              key={member.id}
              href={`/${org}/profile/${member.id}`}
              className="flex flex-col items-center gap-1 group"
              title={member.display_name ?? ''}
            >
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={member.display_name ?? ''}
                  width={48}
                  height={48}
                  className="rounded-full object-cover border-2 border-transparent group-hover:border-[#F2D400] transition-all"
                  style={{ boxShadow: member.id === myMemberId ? '0 0 0 3px #F2D400' : undefined }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#FEFAE0] border-2 border-transparent group-hover:border-[#F2D400] flex items-center justify-center transition-all">
                  <span className="material-symbols-rounded text-[20px] text-[#B8A000]">person</span>
                </div>
              )}
              <span className="text-[10px] text-[#9C9688] text-center max-w-[48px] truncate">{member.display_name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1C1A16] text-lg">最近の投稿</h2>
            <Link href={`/${org}/feed`} className="text-sm text-[#9C9688] hover:text-[#1C1A16] font-ui flex items-center gap-1">
              フィードを見る
              <span className="material-symbols-rounded text-[16px]">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentPosts.map(post => (
              <Link key={post.id} href={`/${org}/feed/${post.id}`} className="block group">
                <div className="relative aspect-square bg-[#F7F5F0] border border-[#E4E0D8] overflow-hidden mb-1">
                  {post.image_urls?.[0] ? (
                    <Image src={post.image_urls[0]} alt="" fill className="object-cover group-hover:scale-105 transition-transform" sizes="(max-width: 640px) 50vw, 25vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">🍜</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-[#9C9688] truncate">{post.memberName} · {post.shopName ?? '店舗なし'}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
