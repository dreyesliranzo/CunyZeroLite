
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 to-slate-300 font-sans text-[#0f2c55]">
      <div className="border-b border-slate-300 bg-slate-100 text-[15px] text-slate-600">
        <div className="mx-auto flex w-[min(1280px,calc(100%-48px))] items-center justify-between gap-4 py-3.5 max-md:w-[min(100%-24px,1280px)] max-md:flex-col max-md:items-start">
          <span>Student Portal Home — review important updates and continue to login when ready.</span>
          <a href="#" className="font-bold text-[#0f2f5f] no-underline">
            Go to Student Login
          </a>
        </div>
      </div>

      <nav className="sticky top-0 z-10 border-b border-white/20 bg-[#0f2f5f] text-white">
        <div className="mx-auto flex w-[min(1280px,calc(100%-48px))] items-center justify-between gap-6 py-5 max-md:w-[min(100%-24px,1280px)] max-md:flex-col max-md:items-start">
          <div>
            <h1 className="text-[2rem] font-bold leading-none tracking-[-0.02em]">Student Portal</h1>
            <p className="mt-1.5 text-[1.02rem] text-slate-200">Academic information before sign in</p>
          </div>

          <ul className="flex list-none items-center gap-4 max-md:flex-wrap">
            <li>
              <a href="#" className="rounded-[14px] px-3.5 py-2.5 font-semibold text-white no-underline transition hover:bg-white/10">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="rounded-[14px] px-3.5 py-2.5 font-semibold text-white no-underline transition hover:bg-white/10">
                Login
              </a>
            </li>
            <li>
              <a href="#" className="block min-w-[148px] rounded-[14px] bg-white px-3.5 py-2.5 text-center font-semibold text-[#0f2f5f] no-underline">
                Student Login
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <main className="mx-auto w-[min(1280px,calc(100%-48px))] py-10 max-md:w-[min(100%-24px,1280px)]">
        <section className="rounded-[34px] border border-white/15 bg-gradient-to-b from-[#0f2f5f] to-[#173f7a] p-8 shadow-[0_10px_26px_rgba(5,24,56,0.16)] max-md:rounded-[22px] max-md:p-[18px]">
          <div className="mb-6 grid grid-cols-[2.1fr_1fr] gap-6 max-[1080px]:grid-cols-2 max-md:grid-cols-1">
            <article className="grid min-h-[200px] grid-cols-[1.15fr_1fr] overflow-hidden rounded-[26px] border border-white/35 bg-white/95 shadow-[0_8px_18px_rgba(6,24,52,0.12)] max-md:grid-cols-1 max-[1080px]:col-span-2 max-md:col-span-1">
              <div className="relative flex flex-col justify-center bg-gradient-to-br from-[#143b78] to-[#0f2f5f] px-[30px] py-7 text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-2 after:bg-[#f1cc25] after:content-['']">
                <h2 className="mb-3 text-[clamp(1.9rem,3vw,3rem)] font-bold leading-[1.05] tracking-[-0.03em]">
                  Complete the <span className="text-[#f1cc25]">FAFSA</span> Form
                </h2>
                <p className="mb-[18px] max-w-[26ch] text-[1.08rem] leading-[1.55] text-slate-200">
                  Secure your financial aid for the upcoming year.
                </p>
                <a href="#" className="inline-block w-fit rounded-[14px] bg-white px-[22px] py-[13px] font-bold text-[#0f2f5f] no-underline">
                  Learn More
                </a>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-b from-[#173f7a] to-[#113162] before:absolute before:bottom-0 before:left-[10%] before:h-[58%] before:w-[16%] before:rounded-t-[18px] before:bg-white/12 before:shadow-[120px_0_0_rgba(255,255,255,0.16),240px_0_0_rgba(255,255,255,0.12)] before:content-[''] after:absolute after:bottom-0 after:right-[8%] after:h-[58%] after:w-[14%] after:rounded-t-[18px] after:bg-white/12 after:content-['']">
                <div className="absolute left-[18%] top-[24%] h-16 w-16 rounded-full bg-[#7fb2f0]/90"></div>
                <div className="absolute left-[38%] top-[28%] h-14 w-14 rounded-full bg-[#f0c9a9]/95"></div>
                <div className="absolute left-[58%] top-[26%] h-14 w-14 rounded-full bg-[#f1c938]/95"></div>
                <div className="absolute left-[78%] top-[20%] h-14 w-14 rounded-full bg-[#7a8ca7]/90"></div>
              </div>
            </article>

            <aside className="flex min-h-[200px] flex-col items-center justify-center rounded-[26px] border border-white/35 bg-white/95 px-6 py-5 text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)] max-[1080px]:col-span-2 max-md:col-span-1">
              <h3 className="mb-3.5 text-[1.1rem] font-semibold">Profile</h3>
              <div className="relative mb-3.5 h-[106px] w-[106px] rounded-full border-[3px] border-[#234f89] bg-gradient-to-b from-[#f9fbff] to-[#edf3fb]">
                <div className="absolute left-1/2 top-[14px] h-[34px] w-[34px] -translate-x-1/2 rounded-full border-[3px] border-[#234f89] bg-white"></div>
                <div className="absolute bottom-[18px] left-1/2 h-[32px] w-[60px] -translate-x-1/2 rounded-t-[50px] border-[3px] border-b-0 border-[#234f89] bg-white"></div>
              </div>
              <div className="text-[1.4rem] font-extrabold tracking-[0.01em]">24580643</div>
            </aside>
          </div>

          <div className="grid grid-cols-3 gap-6 max-[1080px]:grid-cols-2 max-md:grid-cols-1">
            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Tasks and Holds</h3>
              <div className="my-1.5 grid h-[92px] w-[92px] place-items-center">
                <div className="relative h-0 w-0 border-x-[34px] border-b-[60px] border-x-transparent border-b-[#efd98f] drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]">
                  <span className="absolute left-[-6px] top-5 text-[2rem] font-black text-[#263b5e]">!</span>
                </div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">
                <span className="font-extrabold text-[#e53b3b]">1</span> To Do • <span className="font-extrabold text-[#e53b3b]">1</span> Hold
              </p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Student Tools</h3>
              <div className="my-1.5 grid h-[92px] w-[92px] place-items-center">
                <div className="relative h-[74px] w-[58px] rounded-[8px] border-[3px] border-[#9ab4d7] bg-white shadow-[inset_0_-16px_0_#eef3fb]">
                  <div className="absolute right-[-3px] top-[-3px] h-[18px] w-[18px] [clip-path:polygon(0_0,100%_0,100%_100%)] bg-[#d4e1f2]"></div>
                  <div className="absolute left-3 top-6 h-[4px] w-[34px] bg-[#3a8dcf] shadow-[0_10px_0_#7ca2cf,0_20px_0_#38c7b4]"></div>
                </div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">Quick Access Resources</p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Schedule Builder</h3>
              <div className="relative my-1.5 h-[92px] w-[92px]">
                <div className="absolute left-5 top-3 h-3 w-[46px] rounded-md border-2 border-[#9fc0df] bg-[linear-gradient(90deg,#1f3568_22%,#39c8b6_22%_75%,#ffffff_75%)]"></div>
                <div className="absolute left-5 top-9 h-3 w-[46px] rounded-md border-2 border-[#9fc0df] bg-[linear-gradient(90deg,#6846b4_22%,#7ea5ff_22%_75%,#ffffff_75%)]"></div>
                <div className="absolute left-5 top-[66px] h-3 w-[46px] rounded-md border-2 border-[#9fc0df] bg-[linear-gradient(90deg,#d14a57_22%,#4aa8ff_22%_75%,#ffffff_75%)]"></div>
                <div className="absolute left-1.5 top-3 h-3 w-3 rounded-full bg-[#1f3568]"></div>
                <div className="absolute left-1.5 top-9 h-3 w-3 rounded-full bg-[#6846b4]"></div>
                <div className="absolute left-1.5 top-[66px] h-3 w-3 rounded-full bg-[#d14a57]"></div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">Plan Your Classes</p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Course Planning</h3>
              <div className="relative my-1.5 grid h-[92px] w-[92px] place-items-center">
                <div className="relative h-[70px] w-[76px] rounded-[10px] border-[3px] border-[#3b73b4] bg-white shadow-[inset_0_18px_0_#dcebf9]">
                  <div className="absolute left-[14px] top-[-10px] h-[18px] w-[10px] rounded-[5px] bg-[#3b73b4] shadow-[30px_0_0_#3b73b4]"></div>
                  <div className="absolute left-3 top-6 h-3 w-3 bg-[#ea5a4b] shadow-[18px_0_0_#6b8de9,36px_0_0_#38c7b4,0_18px_0_#f0c625,18px_18px_0_#6b8de9,36px_18px_0_#ea5a4b]"></div>
                </div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">
                <span className="font-extrabold text-[#e53b3b]">1</span> Active Appointment
              </p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">DegreeWorks &amp; FACTS</h3>
              <div className="my-1.5 grid h-[92px] w-[92px] place-items-center">
                <div className="relative h-[74px] w-[58px] rounded-[8px] border-[3px] border-[#c9d3e1] bg-white shadow-[inset_0_-16px_0_#eef3fb]">
                  <div className="absolute right-[-3px] top-[-3px] h-[18px] w-[18px] [clip-path:polygon(0_0,100%_0,100%_100%)] bg-[#d4e1f2]"></div>
                  <div className="absolute left-3 top-6 h-[3px] w-8 bg-[#ea5a4b] shadow-[0_12px_0_#ea5a4b,0_24px_0_#ea5a4b]"></div>
                  <div className="absolute bottom-3 right-2 h-8 w-2 rotate-45 rounded bg-[#193a74]"></div>
                </div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">Academic Progress</p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Financial Account</h3>
              <div className="relative my-1.5 h-[92px] w-[92px]">
                <div className="absolute left-0 right-0 top-1 mx-auto h-[18px] w-[72px] bg-[#c9d3e1] [clip-path:polygon(50%_0,100%_100%,0_100%)]"></div>
                <div className="absolute left-[14px] top-6 h-8 w-16 bg-[linear-gradient(90deg,#c9d3e1_0_10px,transparent_10px_18px,#c9d3e1_18px_28px,transparent_28px_36px,#c9d3e1_36px_46px,transparent_46px_54px,#c9d3e1_54px_64px)] after:absolute after:bottom-0 after:left-0 after:h-[6px] after:w-full after:bg-[#c9d3e1] after:content-['']"></div>
                <div className="absolute bottom-1 left-[18px] h-[26px] w-[64px] rounded-[8px] bg-[#31c483] shadow-[12px_-8px_0_#f0c625]"></div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">View Account Balance</p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Financial Aid</h3>
              <div className="relative my-1.5 h-[92px] w-[92px]">
                <div className="absolute left-5 top-1 h-6 w-[50px] rotate-[6deg] skew-x-[-20deg] rounded bg-[#213668]"></div>
                <div className="absolute bottom-3 left-5 h-7 w-[46px] rounded-[8px] bg-[#31c483] shadow-[-8px_-16px_0_6px_#e1b03a,-10px_4px_0_8px_#d84343]"></div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">Aid &amp; Scholarships</p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">CUNY Direct Deposit</h3>
              <div className="relative my-1.5 grid h-[92px] w-[92px] place-items-center">
                <div className="relative h-[56px] w-[82px] rounded-[8px] border-4 border-[#264a97] border-b-[8px] bg-[#f7fbff] after:absolute after:bottom-[-16px] after:left-[-10px] after:right-[-10px] after:h-2.5 after:rounded-b-[12px] after:bg-[#264a97] after:content-['']">
                  <span className="absolute inset-0 grid place-items-center text-[2rem] font-extrabold text-[#f0c625]">$</span>
                </div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">Manage Deposits</p>
            </article>

            <article className="flex min-h-[210px] flex-col items-center rounded-[26px] border border-white/35 bg-white/95 px-[18px] pb-4 pt-[18px] text-center shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <h3 className="mb-4 w-full border-b-2 border-[#c7d3e6] pb-3 text-[1.08rem] font-extrabold">Graduation &amp; Transcript</h3>
              <div className="my-1.5 grid h-[92px] w-[92px] place-items-center">
                <div className="relative h-[74px] w-[56px] rounded-[8px] border-[3px] border-[#c9d3e1] bg-white">
                  <div className="absolute right-2 top-2.5 h-[26px] w-[26px] rounded-full bg-[conic-gradient(#f0c625_0_110deg,#53a867_110deg_220deg,#dfe8f4_220deg_360deg)]"></div>
                  <div className="absolute bottom-3 left-3 h-1 w-[30px] bg-[#7b8ea8] shadow-[0_-10px_0_#7b8ea8,0_-20px_0_#7b8ea8]"></div>
                </div>
              </div>
              <p className="mt-auto text-[0.98rem] font-bold">Grad Status &amp; Records</p>
            </article>
          </div>

          <div className="mt-[22px] grid grid-cols-2 justify-center gap-6 [grid-template-columns:repeat(2,minmax(240px,400px))] max-md:grid-cols-1 max-md:[grid-template-columns:1fr]">
            <div className="flex min-h-[94px] items-center gap-[18px] rounded-[26px] border border-white/35 bg-white/95 px-[22px] py-[18px] shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-full bg-[#143b78] text-[1.2rem] font-black text-white">▦</div>
              <div>
                <strong className="mb-1 block text-[1.05rem]">Brightspace</strong>
                <span className="text-[0.98rem] text-[#5e7598]">Learning Platform</span>
              </div>
            </div>

            <div className="flex min-h-[94px] items-center gap-[18px] rounded-[26px] border border-white/35 bg-white/95 px-[22px] py-[18px] shadow-[0_8px_18px_rgba(6,24,52,0.12)]">
              <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-full bg-[#2490f0] text-[1.2rem] font-black text-white">▦</div>
              <div>
                <strong className="mb-1 block text-[1.05rem]">Transfer Explorer</strong>
                <span className="text-[0.98rem] text-[#5e7598]">Transfer Options</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}