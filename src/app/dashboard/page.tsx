import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-300 font-sans text-[#0f2c55]">
    
      <nav className="sticky top-0 z-10 border-b border-white/20 bg-[#0f2f5f] text-white">
        <div className="mx-auto flex w-[min(1280px,calc(100%-48px))] items-center justify-between gap-6 py-5 max-md:w-[min(100%-24px,1280px)] max-md:flex-col max-md:items-start">
          <div>
            <h1 className="text-[2rem] font-bold leading-none tracking-[-0.02em]">CUNYZeroLite</h1>
          </div>

          <ul className="flex list-none items-center gap-4 max-md:flex-wrap">
            <li>
              <Link
                href="/home"
                className="block min-w-[148px] rounded-[14px] bg-white px-3.5 py-2.5 text-center font-semibold text-[#0f2f5f] no-underline"
                >
                Home
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <main className="mx-auto w-[min(1280px,calc(100%-48px))] py-10 max-md:w-[min(100%-24px,1280px)]">
        <section className="rounded-[34px] border border-white/15 bg-gradient-to-b from-[#0f2f5f] to-[#173f7a] p-8 shadow-[0_10px_26px_rgba(5,24,56,0.16)] max-md:rounded-[22px] max-md:p-[18px]">
          

          <div className="grid grid-cols-3 gap-6 max-[1080px]:grid-cols-2 max-md:grid-cols-1">

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Profile</h3>
              <div className="my-1.5 grid h-[92px] w-[92px] place-items-center">
                
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">
                <span className="font-semibold">ID GOES HERE</span> 
              </p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Student Tools</h3>
              <div className="my-1.5 grid h-[92px] w-[92px] place-items-center">
                
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">Quick Access Resources</p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Schedule Builder</h3>
              
              <p className="mt-auto text-[0.98rem] font-bold">Plan Your Classes</p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Course Planning</h3>
              
              <p className="mt-auto text-[0.98rem] font-bold">
                <span className="font-extrabold text-[#e53b3b]">1</span> Active Appointment
              </p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Grades & Transcript</h3>
              
              <p className="mt-auto text-[0.98rem] font-bold">Request Current Grades</p>
            </article>


          </div>
        </section>
      </main>
    </div>
  );
}