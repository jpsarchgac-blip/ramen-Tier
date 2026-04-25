import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TIER_LEVELS, TIER_COLORS, getGoogleMapsUrl, formatDate } from '@/lib/utils'
import type { TierLevel } from '@/types/database'
import TierDetailModalTrigger from './TierDetailModalTrigger'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ org: string; userId: string }>
}) {
  const { org, userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: organization } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', org)
    .single()
  if (!organization) notFound()

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', userId)
    .eq('organization_id', organization.id)
    .single()
  if (!member) notFound()

  const { data: myMember } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user!.id)
    .eq('organization_id', organization.id)
    .single()

  const isOwn = myMember?.id === member.id

  // Stats
  const [{ count: shopCount }, { count: wishCount }, { count: postCount }] = await Promise.all([
    supabase.from('tier_ratings').select('*', { count: 'exact', head: true }).eq('member_id', member.id),
    supabase.from('wish_list').select('*', { count: 'exact', head: true }).eq('member_id', member.id),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('member_id', member.id),
  ])

  // Tier ratings (if public or own)
  let ratings: any[] = []
  if (member.tier_public || isOwn) {
    const { data } = await supabase
      .from('tier_ratings')
      .select('*, ramen_shops(*)')
      .eq('member_id', member.id)
      .order('updated_at', { ascending: false })
    ratings = data ?? []
  }

  // Recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, image_urls, created_at')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Favorite shop
  let favoriteShop: { id: string; name: string } | null = null
  if (member.favorite_shop_id) {
    const { data } = await supabase
      .from('ramen_shops')
      .select('id, name')
      .eq('id', member.favorite_shop_id)
      .single()
    favoriteShop = data
  }

  const grouped = TIER_LEVELS.reduce((acc, tier) => {
    acc[tier] = ratings.filter((r: any) => r.tier === tier)
    return acc
  }, {} as Record<TierLevel, any[]>)

  return (
    <div className="space-y-6">
      {/* Back + Edit */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${org}/dashboard`}
          className="flex items-center gap-1 text-sm text-[#9C9688] hover:text-[#1C1A16]"
        >
          <span className="material-symbols-rounded text-[16px]">arrow_back</span>
          戻る
        </Link>
        {isOwn && (
          <Link
            href={`/${org}/profile/edit`}
            className="flex items-center gap-1 text-sm font-ui font-medium text-[#1C1A16] border border-[#E4E0D8] px-3 py-1.5 hover:bg-[#F7F5F0]"
          >
            <span className="material-symbols-rounded text-[14px]">edit</span>
            編集
          </Link>
        )}
      </div>

      {/* Profile header */}
      <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-5">
        <div className="flex items-start gap-4">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.display_name ?? ''} className="w-16 h-16 rounded-full object-cover border-2 border-[#F2D400] shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#FEFAE0] border-2 border-[#F2D400] flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded text-[28px] text-[#B8A000]">person</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[#1C1A16] text-lg">{member.display_name}</h1>
            {member.bio && <p className="text-sm text-[#9C9688] mt-0.5">「{member.bio}」</p>}
            {(member.favorite_types?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {member.favorite_types?.map((t: string) => (
                  <span key={t} className="bg-[#FEFAE0] border border-[#F2D400] text-[#1C1A16] text-xs px-2 py-0.5">{t}</span>
                ))}
              </div>
            )}
            {favoriteShop && (
              <div className="mt-2 text-sm text-[#9C9688] flex items-center gap-1">
                <span className="material-symbols-rounded text-[14px] text-[#F2D400]">star</span>
                一番好きな店:
                <Link href={`/${org}/shops/${favoriteShop.id}`} className="text-[#1C1A16] font-medium hover:underline">{favoriteShop.name}</Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#E4E0D8]">
          <div className="text-center">
            <div className="font-ui font-bold text-[#1C1A16] text-lg">{shopCount ?? 0}</div>
            <div className="text-xs text-[#9C9688]">🍜 行った店</div>
          </div>
          <div className="text-center">
            <div className="font-ui font-bold text-[#1C1A16] text-lg">{wishCount ?? 0}</div>
            <div className="text-xs text-[#9C9688]">♡ 行きたい</div>
          </div>
          <div className="text-center">
            <div className="font-ui font-bold text-[#1C1A16] text-lg">{postCount ?? 0}</div>
            <div className="text-xs text-[#9C9688]">📷 投稿</div>
          </div>
        </div>
      </div>

      {/* Tier list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#1C1A16]">
            Tierリスト
            {!member.tier_public && !isOwn && (
              <span className="ml-2 text-xs font-normal text-[#9C9688]">（非公開）</span>
            )}
          </h2>
        </div>

        {(!member.tier_public && !isOwn) ? (
          <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6 text-center text-[#9C9688] text-sm">
            このメンバーのTierリストは非公開です
          </div>
        ) : ratings.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E4E0D8] p-6 text-center text-[#9C9688] text-sm">
            まだTierに登録された店舗がありません
          </div>
        ) : (
          <div className="space-y-3">
            {TIER_LEVELS.map(tier => {
              if (grouped[tier].length === 0) return null
              return (
                <div key={tier} className="bg-[#FFFFFF] border border-[#E4E0D8]">
                  <div
                    className="px-4 py-2 text-sm font-ui font-bold border-b border-[#E4E0D8]"
                    style={{ borderLeftWidth: 4, borderLeftColor: TIER_COLORS[tier], borderLeftStyle: 'solid', color: TIER_COLORS[tier] }}
                  >
                    Tier {tier}
                  </div>
                  <div className="flex flex-wrap gap-2 p-3">
                    {grouped[tier].map((rating: any) => {
                      const shop = rating.ramen_shops
                      return (
                        <TierDetailModalTrigger
                          key={rating.id}
                          rating={rating}
                          shop={shop}
                          member={member}
                          org={org}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent posts */}
      {(recentPosts?.length ?? 0) > 0 && (
        <div>
          <h2 className="font-bold text-[#1C1A16] mb-3">直近の投稿</h2>
          <div className="grid grid-cols-3 gap-2">
            {recentPosts?.map(post => (
              <Link key={post.id} href={`/${org}/feed/${post.id}`} className="block aspect-square bg-[#F7F5F0] border border-[#E4E0D8] overflow-hidden group">
                {post.image_urls?.[0] ? (
                  <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl">🍜</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
