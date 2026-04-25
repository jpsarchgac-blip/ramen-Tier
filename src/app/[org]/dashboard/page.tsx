import { createClient } from '@/lib/supabase/server'
import type { TierLevel } from '@/types/database'
import DashboardClient from './DashboardClient'

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

  const { data: members } = await supabase
    .from('members')
    .select('id, display_name, avatar_url, user_id')
    .eq('organization_id', organization.id)
    .order('joined_at', { ascending: true })

  const { data: tierData } = await supabase
    .from('tier_ratings')
    .select('tier, shop_id, ramen_shops(id, name, photo_url, google_place_id, address, ramen_type)')
    .eq('organization_id', organization.id)

  const shopStatsMap: Record<string, {
    shopId: string
    name: string
    photo_url: string | null
    place_id: string | null
    address: string | null
    ramen_type: string[] | null
    tiers: Record<TierLevel, number>
    total: number
  }> = {}

  for (const r of tierData ?? []) {
    const shop = r.ramen_shops as unknown as {
      id: string; name: string; photo_url: string | null
      google_place_id: string | null; address: string | null; ramen_type: string[] | null
    } | null
    if (!shop || !r.tier) continue
    if (!shopStatsMap[shop.id]) {
      shopStatsMap[shop.id] = {
        shopId: shop.id,
        name: shop.name,
        photo_url: shop.photo_url,
        place_id: shop.google_place_id,
        address: shop.address,
        ramen_type: shop.ramen_type,
        tiers: { S: 0, A: 0, B: 0, C: 0, D: 0 },
        total: 0,
      }
    }
    shopStatsMap[shop.id].tiers[r.tier as TierLevel]++
    shopStatsMap[shop.id].total++
  }

  const shopStats = Object.values(shopStatsMap)
    .sort((a, b) => (b.tiers.S - a.tiers.S) || (b.total - a.total))

  const { data: recentPosts } = await supabase
    .from('posts')
    .select('id, image_urls, members(display_name), ramen_shops(name)')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false })
    .limit(4)

  const myMember = members?.find(m => m.user_id === user?.id)

  return (
    <DashboardClient
      org={org}
      shopStats={shopStats}
      members={(members ?? []).map(m => ({ id: m.id, display_name: m.display_name, avatar_url: (m as any).avatar_url }))}
      recentPosts={(recentPosts ?? []).map(p => ({
        id: p.id,
        image_urls: p.image_urls,
        memberName: (p.members as unknown as { display_name: string | null } | null)?.display_name ?? null,
        shopName: (p.ramen_shops as unknown as { name: string } | null)?.name ?? null,
      }))}
      myMemberId={myMember?.id ?? null}
    />
  )
}
