"use client";

import { useState } from "react";
import { submitCheckIn, type DailyCheckIn } from "@/lib/api";

interface CheckInFormProps {
  userId: string;
  initialCheckIn: DailyCheckIn | null;
  defaultLocation: string | null;
  onSaved: (checkIn: DailyCheckIn) => void;
}

export default function CheckInForm({
  userId,
  initialCheckIn,
  defaultLocation,
  onSaved,
}: CheckInFormProps) {
  const [mood, setMood] = useState(initialCheckIn?.mood ?? "");
  const [energyLevel, setEnergyLevel] = useState(initialCheckIn?.energy_level ?? "medium");
  const [physicalReadiness, setPhysicalReadiness] = useState(
    initialCheckIn?.physical_readiness ?? "normal"
  );
  const [location, setLocation] = useState(initialCheckIn?.location ?? defaultLocation ?? "");
  const [notes, setNotes] = useState(initialCheckIn?.additional_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const checkIn = await submitCheckIn({
        user_id: userId,
        mood: mood || undefined,
        energy_level: energyLevel || undefined,
        physical_readiness: physicalReadiness || undefined,
        location: location || undefined,
        additional_notes: notes || undefined,
      });
      onSaved(checkIn);
    } catch {
      setError("Couldn't save your check-in. Is the backend running?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-black/10 p-5 dark:border-white/10"
    >
      <h2 className="text-lg font-semibold">How are you doing right now?</h2>

      <label className="flex flex-col gap-1 text-sm">
        Mood
        <input
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          placeholder="e.g. stressed, calm, tired"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Energy level
        <select
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          value={energyLevel}
          onChange={(e) => setEnergyLevel(e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Physical readiness
        <select
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          value={physicalReadiness}
          onChange={(e) => setPhysicalReadiness(e.target.value)}
        >
          <option value="low">Low (sore / fatigued)</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Location
        <input
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          placeholder="e.g. campus, home"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Notes (optional)
        <textarea
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
      >
        {saving ? "Saving..." : "Save check-in"}
      </button>
    </form>
  );
}
