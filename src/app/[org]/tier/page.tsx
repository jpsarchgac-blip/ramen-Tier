import { createClient } from '@/lib/supabase/server'
import TierClient from './TierClient'

export default async function TierPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: organization } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', org)
    .single()

  if (!organization) return <div>組織が見つかりません</div>

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', user!.id)
    .eq('organization_id', organization.id)
    .single()

  if (!member) return <div>メンバーが見つかりません</div>

  const { data: ratings } = await supabase
    .from('tier_ratings')
    .select('*, ramen_shops(*)')
    .eq('member_id', member.id)
    .order('updated_at', { ascending: false })

  return (
    <TierClient
      org={org}
      initialRatings={(ratings ?? []) as any}
      memberId={member.id}
    />
  )
}
