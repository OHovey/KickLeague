---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/db/schema/feedback.ts
  - src/db/schema/index.ts
  - src/components/header/FeedbackDialog.tsx
  - src/components/header/Header.tsx
  - src/components/header/actions.ts
  - src/messages/en.json
  - src/messages/de.json
  - src/messages/fr.json
  - src/messages/it.json
  - src/messages/es.json
autonomous: true
must_haves:
  truths:
    - "User can open a feedback dialog from the navbar"
    - "User can type feedback text and submit it"
    - "Submitted feedback is persisted in the database"
    - "User sees success confirmation after submission"
  artifacts:
    - path: "src/db/schema/feedback.ts"
      provides: "Feedback table definition"
      contains: "pgTable"
    - path: "src/components/header/FeedbackDialog.tsx"
      provides: "Feedback modal/dialog component"
      min_lines: 40
    - path: "src/components/header/actions.ts"
      provides: "Server action to insert feedback"
      exports: ["submitFeedback"]
  key_links:
    - from: "src/components/header/FeedbackDialog.tsx"
      to: "src/components/header/actions.ts"
      via: "server action call on form submit"
      pattern: "submitFeedback"
    - from: "src/components/header/actions.ts"
      to: "src/db/schema/feedback.ts"
      via: "drizzle insert"
      pattern: "feedback"
---

<objective>
Add a "Feedback" button to the site navbar that opens a dialog/modal where users can type and submit feedback. Feedback is saved to a dedicated `feedback` table in PostgreSQL via a server action.

Purpose: Give users a frictionless way to share feedback directly from the site chrome, helping the developer gather real user input.
Output: Feedback button in navbar, dialog component, server action, database table, i18n strings in all 5 locales.
</objective>

<execution_context>
@/Users/oliverhovey/.claude/get-shit-done/workflows/execute-plan.md
@/Users/oliverhovey/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/db/schema/index.ts
@src/db/schema/api-call-log.ts (reference for pgTable pattern)
@src/db/connection.ts (isDatabaseConfigured, getDb pattern)
@src/components/header/Header.tsx
@src/components/stat-highlights/actions.ts (reference for server action pattern)
@src/messages/en.json
@drizzle.config.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create feedback schema and server action</name>
  <files>
    src/db/schema/feedback.ts
    src/db/schema/index.ts
    src/components/header/actions.ts
  </files>
  <action>
1. Create `src/db/schema/feedback.ts` defining a `feedback` pgTable with:
   - `id`: integer, primary key, generatedAlwaysAsIdentity
   - `createdAt`: timestamp with timezone, notNull, defaultNow
   - `message`: varchar('message', { length: 2000 }), notNull
   - `page`: varchar('page', { length: 500 }) — the URL path the user was on when submitting (nullable, for context)
   - `locale`: varchar('locale', { length: 10 }) — which locale the user was using (nullable)
   - Index on `createdAt`

   Follow the exact pattern from `api-call-log.ts` (imports from `drizzle-orm/pg-core`, pgTable with index).

2. Add `export * from './feedback';` to `src/db/schema/index.ts` barrel file.

3. Create `src/components/header/actions.ts` as a server action file:
   - `'use server'` directive at top
   - Import `isDatabaseConfigured`, `getDb` from `@/db/connection`
   - Import `feedback` table from `@/db/schema`
   - Export async function `submitFeedback(message: string, page: string, locale: string): Promise<{ success: boolean; error?: string }>`
   - Check `isDatabaseConfigured()` — if not, return `{ success: false, error: 'database_not_configured' }`
   - Validate: message must be non-empty and <= 2000 chars after trim — if invalid, return `{ success: false, error: 'invalid_message' }`
   - Insert into feedback table using `getDb().insert(feedback).values({ message: message.trim(), page, locale })`
   - Return `{ success: true }` on success, catch errors and return `{ success: false, error: 'submission_failed' }`

4. Run `npx drizzle-kit generate` to create the migration SQL file, then run `npx drizzle-kit push` to apply the migration to the database.
  </action>
  <verify>
    - `npx drizzle-kit generate` succeeds (or reports no changes if already generated)
    - TypeScript compiles: `npx tsc --noEmit --pretty 2>&1 | head -20` shows no errors in the new files
  </verify>
  <done>
    - `feedback` table schema defined and exported from barrel
    - `submitFeedback` server action validates input and inserts into database
    - Migration generated and applied
  </done>
</task>

<task type="auto">
  <name>Task 2: Create feedback dialog and integrate into navbar</name>
  <files>
    src/components/header/FeedbackDialog.tsx
    src/components/header/Header.tsx
    src/messages/en.json
    src/messages/de.json
    src/messages/fr.json
    src/messages/it.json
    src/messages/es.json
  </files>
  <action>
