import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TIER_COLORS, TIER_LEVELS, getGoogleMapsUrl } from '@/lib/utils'
import type { TierLevel } from '@/types/database'
import HelpTooltip from '@/components/HelpTooltip'

export default async function DashboardPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', org)
    .single()

  if (!organization) return <div>組織が見つかりません</div>

  // Members list
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('organization_id', organization.id)
    .order('joined_at', { ascending: true })

  // Community tier distribution with shop data
  const { data: tierData } = await supabase
    .from('tier_ratings')
    .select('tier, shop_id, ramen_shops(id, name, photo_url, google_place_id, address)')
    .eq('organization_id', organization.id)

  // Compute top 5 shops by S-tier count
  const shopStats: Record<string, { name: string; photo_url: string | null; place_id: string | null; address: string | null; tiers: Record<TierLevel, number>; total: number }> = {}
  for (const r of tierData ?? []) {
    const shop = r.ramen_shops as unknown as { id: string; name: string; photo_url: string | null; google_place_id: string | null; address: string | null } | null
    if (!shop || !r.tier) continue
    if (!shopStats[shop.id]) {
      shopStats[shop.id] = { name: shop.name, photo_url: shop.photo_url, place_id: shop.google_place_id, address: shop.address, tiers: { S: 0, A: 0, B: 0, C: 0, D: 0 }, total: 0 }
    }
    shopStats[shop.id].tiers[r.tier as TierLevel]++
    shopStats[shop.id].total++
  }

  const topShops = Object.entries(shopStats)
    .sort(([, a], [, b]) => (b.tiers.S - a.tiers.S) || (b.total - a.total))
    .slice(0, 5)

  // Recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*, members(display_name, avatar_url), ramen_shops(name)')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })
    .limit(4)

  // My member
  const myMember = members?.find(m => m.user_id === user?.id)

  return (
    <div className="space-y-8">
      {/* Top 5 */}
      <section>
        <h2 className="font-bold text-[#1C1A16] text-lg mb-3 flex items-center gap-2">
          <span className="material-symbols-rounded text-[#F2D400]">star</span>
          コミュニティの人気ラーメン屋 TOP5
          <HelpTooltip text="コミュニティ全メンバーのTier評価をもとに、S評価が多い順でランキングされたお店のTOP5です。" position="bottom" />
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {topShops.length === 0 && (
            <p className="text-[#9C9688] text-sm">まだ評価がありません。Tierでラーメン屋を追加してみましょう！</p>
          )}
          {topShops.map(([shopId, shop], i) => (
            <Link
              key={shopId}
              href={`/${org}/shops/${shopId}`}
              className="relative flex-none w-36 h-44 overflow-hidden border border-[#E4E0D8] block group"
            >
              {shop.photo_url ? (
                <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: TIER_COLORS[['S', 'A', 'B', 'C', 'D'][i] as TierLevel] }}>
                  <span className="text-white text-2xl">🍜</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="font-ui font-bold text-white text-xs mb-0.5">#{i + 1}</div>
                <div className="text-white text-xs font-medium leading-tight truncate">{shop.name}</div>
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
      {topShops.length > 0 && (
        <section>
          <h2 className="font-bold text-[#1C1A16] text-lg mb-3 flex items-center gap-2">
            評価分布
            <HelpTooltip text="人気TOP3のお店について、S〜Dの各Tier評価に何人がつけたかを棒グラフで表示します。コミュニティの評価傾向が一目でわかります。" position="bottom" />
          </h2>
          <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-4">
            {topShops.slice(0, 3).map(([shopId, shop]) => (
              <div key={shopId} className="mb-4 last:mb-0">
                <div className="text-sm font-medium text-[#1C1A16] mb-2 truncate">{shop.name}</div>
                <div className="space-y-1">
                  {TIER_LEVELS.map(tier => {
                    const count = shop.tiers[tier]
                    const max = Math.max(...Object.values(shop.tiers), 1)
                    return (
                      <div key={tier} className="flex items-center gap-2">
                        <span className="font-ui font-bold text-xs w-4 text-center" style={{ color: TIER_COLORS[tier] }}>{tier}</span>
                        <div className="flex-1 bg-[#F7F5F0] h-4 overflow-hidden">
                          <div
                            className="h-full transition-all"
                            style={{ width: `${(count / max) * 100}%`, background: TIER_COLORS[tier] }}
                          />
                        </div>
                        <span className="text-xs text-[#9C9688] w-8 text-right font-ui">{count}人</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Members */}
      <section>
        <h2 className="font-bold text-[#1C1A16] text-lg mb-3 flex items-center gap-2">
          コミュニティメンバー ({members?.length ?? 0}人)
          <HelpTooltip text="このコミュニティに参加しているメンバーの一覧です。アイコンをクリックするとプロフィールとTierリストを確認できます。" position="bottom" />
        </h2>
        <div className="flex flex-wrap gap-3">
          {members?.map(member => (
            <Link
              key={member.id}
              href={`/${org}/profile/${member.id}`}
              className="flex flex-col items-center gap-1 group"
              title={member.display_name ?? ''}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.display_name ?? ''}
                  className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-[#F2D400] transition-all"
                  style={{ boxShadow: member.id === myMember?.id ? '0 0 0 3px #F2D400' : undefined }}
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
      {(recentPosts?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#1C1A16] text-lg">最近の投稿</h2>
            <Link href={`/${org}/feed`} className="text-sm text-[#9C9688] hover:text-[#1C1A16] font-ui flex items-center gap-1">
              フィードを見る
              <span className="material-symbols-rounded text-[16px]">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentPosts?.map(post => {
              const member = post.members as unknown as { display_name: string | null; avatar_url: string | null } | null
              const shop = post.ramen_shops as unknown as { name: string } | null
              return (
                <Link key={post.id} href={`/${org}/feed/${post.id}`} className="block group">
                  <div className="aspect-square bg-[#F7F5F0] border border-[#E4E0D8] overflow-hidden mb-1">
                    {post.image_urls?.[0] ? (
                      <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl">🍜</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[#9C9688] truncate">{member?.display_name} · {shop?.name ?? '店舗なし'}</div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
