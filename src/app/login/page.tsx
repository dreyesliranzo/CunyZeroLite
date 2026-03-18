"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errorMessage) setErrorMessage("");
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.username || !formData.password) {
      setErrorMessage("Please enter both your username and password.");
      return;
    }

    const validUsername = "student@cuny.edu";
    const validPassword = "password123";

    const isValidLogin =
      formData.username.trim().toLowerCase() === validUsername &&
      formData.password === validPassword;

    if (!isValidLogin) {
      setErrorMessage(
        "Username or password is incorrect. Please check again or reset your password."
      );
      return;
    }

    setIsLoggingIn(true);

    setTimeout(() => {
      setIsLoggingIn(false);
    }, 2200);
  }

  return (
    <main className="min-h-screen bg-white">
      <div
        className={`grid min-h-screen lg:grid-cols-[0.95fr_1.05fr] xl:grid-cols-[1.02fr_0.98fr] transition-all duration-300 ${
          isLoggingIn ? "scale-[0.99] blur-[2px]" : ""
        }`}
      >
        <section className="hidden lg:flex bg-blue-950 text-white">
          <div className="flex w-full justify-center px-8 pt-4 pb-8 xl:px-12 xl:pt-6 xl:pb-10 2xl:px-14">
            <div className="w-full max-w-[540px] xl:max-w-[620px]">
              <div className="mt-8 xl:mt-10">
                <p className="text-[11px] xl:text-sm uppercase tracking-[0.32em] text-blue-200">
                  Student access
                </p>

                <h1 className="mt-2 text-[52px] leading-[0.98] font-bold tracking-tight text-white xl:text-6xl 2xl:text-7xl">
                  Welcome back to your academic dashboard.
                </h1>

                <p className="mt-4 max-w-[520px] text-[15px] leading-7 text-blue-100/95 xl:text-lg xl:leading-8">
                  Access enrollment tools, manage your student experience, and
                  stay connected through a reliable academic portal designed for
                  clarity and ease of use.
                </p>
              </div>

              <div className="group relative mt-6 xl:mt-8 rounded-3xl border border-white/10 bg-white/10 p-4 xl:p-5 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:bg-white/[0.13] hover:shadow-2xl">
                <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute -inset-px rounded-3xl border border-blue-300/25" />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-300/8 via-transparent to-white/5" />
                </div>

                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] xl:text-xs font-semibold uppercase tracking-[0.24em] xl:tracking-[0.28em] text-blue-200">
                      Academic Dashboard Overview
                    </p>

                    <h3 className="mt-2 text-xl xl:text-2xl font-bold text-white">
                      Example Student Snapshot
                    </h3>

                    <p className="mt-2 max-w-md text-[13px] leading-5 xl:text-sm xl:leading-6 text-blue-100/90">
                      View the type of academic information available once you
                      sign in, including enrollment status, registration
                      details, course load, and important account alerts.
                    </p>
                  </div>

                  <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs xl:text-sm font-medium text-blue-100 transition-all duration-300 group-hover:bg-white/15">
                    Active
                  </div>
                </div>

                <div className="relative mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/8 p-3 transition-all duration-300 group-hover:bg-white/10">
                    <p className="text-[10px] xl:text-[11px] uppercase tracking-[0.18em] xl:tracking-[0.22em] text-blue-200">
                      Current Term
                    </p>
                    <p className="mt-2 text-sm xl:text-base font-semibold text-white">
                      Spring 2026
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/8 p-3 transition-all duration-300 group-hover:bg-white/10">
                    <p className="text-[10px] xl:text-[11px] uppercase tracking-[0.18em] xl:tracking-[0.22em] text-blue-200">
                      Enrollment Status
                    </p>
                    <p className="mt-2 text-sm xl:text-base font-semibold text-white">
                      Registered
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/8 p-3 transition-all duration-300 group-hover:bg-white/10">
                    <p className="text-[10px] xl:text-[11px] uppercase tracking-[0.18em] xl:tracking-[0.22em] text-blue-200">
                      Credit Load
                    </p>
                    <p className="mt-2 text-sm xl:text-base font-semibold text-white">
                      15 Credits
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/8 p-3 transition-all duration-300 group-hover:bg-white/10">
                    <p className="text-[10px] xl:text-[11px] uppercase tracking-[0.18em] xl:tracking-[0.22em] text-blue-200">
                      Account Holds
                    </p>
                    <p className="mt-2 text-sm xl:text-base font-semibold text-white">
                      None
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-8 sm:px-8 lg:px-8 xl:px-10 2xl:px-14">
          <div className="w-full max-w-[520px] xl:max-w-[560px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_28px_90px_rgba(15,23,42,0.16)] transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_36px_110px_rgba(15,23,42,0.22)] sm:p-10">
              <div className="mb-8">
                <div className="mb-5 lg:hidden">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Student Portal
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                    CunyZeroLite
                  </h2>
                </div>

                <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                  Sign In
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your credentials to continue.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-slate-400 focus:border-blue-900 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-xs font-semibold text-blue-800 transition-colors duration-200 hover:text-blue-950"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-slate-400 focus:border-blue-900 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-200"
                    />
                    Remember me
                  </label>

                  <Link
                    href="/"
                    className="font-semibold text-blue-800 transition-colors duration-200 hover:text-blue-950"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-900 px-4 py-3.5 font-semibold text-white shadow-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg active:translate-y-0"
                >
                  Sign In
                </button>
              </form>

              {errorMessage && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
                Need to go back?{" "}
                <Link
                  href="/"
                  className="font-semibold text-blue-800 transition-colors duration-200 hover:text-blue-950"
                >
                  Return home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isLoggingIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-sm">
          <div className="w-[90%] max-w-sm rounded-3xl border border-white/20 bg-white px-8 py-10 text-center shadow-2xl">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-blue-900" />
            <h3 className="text-2xl font-bold text-slate-900">Signing you in</h3>
            <p className="mt-2 text-sm text-slate-600">
              Please wait while we securely log you into your portal.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}