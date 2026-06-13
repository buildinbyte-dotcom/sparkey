import Link from "next/link";
import { Zap } from "lucide-react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <Zap className="h-7 w-7 text-spark-400" />
        <span className="text-xl font-bold text-white">SparkyQ</span>
      </Link>
      <div className="card">
        <h1 className="mb-1 text-lg font-bold text-white">Sign in or create an account</h1>
        <p className="mb-6 text-sm text-ink-400">
          We&apos;ll email you a magic link — no password needed.
        </p>
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-xs text-ink-600">
        By signing in you agree to keep technical content within the verified trade community.
      </p>
    </main>
  );
}
