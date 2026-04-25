import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/Header'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ org: string }>
}) {
  const { org } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('members')
    .select('*, organizations(slug)')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/login')
  if (!member.is_setup_done) redirect('/setup')

  const orgSlug = (member.organizations as unknown as { slug: string } | null)?.slug
  if (orgSlug !== org) redirect('/login')

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <Header org={org} member={member} />
      <main className="pt-14 max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