1. Add i18n strings to ALL 5 locale message files under a new `"Feedback"` namespace:
   - `"button"`: "Feedback" / "Feedback" / "Avis" / "Feedback" / "Comentarios"
   - `"title"`: "Send Feedback" / "Feedback senden" / "Envoyer un avis" / "Invia feedback" / "Enviar comentarios"
   - `"placeholder"`: "What's on your mind? Bug reports, feature requests, or general feedback..." / (translate for each locale)
   - `"submit"`: "Submit" / "Senden" / "Envoyer" / "Invia" / "Enviar"
   - `"cancel"`: "Cancel" / "Abbrechen" / "Annuler" / "Annulla" / "Cancelar"
   - `"success"`: "Thanks for your feedback!" / "Danke fur Ihr Feedback!" / "Merci pour votre avis !" / "Grazie per il tuo feedback!" / "Gracias por tus comentarios!"
   - `"error"`: "Failed to submit. Please try again." / (translate for each locale)
   - `"tooLong"`: "Feedback must be under 2000 characters" / (translate for each locale)

2. Create `src/components/header/FeedbackDialog.tsx` — a client component ('use client'):
   - Uses `useTranslations('Feedback')` for all strings
   - Uses `usePathname()` from `@/i18n/navigation` to capture current page
   - Uses `useLocale()` from `next-intl` to capture current locale
   - State: `isOpen` (boolean), `message` (string), `status` ('idle' | 'submitting' | 'success' | 'error')
   - Renders a button (the trigger) that sets `isOpen = true`
     - Button style: `text-sm text-white/70 hover:text-white transition-colors` (matching the Matches nav link inactive style)
     - Button text: `t('button')`
   - When `isOpen`, render a modal overlay:
     - Backdrop: `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm` with onClick to close
     - Dialog: `fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md`
     - Dialog card: `bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl`
     - Title: `text-lg font-semibold text-white mb-4` — `t('title')`
     - Textarea: `w-full h-32 bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm placeholder-white/40 resize-none focus:outline-none focus:border-white/30`
       - maxLength={2000}, value={message}, placeholder={t('placeholder')}
     - Character count: show `{message.length}/2000` in `text-xs text-white/40` below textarea
     - Button row: flex justify-end gap-3
       - Cancel button: `text-sm text-white/60 hover:text-white` — calls close handler (resets state)
       - Submit button: `text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50`
         - Disabled when `message.trim().length === 0` or `status === 'submitting'`
         - Shows "..." or spinner text when submitting
     - On submit: set status='submitting', call `submitFeedback(message, pathname, locale)`, if success set status='success' and after 1.5s close dialog and reset; if error set status='error'
     - Success state: show `t('success')` in green text, auto-close after 1.5s
     - Error state: show `t('error')` in red text below textarea, allow retry
   - Close handler: set isOpen=false, reset message to '', reset status to 'idle'
   - Export the trigger button part as `<FeedbackButton />` so Header can import it

3. Update `src/components/header/Header.tsx`:
   - Import `FeedbackButton` from `./FeedbackDialog`
   - Add `<FeedbackButton />` inside the `<nav>` element, BEFORE the Matches link, so the order is: Feedback | Matches | LanguagePicker
  </action>
  <verify>
    - `npx tsc --noEmit --pretty 2>&1 | head -20` shows no errors
    - `npm run build 2>&1 | tail -30` completes without errors
    - Visually: run dev server, open site, see "Feedback" in navbar, click it, dialog opens with textarea, submit works
  </verify>
  <done>
    - Feedback button visible in navbar across all pages
    - Clicking button opens a glassmorphism modal dialog matching site design
    - User can type feedback (up to 2000 chars with counter), submit it, and see success confirmation
    - Feedback is persisted in the `feedback` database table
    - All strings are translated in all 5 locales (en, de, fr, it, es)
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. Database has `feedback` table (verify with `npx drizzle-kit studio` or direct query)
4. Navigating to the site shows "Feedback" in the navbar
5. Clicking "Feedback" opens a modal dialog
6. Typing text and clicking "Submit" saves to the database and shows success
7. Empty submissions are prevented (button disabled)
8. Switching locale shows translated feedback UI
</verification>

<success_criteria>
- Feedback button is present in navbar on all pages
- Dialog opens, accepts text input, submits to database via server action
- Success/error states display correctly
- All 5 locales have translated strings
- Database migration is generated and applied
</success_criteria>

<output>
After completion, create `.planning/quick/7-add-feedback-option-in-navbar-that-submi/7-SUMMARY.md`
</output>
