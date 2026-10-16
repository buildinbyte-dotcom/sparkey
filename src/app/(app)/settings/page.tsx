import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerifiedBadge } from "@/components/Badge";
import { ThemeSelector } from "@/components/ThemeToggle";
import { PwaSettingsCard } from "@/components/PwaManager";
import { tradeRoleLabel } from "@/lib/constants";
import type { LicenceVerification, Profile } from "@/lib/types";
import { LicenceSubmitForm, ProfileEditForm } from "./SettingsForms";

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

  const licenceList = (verifications ?? []) as LicenceVerification[];
  const hasActiveOrPendingLicence = licenceList.some(
    (v) => v.status === "pending" || v.status === "verified"
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-ink-50">Account</h1>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-ink-50">Appearance</h2>
          <p className="text-xs text-ink-500">
            Choose Light for bright outdoor job sites, Dark for low glare, or match your device.
          </p>
        </div>
        <ThemeSelector />
      </div>

      <PwaSettingsCard />

      <div className="card space-y-3">
        <h2 className="font-semibold text-ink-50">Profile</h2>
        <Row label="Email" value={user.email ?? "—"} />
        <Row label="Display name" value={profile.display_name} />
        <Row label="Handle" value={`@${profile.handle}`} />
        <Row label="Private name" value={profile.real_name ?? "Not set"} />
        <Row
          label="Role"
          value={`${profile.state} ${tradeRoleLabel(profile.trade_role)}, ${profile.years_experience} yrs`}
        />
        {profile.bio && <Row label="Bio" value={profile.bio} />}
        {(profile.specialisations ?? []).length > 0 && (
          <Row label="Specialisations" value={profile.specialisations.join(", ")} />
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-400">Verification</span>
          <VerifiedBadge status={profile.verification_status} />
        </div>
        <ProfileEditForm profile={profile} />
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold text-ink-50">Licence verification</h2>
        {licenceList.length === 0 ? (
          <p className="text-sm text-ink-400">
            No licence submitted yet. Verified members can answer questions and vote.
          </p>
        ) : (
          licenceList.map((v) => (
            <div key={v.id} className="rounded-lg border border-ink-800 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-200">
                  {v.state} · {v.licence_number}
                  {v.licence_class && ` · ${v.licence_class}`}
                </span>
                <VerifiedBadge status={v.status} />
              </div>
              {v.notes && <p className="mt-1 text-xs text-ink-400">Note: {v.notes}</p>}
              {v.checked_at && (
                <p className="mt-1 text-xs text-ink-500">
                  Checked {new Date(v.checked_at).toLocaleDateString("en-AU")}
                </p>
              )}
            </div>
          ))
        )}
        {!hasActiveOrPendingLicence && <LicenceSubmitForm defaultState={profile.state} />}
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
