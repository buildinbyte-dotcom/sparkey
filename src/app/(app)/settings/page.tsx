import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerifiedBadge } from "@/components/Badge";
import { tradeRoleLabel } from "@/lib/constants";
import type { LicenceVerification, Profile } from "@/lib/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: verifications }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    supabase
      .from("licence_verifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  if (!profile) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-white">Account</h1>

      <div className="card space-y-3">
        <h2 className="font-semibold text-white">Profile</h2>
        <Row label="Email" value={user.email ?? "—"} />
        <Row label="Display name" value={profile.display_name} />
        <Row label="Handle" value={`@${profile.handle}`} />
        <Row label="Private name" value={profile.real_name ?? "Not set"} />
        <Row
          label="Role"
          value={`${profile.state} ${tradeRoleLabel(profile.trade_role)}, ${profile.years_experience} yrs`}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400">Verification</span>
          <VerifiedBadge status={profile.verification_status} />
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-white">Licence verification</h2>
        {(verifications ?? []).length === 0 ? (
          <p className="text-sm text-ink-400">
            No licence submitted. Verified members can answer questions and vote — submit your
            licence details from onboarding or contact the team.
          </p>
        ) : (
          (verifications as LicenceVerification[]).map((v) => (
            <div key={v.id} className="rounded-lg border border-ink-800 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-200">
                  {v.state} · {v.licence_number}
                  {v.licence_class && ` · ${v.licence_class}`}
                </span>
                <VerifiedBadge status={v.status} />
              </div>
              {v.checked_at && (
                <p className="mt-1 text-xs text-ink-500">
                  Checked {new Date(v.checked_at).toLocaleDateString("en-AU")}
                </p>
              )}
            </div>
          ))
        )}
        <p className="text-xs text-ink-600">
          We verify licences manually against your state&apos;s public register. We store the
          status of the check, not copies of your documents.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-ink-200">{value}</span>
    </div>
  );
}
