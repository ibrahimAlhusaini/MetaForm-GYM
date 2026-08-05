import { PageHeader } from './PageHeader.js'

interface PlaceholderPageProps {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="page-heading">
      <PageHeader title={title} description={description} />
      <div className="mt-10 grid gap-5 xl:grid-cols-2" aria-hidden="true">
        <div className="min-h-52 rounded-2xl border border-white/8 bg-[#111315] p-6">
          <div className="h-3 w-24 rounded-full bg-white/8" />
          <div className="mt-6 h-24 rounded-xl border border-dashed border-white/8 bg-white/[0.015]" />
        </div>
        <div className="min-h-52 rounded-2xl border border-white/8 bg-[#111315] p-6">
          <div className="h-3 w-32 rounded-full bg-white/8" />
          <div className="mt-6 space-y-3">
            <div className="h-3 rounded-full bg-white/[0.035]" />
            <div className="h-3 w-4/5 rounded-full bg-white/[0.035]" />
            <div className="h-3 w-3/5 rounded-full bg-white/[0.035]" />
          </div>
        </div>
      </div>
    </section>
  )
}
