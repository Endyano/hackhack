"use client";

import { useEffect, useState } from "react";
import {
  acceptRecommendation,
  formatLocalTime,
  generateRecommendation,
  getActivityHistory,
  getRecommendationContext,
  listUsers,
  OFFLINE_FALLBACK_RECOMMENDATION,
  replaceRecommendation,
  reportActivityResult,
  shortenRecommendation,
  skipRecommendation,
  type ActivityHistoryEntry,
  type CompletionStatus,
  type DailyCheckIn,
  type RecommendationContext,
  type RecommendationResponse,
  type RecommendationStatus,
  type User,
} from "@/lib/api";
import CheckInForm from "./components/CheckInForm";
import RecommendationCard from "./components/RecommendationCard";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [context, setContext] = useState<RecommendationContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [recommendationIsFallback, setRecommendationIsFallback] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationStatus, setRecommendationStatus] = useState<RecommendationStatus | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [history, setHistory] = useState<ActivityHistoryEntry[]>([]);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(() => setUsersError("Couldn't reach the CareShift backend. Is it running on :8001?"));
  }, []);

  async function refreshHistory(userId: string) {
    try {
      setHistory(await getActivityHistory(userId));
    } catch {
      setHistory([]);
    }
  }

  async function selectUser(userId: string) {
    setSelectedUserId(userId);
    setRecommendation(null);
    setRecommendationStatus(null);
    setContextLoading(true);
    try {
      const ctx = await getRecommendationContext(userId);
      setContext(ctx);
    } catch {
      setContext(null);
    } finally {
      setContextLoading(false);
    }
    refreshHistory(userId);
  }

  function handleCheckInSaved(checkIn: DailyCheckIn) {
    setContext((prev) =>
      prev
        ? {
            ...prev,
            latest_check_in: checkIn,
            mood: checkIn.mood,
            energy: checkIn.energy_level,
            location: checkIn.location ?? prev.location,
          }
        : prev
    );
  }

  async function handleGenerate() {
    if (!selectedUserId) return;
    setRecommendationLoading(true);
    setRecommendationStatus(null);
    try {
      const rec = await generateRecommendation(selectedUserId);
      setRecommendation(rec);
      setRecommendationIsFallback(rec.recommendation_id === "offline-fallback");
    } catch {
      // Critical UX rule (CLAUDE.md): never show a visible error -- fall
      // back to the hardcoded recommendation if the backend is unreachable.
      setRecommendation(OFFLINE_FALLBACK_RECOMMENDATION);
      setRecommendationIsFallback(true);
    } finally {
      setRecommendationLoading(false);
    }
  }

  async function handleAccept() {
    if (!recommendation) return;
    setActionLoading(true);
    try {
      const res = await acceptRecommendation(recommendation.recommendation_id);
      setRecommendationStatus(res.status);
    } catch {
      // offline fallback recommendations have no real DB row -- just reflect
      // the intent locally so the demo doesn't visibly break.
      setRecommendationStatus("accepted");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSkip() {
    if (!recommendation) return;
    setActionLoading(true);
    try {
      const res = await skipRecommendation(recommendation.recommendation_id);
      setRecommendationStatus(res.status);
    } catch {
      setRecommendationStatus("skipped");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleShorten() {
    if (!recommendation) return;
    setActionLoading(true);
    try {
      const rec = await shortenRecommendation(recommendation.recommendation_id);
      setRecommendation(rec);
      setRecommendationIsFallback(false);
      setRecommendationStatus(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReplace() {
    if (!recommendation) return;
    setActionLoading(true);
    try {
      const rec = await replaceRecommendation(recommendation.recommendation_id);
      setRecommendation(rec);
      setRecommendationIsFallback(false);
      setRecommendationStatus(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkResult(completionStatus: CompletionStatus) {
    if (!recommendation || !selectedUserId) return;
    setActionLoading(true);
    try {
      await reportActivityResult(selectedUserId, {
        recommendation_id: recommendation.recommendation_id,
        completion_status: completionStatus,
      });
      setRecommendationStatus(completionStatus);
      refreshHistory(selectedUserId);
    } catch {
      setRecommendationStatus(completionStatus);
    } finally {
      setActionLoading(false);
    }
  }

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">CareShift</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Pick a demo user, check in, and get an AI wellbeing recommendation.
        </p>
      </header>

      {usersError && <p className="text-sm text-red-600 dark:text-red-400">{usersError}</p>}

      <section className="flex gap-3">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => selectUser(user.id)}
            className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
              selectedUserId === user.id
                ? "border-transparent bg-foreground text-background"
                : "border-black/15 hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
            }`}
          >
            {user.name}
          </button>
        ))}
      </section>

      {selectedUser && contextLoading && <p className="text-sm text-zinc-500">Loading...</p>}

      {selectedUser && context && !contextLoading && (
        <>
          <section className="rounded-xl border border-black/10 p-5 text-sm dark:border-white/10">
            <h2 className="mb-2 font-semibold">Today&apos;s context for {selectedUser.name}</h2>
            <ul className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
              <li>Goal: {context.goal ?? "--"}</li>
              <li>Experience: {context.experience ?? "--"}</li>
              <li>Recent activity: {context.recent_activity ?? "none logged"}</li>
              <li>
                Next free slot:{" "}
                {context.free_period
                  ? `${formatLocalTime(context.free_period.start_time)} - ${formatLocalTime(
                      context.free_period.end_time
                    )} (${context.free_period.usable_minutes} min)`
                  : "none found today"}
              </li>
            </ul>
          </section>

          <CheckInForm
            userId={selectedUser.id}
            initialCheckIn={context.latest_check_in}
            defaultLocation={context.location}
            onSaved={handleCheckInSaved}
          />

          <button
            onClick={handleGenerate}
            disabled={recommendationLoading}
            className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {recommendationLoading ? "Thinking..." : "Get my recommendation"}
          </button>

          {recommendation && (
            <RecommendationCard
              recommendation={recommendation}
              isFallback={recommendationIsFallback}
              status={recommendationStatus}
              actionLoading={actionLoading}
              onAccept={handleAccept}
              onSkip={handleSkip}
              onShorten={handleShorten}
              onReplace={handleReplace}
              onMarkResult={handleMarkResult}
            />
          )}

          {history.length > 0 && (
            <section className="rounded-xl border border-black/10 p-5 text-sm dark:border-white/10">
              <h2 className="mb-2 font-semibold">Recent activity history</h2>
              <ul className="flex flex-col gap-2">
                {history.map((entry) => (
                  <li key={entry.id} className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>
                      {entry.activity_name} ({entry.duration_minutes} min, {entry.intensity})
                    </span>
                    <span className="capitalize">{entry.completion_status?.replace("_", " ")}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
