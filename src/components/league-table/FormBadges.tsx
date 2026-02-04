'use client';

const RESULT_COLORS: Record<string, string> = {
  W: 'bg-green-500',
  D: 'bg-gray-400',
  L: 'bg-red-500',
};

interface FormBadgesProps {
  form: string | null;
}

export function FormBadges({ form }: FormBadgesProps) {
  if (!form || form.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      {form.split('').map((result, index) => {
        const colorClass = RESULT_COLORS[result] || 'bg-gray-600';
        return (
          <span
            key={index}
            className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-white ${colorClass}`}
          >
            {result}
          </span>
        );
      })}
    </div>
  );
}
