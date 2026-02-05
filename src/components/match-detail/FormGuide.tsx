// Form guide for both teams, reusing the color pattern from FormBadges

// ── Form Colors (matching FormBadges pattern) ──────────────────────────────

const RESULT_COLORS: Record<string, string> = {
  W: 'bg-green-500',
  D: 'bg-gray-400',
  L: 'bg-red-500',
};

// ── Form Summary ───────────────────────────────────────────────────────────

function getFormSummary(form: string): string {
  const wins = (form.match(/W/g) || []).length;
  const draws = (form.match(/D/g) || []).length;
  const losses = (form.match(/L/g) || []).length;

  const parts: string[] = [];
  if (wins > 0) parts.push(`W${wins}`);
  if (draws > 0) parts.push(`D${draws}`);
  if (losses > 0) parts.push(`L${losses}`);

  return parts.join(' ');
}

// ── Form Badges ────────────────────────────────────────────────────────────

function FormBadgesInline({ form }: { form: string }) {
  return (
    <div className="flex items-center gap-1">
      {form.split('').map((result, index) => {
        const colorClass = RESULT_COLORS[result] || 'bg-gray-600';
        return (
          <span
            key={index}
            className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white ${colorClass}`}
          >
            {result}
          </span>
        );
      })}
    </div>
  );
}

// ── Team Form Row ──────────────────────────────────────────────────────────

function TeamFormRow({
  teamName,
  form,
}: {
  teamName: string;
  form: string | null;
}) {
  if (!form) {
    return (
      <div className="flex items-center gap-3">
        <span className="w-32 shrink-0 text-sm font-medium text-white/70 truncate">
          {teamName}
        </span>
        <span className="text-xs text-white/30">No form data</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-sm font-medium text-white/70 truncate">
        {teamName}
      </span>
      <FormBadgesInline form={form} />
      <span className="text-xs text-white/40">{getFormSummary(form)}</span>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

interface FormGuideProps {
  homeTeamName: string;
  awayTeamName: string;
  homeForm: string | null;
  awayForm: string | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export function FormGuide({
  homeTeamName,
  awayTeamName,
  homeForm,
  awayForm,
}: FormGuideProps) {
  return (
    <section className="mt-6 rounded-xl bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Form Guide</h2>
      <div className="space-y-3">
        <TeamFormRow teamName={homeTeamName} form={homeForm} />
        <TeamFormRow teamName={awayTeamName} form={awayForm} />
      </div>
    </section>
  );
}
