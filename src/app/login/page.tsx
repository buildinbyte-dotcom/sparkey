import { Suspense } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;

  return (
    <main className="mx-auto flex min-h-app max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-7 w-7 text-spark-400" />
          <span className="text-xl font-bold text-ink-50">SparkyQ</span>
        </Link>
        <ThemeToggle />
      </div>
      {deleted && (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          Your account and data have been deleted.
        </p>
      )}
      <div className="card">
        <h1 className="mb-1 text-lg font-bold text-ink-50">Sign in or create an account</h1>
        <p className="mb-6 text-sm text-ink-400">
          We&apos;ll email you a magic link and 6-digit sign-in code — no password needed.
        </p>
        <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-ink-800/50" />}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-xs text-ink-600">
        By signing in you agree to keep technical content within the verified trade community.
      </p>
      <nav className="mt-4 flex justify-center gap-4 text-xs text-ink-500">
        <Link href="/privacy" className="hover:text-ink-200">
          Privacy
        </Link>
        <Link href="/support" className="hover:text-ink-200">
          Support
        </Link>
        <Link href="/login/review" className="hover:text-ink-200">
          App review sign-in
        </Link>
      </nav>
    </main>
  );
}
