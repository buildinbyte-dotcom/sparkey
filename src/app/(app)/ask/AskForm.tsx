"use client";

import { useActionState, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AU_STATES, JOB_TYPES, RISK_LEVELS, URGENCY_LEVELS } from "@/lib/constants";
import { mediaUrl } from "@/lib/utils";
import type { Tag } from "@/lib/types";
import { createQuestion, type AskState } from "./actions";

const MAX_PHOTOS = 6;

export function AskForm({ tags }: { tags: Tag[] }) {
  const [state, formAction, pending] = useActionState<AskState, FormData>(createQuestion, {});
  const [uploads, setUploads] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadError("");
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploadError("Sign in again to upload photos.");
      setUploading(false);
      return;
    }

    const next: string[] = [];
    for (const file of files.slice(0, MAX_PHOTOS - uploads.length)) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError("Photos must be under 10MB each.");
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("question-media").upload(path, file, {
        contentType: file.type || "image/jpeg",
      });
      if (error) {
        setUploadError("A photo failed to upload — try again.");
      } else {
        next.push(path);
      }
    }
    setUploads((prev) => [...prev, ...next]);
    setUploading(false);
    e.target.value = "";
  }

  return (
    <form action={formAction} className="space-y-5">
      {uploads.map((p) => (
        <input key={p} type="hidden" name="media_paths" value={p} />
      ))}

      <div>
        <label className="mb-1 block text-sm text-ink-300">Title</label>
        <input
          name="title"
          required
          minLength={8}
          maxLength={160}
          placeholder="e.g. RCD nuisance tripping on new solar circuit — what am I missing?"
          className="field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-300">What&apos;s happening?</label>
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={10000}
          rows={7}
          placeholder="Describe the setup, what you've already tested, readings you got, and what you expected…"
          className="field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-ink-300">Photos (optional, max {MAX_PHOTOS})</label>
        <div className="flex flex-wrap gap-2">
          {uploads.map((p) => (
            <div key={p} className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(p)} alt="upload" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setUploads((prev) => prev.filter((u) => u !== p))}
                className="absolute right-0.5 top-0.5 rounded-full bg-ink-950/80 p-0.5 text-ink-300 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {uploads.length < MAX_PHOTOS && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-700 text-ink-500 transition hover:border-spark-400 hover:text-spark-400">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px]">{uploading ? "…" : "Add"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFiles}
                className="sr-only"
                disabled={uploading}
              />
            </label>
          )}
        </div>
        {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-ink-300">State</label>
          <select name="state" required defaultValue="" className="field">
            <option value="" disabled>
              Select
            </option>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink-300">Job type</label>
          <select name="job_type" defaultValue="other" className="field">
            {JOB_TYPES.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-ink-300">Urgency</label>
        <div className="grid gap-2 sm:grid-cols-3">
          {URGENCY_LEVELS.map((u, i) => (
            <label
              key={u.value}
              className="cursor-pointer rounded-lg border border-ink-700 p-3 transition has-checked:border-spark-400 has-checked:bg-spark-400/10"
            >
              <input
                type="radio"
                name="urgency"
                value={u.value}
                defaultChecked={i === 0}
                className="sr-only"
              />
              <span className="block text-sm font-medium text-ink-200">{u.label}</span>
              <span className="block text-xs text-ink-500">{u.description}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-ink-300">How risky is this work?</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {RISK_LEVELS.map((r, i) => (
            <label
              key={r.value}
              className="cursor-pointer rounded-lg border border-ink-700 p-3 transition has-checked:border-spark-400 has-checked:bg-spark-400/10"
            >
              <input
                type="radio"
                name="risk"
                value={r.value}
                defaultChecked={i === 0}
                className="sr-only"
              />
              <span className="block text-sm font-medium text-ink-200">{r.label}</span>
              <span className="block text-xs text-ink-500">{r.description}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-ink-300">Tags (up to 5)</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <label
              key={t.id}
              className="cursor-pointer rounded-full border border-ink-700 px-3 py-1.5 text-xs text-ink-300 transition has-checked:border-spark-400 has-checked:bg-spark-400/10 has-checked:text-spark-300"
            >
              <input type="checkbox" name="tag_ids" value={t.id} className="sr-only" />
              {t.name}
            </label>
          ))}
        </div>
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button type="submit" disabled={pending || uploading} className="btn-primary w-full">
        {pending ? "Posting…" : "Post question"}
      </button>
    </form>
  );
}
