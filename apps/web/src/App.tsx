function App() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-zinc-50">
      <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/40">
          <div className="h-1 w-full bg-lime-300" />
          <div className="p-8 sm:p-12">
            <div className="mb-10 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-lime-300 font-black text-zinc-950">
                M
              </span>
              <span className="text-sm font-semibold tracking-[0.2em] text-zinc-300">
                METAFORM GYM
              </span>
            </div>

            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-medium text-lime-300">
                Foundation initialized
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Built to turn training data into progress.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
                The MetaForm GYM application shell is ready. Product features
                will be added deliberately in the next development stages.
              </p>
            </div>

            <div className="mt-12 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-zinc-500">
              <span className="size-2 rounded-full bg-lime-300 shadow-[0_0_16px_rgba(190,242,100,0.8)]" />
              React and API foundation ready
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
