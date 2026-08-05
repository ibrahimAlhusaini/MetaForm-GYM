interface PageHeaderProps {
  title: string
  description: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="max-w-3xl">
      <span className="inline-flex rounded-full border border-lime-300/20 bg-lime-300/6 px-3 py-1 text-xs font-semibold tracking-wide text-lime-300 uppercase">
        Coming in next stage
      </span>
      <h1
        id="page-heading"
        className="mt-5 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl"
      >
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
        {description}
      </p>
    </div>
  )
}
