import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerifiedBadge } from "@/components/Badge";
import { BlockButton } from "@/components/BlockButton";
import { ThemeSelector } from "@/components/ThemeToggle";
import { PwaSettingsCard } from "@/components/PwaManager";
import { PUBLIC_PROFILE_COLUMNS, tradeRoleLabel } from "@/lib/constants";
import type { LicenceVerification, Profile } from "@/lib/types";
import { DeleteAccountForm, LicenceSubmitForm, ProfileEditForm } from "./SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: publicProfile }, { data: realNames }, { data: verifications }, { data: blocks }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(PUBLIC_PROFILE_COLUMNS)
        .eq("id", user.id)
        .maybeSingle<Profile>(),
      // real_name is column-protected; only this function returns it (to its owner)
      supabase.rpc("get_real_names", { p_ids: [user.id] }),
      supabase
        .from("licence_verifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("user_blocks")
        .select("blocked:profiles!user_blocks_blocked_id_fkey (id, handle, display_name)")
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
  if (!publicProfile) redirect("/onboarding");
  const profile: Profile = {
    ...publicProfile,
    real_name: (realNames as { real_name: string | null }[] | null)?.[0]?.real_name ?? null,
  };

  const licenceList = (verifications ?? []) as LicenceVerification[];
  const blockedMembers = (blocks ?? [])
    .map((b) => b.blocked as unknown as Pick<Profile, "id" | "handle" | "display_name"> | null)
    .filter((p) => p !== null);
  // Verified members never resubmit, even if their check predates licence records
  const hasActiveOrPendingLicence =
    profile.verification_status === "verified" ||
    licenceList.some((v) => v.status === "pending" || v.status === "verified");

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

      <div className="card space-y-3">
        <h2 className="font-semibold text-ink-50">Blocked members</h2>
        {blockedMembers.length === 0 ? (
          <p className="text-sm text-ink-400">
            You haven&apos;t blocked anyone. Use Block on a post or profile to hide someone&apos;s
            content.
          </p>
        ) : (
          blockedMembers.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
              <Link href={`/u/${m.handle}`} className="text-ink-200 hover:text-ink-50">
                {m.display_name} <span className="text-ink-500">@{m.handle}</span>
              </Link>
              <BlockButton userId={m.id} displayName={m.display_name} blocked />
            </div>
          ))
        )}
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-ink-50">Privacy &amp; support</h2>
        <div className="flex gap-2">
          <Link href="/privacy" className="btn-secondary text-xs">
            Privacy policy
          </Link>
          <Link href="/support" className="btn-secondary text-xs">
            Support
          </Link>
        </div>
      </div>

      <div className="card space-y-3 border-red-300 dark:border-red-900">
        <h2 className="font-semibold text-ink-50">Delete account</h2>
        <DeleteAccountForm />
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
