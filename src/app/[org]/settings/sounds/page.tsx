import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import SoundsClient from './SoundsClient'

export default async function SoundsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, bgm_url, bgm_enabled, bgm_volume')
    .eq('slug', org)
    .single()
  if (!organization) notFound()

  const { data: member } = await supabase
    .from('members').select('role').eq('user_id', user!.id).eq('organization_id', organization.id).single()
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) redirect(`/${org}/dashboard`)

  return (
    <SoundsClient
      org={org}
      orgId={organization.id}
      initialBgmUrl={organization.bgm_url}
      initialEnabled={organization.bgm_enabled}
      initialVolume={organization.bgm_volume}
    />
  )
}
