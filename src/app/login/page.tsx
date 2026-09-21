"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => signIn(formData),
    undefined,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    async (_prev: { error: string } | undefined, formData: FormData) => signUp(formData),
    undefined,
  );

  const state = mode === "signin" ? signInState : signUpState;
  const action = mode === "signin" ? signInAction : signUpAction;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-blue-600">STOCKFLOW</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
          {mode === "signin" ? "Sign in" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stock inventory &amp; purchase order portal.
        </p>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Email</span>
            <input
              name="email"
              type="email"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>

          {state?.error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          {mode === "signin" ? "New team member? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
