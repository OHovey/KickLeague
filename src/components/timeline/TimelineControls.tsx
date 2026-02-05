'use client';

interface TimelineControlsProps {
  isPlaying: boolean;
  onToggle: () => void;
  isAtEnd: boolean;
}

function PlayIcon() {
  return (
    <svg
      className="h-4 w-4 text-white/80"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      className="h-4 w-4 text-white/80"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg
      className="h-4 w-4 text-white/80"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
    </svg>
  );
}

export function TimelineControls({
  isPlaying,
  onToggle,
  isAtEnd,
}: TimelineControlsProps) {
  const label = isPlaying
    ? 'Pause season timeline'
    : isAtEnd
      ? 'Replay season timeline'
      : 'Play season timeline';

  const Icon = isPlaying ? PauseIcon : isAtEnd ? ReplayIcon : PlayIcon;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
    >
      <Icon />
    </button>
  );
}
