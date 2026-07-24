import type { CompletionStatus, RecommendationResponse, RecommendationStatus } from "@/lib/api";

const CATEGORY_STYLES: Record<string, string> = {
  mental: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  physical: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  nutritional: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

const ACTION_BUTTON = "rounded-full border border-black/15 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-black/[.04] disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/[.06]";

interface RecommendationCardProps {
  recommendation: RecommendationResponse;
  isFallback: boolean;
  status: RecommendationStatus | null;
  actionLoading: boolean;
  onAccept: () => void;
  onSkip: () => void;
  onShorten: () => void;
  onReplace: () => void;
  onMarkResult: (status: CompletionStatus) => void;
}

export default function RecommendationCard({
  recommendation,
  isFallback,
  status,
  actionLoading,
  onAccept,
  onSkip,
  onShorten,
  onReplace,
  onMarkResult,
}: RecommendationCardProps) {
  const categoryStyle = CATEGORY_STYLES[recommendation.category] ?? CATEGORY_STYLES.physical;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/10 p-5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${categoryStyle}`}>
          {recommendation.category}
        </span>
        {isFallback && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">offline default</span>
        )}
      </div>

      <h3 className="text-xl font-semibold">{recommendation.activity}</h3>

      <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <span>Start: {recommendation.start_time}</span>
        <span>{recommendation.duration_minutes} min</span>
        <span className="capitalize">{recommendation.intensity}</span>
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">{recommendation.reason}</p>

      {recommendation.carematch.available && (
        <div className="mt-1 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {recommendation.carematch.friend_name} is free too (
          {recommendation.carematch.overlap_start}-{recommendation.carematch.overlap_end}) --
          CareMatch available.
        </div>
      )}

      {status === null && (
        <div className="mt-1 flex flex-wrap gap-2">
          <button className={ACTION_BUTTON} disabled={actionLoading} onClick={onAccept}>
            Accept
          </button>
          <button className={ACTION_BUTTON} disabled={actionLoading} onClick={onShorten}>
            Shorten
          </button>
          <button className={ACTION_BUTTON} disabled={actionLoading} onClick={onReplace}>
            Replace
          </button>
          <button className={ACTION_BUTTON} disabled={actionLoading} onClick={onSkip}>
            Skip
          </button>
        </div>
      )}

      {status === "accepted" && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-green-700 dark:text-green-400">Accepted --</span>
          <button
            className={ACTION_BUTTON}
            disabled={actionLoading}
            onClick={() => onMarkResult("completed")}
          >
            Mark completed
          </button>
          <button
            className={ACTION_BUTTON}
            disabled={actionLoading}
            onClick={() => onMarkResult("partially_completed")}
          >
            Mark partially completed
          </button>
        </div>
      )}

      {status === "skipped" && (
        <span className="text-xs font-medium text-zinc-500">Skipped</span>
      )}

      {(status === "completed" || status === "partially_completed") && (
        <span className="text-xs font-medium text-green-700 dark:text-green-400">
          Marked {status.replace("_", " ")} -- saved to history
        </span>
      )}
    </div>
  );
}
