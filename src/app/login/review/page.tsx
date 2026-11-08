import Link from "next/link";
import { Zap } from "lucide-react";
import { ReviewSignInForm } from "./ReviewSignInForm";

export const metadata = { title: "Review sign-in" };

export default function ReviewSignInPage() {
  return (
    <main className="mx-auto flex min-h-app max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Zap className="h-7 w-7 text-spark-400" />
        <span className="text-xl font-bold text-ink-50">SparkyQ</span>
      </Link>
      <div className="card">
        <h1 className="mb-1 text-lg font-bold text-ink-50">App review sign-in</h1>
        <p className="mb-6 text-sm text-ink-400">
          For App Store and Google Play review only. Members sign in with an emailed code.
        </p>
        <ReviewSignInForm />
      </div>
      <Link href="/login" className="mt-6 text-center text-xs text-ink-500 hover:text-ink-200">
        Back to member sign-in
      </Link>
    </main>
  );
}
