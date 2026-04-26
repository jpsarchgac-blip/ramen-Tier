import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import LogoClient from './LogoClient'

export default async function LogoSettingsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: organization } = await supabase.from('organizations').select('*').eq('slug', org).single()
  if (!organization) notFound()

  const { data: member } = await supabase
    .from('members').select('role').eq('user_id', user!.id).eq('organization_id', organization.id).single()
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) redirect(`/${org}/dashboard`)

  return <LogoClient org={org} initialLogoUrl={organization.logo_url ?? null} />
}
