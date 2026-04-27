import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TIER_LEVELS, TIER_COLORS, getGoogleMapsUrl, formatDate } from '@/lib/utils'
import type { TierLevel } from '@/types/database'
import ShopDetailClient from './ShopDetailClient'
import ShopDetailInteractive from './ShopDetailInteractive'
import HelpTooltip from '@/components/HelpTooltip'

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ org: string; shopId: string }>
}) {
  const { org, shopId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: organization } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', org)
    .single()
  if (!organization) notFound()

  const { data: myMember } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user!.id)
    .eq('organization_id', organization.id)
    .single()
  if (!myMember) notFound()

  const { data: shop } = await supabase
    .from('ramen_shops')
    .select('*')
    .eq('id', shopId)
    .eq('organization_id', organization.id)
    .single()
  if (!shop) notFound()

  const { data: ratings } = await supabase
    .from('tier_ratings')
    .select('*, members(id, display_name, avatar_url)')
    .eq('shop_id', shopId)
    .eq('organization_id', organization.id)

  const tierDist: Record<TierLevel, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  const avgScores = { noodle: 0, soup: 0, toppings: 0, wait: 0, speed: 0, location: 0 }
  const scoreCounts = { noodle: 0, soup: 0, toppings: 0, wait: 0, speed: 0, location: 0 }

  for (const r of ratings ?? []) {
    if (r.tier) tierDist[r.tier as TierLevel]++
    if (r.score_noodle != null) { avgScores.noodle += r.score_noodle; scoreCounts.noodle++ }
    if (r.score_soup != null) { avgScores.soup += r.score_soup; scoreCounts.soup++ }
    if (r.score_toppings != null) { avgScores.toppings += r.score_toppings; scoreCounts.toppings++ }
    if (r.score_wait != null) { avgScores.wait += r.score_wait; scoreCounts.wait++ }
    if (r.score_speed != null) { avgScores.speed += r.score_speed; scoreCounts.speed++ }
    if (r.score_location != null) { avgScores.location += r.score_location; scoreCounts.location++ }
  }

  const avgChart = {
    noodle: scoreCounts.noodle ? +(avgScores.noodle / scoreCounts.noodle).toFixed(1) : null,
    soup: scoreCounts.soup ? +(avgScores.soup / scoreCounts.soup).toFixed(1) : null,
    toppings: scoreCounts.toppings ? +(avgScores.toppings / scoreCounts.toppings).toFixed(1) : null,
    wait: scoreCounts.wait ? +(avgScores.wait / scoreCounts.wait).toFixed(1) : null,
    speed: scoreCounts.speed ? +(avgScores.speed / scoreCounts.speed).toFixed(1) : null,
    location: scoreCounts.location ? +(avgScores.location / scoreCounts.location).toFixed(1) : null,
  }

  const { count: wishCount } = await supabase
    .from('wish_list')
    .select('*', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('organization_id', organization.id)

  const { data: myWish } = await supabase
    .from('wish_list')
    .select('id')
    .eq('shop_id', shopId)
    .eq('member_id', myMember.id)
    .single()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, image_urls, caption, created_at, members(display_name, avatar_url)')
    .eq('shop_id', shopId)
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const mapsUrl = getGoogleMapsUrl(shop.google_place_id, shop.name, shop.address)
  const totalRatings = Object.values(tierDist).reduce((a, b) => a + b, 0)
  const maxTierCount = Math.max(...Object.values(tierDist), 1)

  const memberRatings = (ratings ?? []).map((r: any) => {
    const member = r.members as unknown as { id: string; display_name: string | null; avatar_url: string | null } | null
    return {
      id: r.id,
      tier: r.tier,
      score_noodle: r.score_noodle,
      score_soup: r.score_soup,
      score_toppings: r.score_toppings,
      score_wait: r.score_wait,
      score_speed: r.score_speed,
      score_location: r.score_location,
      highlights: r.highlights,
      comment: r.comment,
      member,
    }
  })

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href={`/${org}/tier`} className="flex items-center gap-1 text-sm text-[#9C9688] hover:text-[#1C1A16]">
        <span className="material-symbols-rounded text-[16px]">arrow_back</span>
        戻る
      </Link>

      {/* Shop hero */}
      <div className="bg-[#FFFFFF] border border-[#E4E0D8] overflow-hidden">
        {shop.photo_url ? (
          <div className="h-48 sm:h-64 overflow-hidden">
            <img src={shop.photo_url} alt={shop.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-32 bg-[#F2D400] flex items-center justify-center">
            <span className="text-5xl">🍜</span>
          </div>
        )}
        <div className="p-4">
          <h1 className="font-bold text-[#1C1A16] text-xl mb-1">{shop.name}</h1>
          {shop.address && <p className="text-sm text-[#9C9688] mb-2">{shop.address}</p>}
          {(shop.ramen_type?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {shop.ramen_type?.map((t: string) => (
                <span key={t} className="bg-[#FEFAE0] border border-[#F2D400] text-[#1C1A16] text-xs px-2 py-0.5">{t}</span>
              ))}
            </div>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-ui font-medium text-[#1C1A16] border border-[#E4E0D8] px-3 py-1.5 hover:bg-[#F7F5F0]"
          >
            <span className="material-symbols-rounded text-[16px]">place</span>
            Google Mapsで開く
            <span className="material-symbols-rounded text-[14px]">open_in_new</span>
          </a>
        </div>
      </div>

      {/* Community rating */}
      <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-4">
        <h2 className="font-bold text-[#1C1A16] mb-3 flex items-center gap-2">
          コミュニティの評価
          <HelpTooltip text="コミュニティのメンバーがこのお店につけたTier評価の分布です。S〜Dの5段階で何人がどのTierをつけたか棒グラフで確認できます。" position="bottom" />
        </h2>
        <div className="space-y-2 mb-4">
          {TIER_LEVELS.map(tier => (
            <div key={tier} className="flex items-center gap-2">
              <span className="font-ui font-bold text-sm w-4" style={{ color: TIER_COLORS[tier] }}>{tier}</span>
              <div className="flex-1 bg-[#F7F5F0] h-5 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{ width: `${(tierDist[tier] / maxTierCount) * 100}%`, background: TIER_COLORS[tier] }}
                />
              </div>
              <span className="text-xs text-[#9C9688] w-10 text-right font-ui">{tierDist[tier]}人</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-[#9C9688]">
          <span>★ {totalRatings}人が評価済み</span>
          <span>♡ {wishCount ?? 0}人が行きたい</span>
        </div>

        {/* Wish button */}
        <ShopDetailClient
          org={org}
          shopId={shopId}
          memberId={myMember.id}
          initialWished={!!myWish}
          initialWishCount={wishCount ?? 0}
        />
      </div>

      {/* Interactive: radar chart tabs + member ratings with modal */}
      <ShopDetailInteractive
        org={org}
        avgChart={avgChart}
        memberRatings={memberRatings}
        shop={shop}
      />

      {/* Related posts */}
      {(posts?.length ?? 0) > 0 && (
        <div>
          <h2 className="font-bold text-[#1C1A16] mb-3">この店の投稿</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {posts?.map(post => {
              const member = post.members as unknown as { display_name: string | null } | null
              return (
                <Link key={post.id} href={`/${org}/feed/${post.id}`} className="block group">
                  <div className="aspect-square bg-[#F7F5F0] border border-[#E4E0D8] overflow-hidden mb-1">
                    {post.image_urls?.[0] ? (
                      <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🍜</div>
                    )}
                  </div>
                  <div className="text-xs text-[#9C9688] truncate">{member?.display_name} · {formatDate(post.created_at)}</div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
