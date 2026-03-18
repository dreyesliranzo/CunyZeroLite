import Link from "next/link";

const infoCards = [
  {
    title: "Registration & Enrollment",
    description:
      "Review enrollment details, class planning reminders, and registration notices before signing in.",
  },
  {
    title: "Financial Aid & Payments",
    description:
      "See important financial aid, tuition, and payment-related updates in one place.",
  },
  {
    title: "Academic Calendar",
    description:
      "Stay aware of deadlines, semester milestones, and other important academic dates.",
  },
  {
    title: "Advising & Student Support",
    description:
      "Find quick guidance on account access, student support, and academic help resources.",
  },
];

const portalFeatures = [
  "View class schedule",
  "Check grades",
  "Manage enrollment",
  "Review holds and tasks",
  "Access payment information",
  "Track academic progress",
];

const accountHelp = [
  "New User Setup",
  "Forgot Username",
  "Forgot Password",
  "Manage Account",
];

const updates = [
  {
    label: "Notice",
    title: "System access and account support",
    text: "Use your student credentials to securely enter the portal and manage your academic information.",
  },
  {
    label: "Reminder",
    title: "Review important information before login",
    text: "Announcements, deadlines, and student resources can be checked here before continuing to sign in.",
  },
  {
    label: "Support",
    title: "Need help getting started?",
    text: "Use the account help section below or continue to the login page for access assistance.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Info Bar */}
      <section className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
          <p>
            Student Portal Home — review important updates and continue to login
            when ready.
          </p>
          <Link
            href="/login"
            className="font-semibold text-[#0f2747] hover:underline"
          >
            Go to Student Login
          </Link>
        </div>
      </section>

      {/* Header */}
      <header className="border-b border-slate-200 bg-[#0f2747] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-wide">Student Portal</h1>
            <p className="text-sm text-slate-300">
              Academic information before sign in
            </p>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/home" className="text-sm hover:text-slate-200">
              Home
            </Link>
            <Link href="/login" className="text-sm hover:text-slate-200">
              Login
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0f2747] transition hover:bg-slate-100"
            >
              Student Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0f2747] to-[#183a63] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-300">
              Welcome
            </p>

            <h2 className="mb-4 text-4xl font-bold leading-tight md:text-5xl">
              Access your student portal with one secure login.
            </h2>

            <p className="mb-6 max-w-xl text-base leading-7 text-slate-200">
              Review key academic information, student services, and important
              reminders before continuing to the login page.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-xl bg-white px-6 py-3 font-semibold text-[#0f2747] transition hover:bg-slate-100"
              >
                Student Login
              </Link>

              <a
                href="#important-info"
                className="rounded-xl border border-white px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                View Information
              </a>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <p className="text-sm text-slate-300">Secure Access</p>
                <p className="mt-1 font-semibold">Student credentials</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <p className="text-sm text-slate-300">Before Login</p>
                <p className="mt-1 font-semibold">Updates and notices</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                <p className="text-sm text-slate-300">Student Support</p>
                <p className="mt-1 font-semibold">Help and guidance</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#0f2747]">
                Before You Sign In
              </h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Public Info
              </span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Account Access</p>
                <p className="mt-1 font-semibold">
                  Username, password, and setup support
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Student Information</p>
                <p className="mt-1 font-semibold">
                  Registration, aid, and academic resources
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Portal Access</p>
                <p className="mt-1 font-semibold">
                  Continue to login when you are ready
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#0f2747] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Continue to Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* Important Info */}
      <section id="important-info" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f2747]">
            Important Information
          </p>
          <h3 className="mt-2 text-3xl font-bold text-[#0f2747]">
            What students can review before signing in
          </h3>
          <p className="mt-3 max-w-3xl text-slate-600">
            This home screen gives students a clear first stop before entering
            the portal, with the same kind of useful pre-login information an
            academic system would normally surface.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {infoCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 h-11 w-11 rounded-xl bg-slate-100" />
              <h4 className="text-lg font-semibold text-[#0f2747]">
                {card.title}
              </h4>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features + Updates */}
      <section className="bg-slate-100">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f2747]">
              Portal Features
            </p>
            <h3 className="mt-2 text-2xl font-bold text-[#0f2747]">
              What students can do after login
            </h3>
            <p className="mt-3 text-slate-600">
              The login page is the gateway to core student tools and academic
              services.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {portalFeatures.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {feature}
                </div>
              ))}
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl bg-[#0f2747] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Sign In to Access Features
            </Link>
          </div>

          <div className="rounded-3xl bg-[#0f2747] p-8 text-white shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Current Updates
            </p>
            <h3 className="mt-2 text-2xl font-bold">
              Important reminders before entering the portal
            </h3>

            <div className="mt-6 space-y-4">
              {updates.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/10 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                    {item.label}
                  </p>
                  <h4 className="mt-2 text-lg font-semibold">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Account Help */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0f2747]">
              Account Help
            </p>
            <h3 className="mt-2 text-3xl font-bold text-[#0f2747]">
              Common login support options
            </h3>
            <p className="mt-3 max-w-2xl text-slate-600">
              This section gives students the same sense of guidance they expect
              before entering an academic portal.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {accountHelp.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <p className="font-semibold text-slate-800">{item}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Support option available through the student account flow.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h4 className="text-2xl font-bold text-[#0f2747]">
              Ready to continue?
            </h4>
            <p className="mt-3 text-slate-600">
              Continue to the login page to access your student portal, academic
              tools, and account features.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                Review public updates first
              </div>
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                Use your student credentials
              </div>
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                Continue securely to login
              </div>
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#0f2747] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f2747] text-slate-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3">
          <div>
            <h4 className="text-lg font-bold">Student Portal</h4>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Public home screen for important academic information before
              secure login.
            </p>
          </div>

          <div>
            <h5 className="font-semibold">Quick Access</h5>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              <p>Home</p>
              <p>Important Information</p>
              <p>Account Help</p>
            </div>
          </div>

          <div>
            <h5 className="font-semibold">Security</h5>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Protect your credentials and only continue through the official
              student login route.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}