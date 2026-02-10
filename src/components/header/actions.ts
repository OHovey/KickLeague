'use server';

import { isDatabaseConfigured, getDb } from '@/db/connection';
import { feedback } from '@/db/schema';

export async function submitFeedback(
  message: string,
  page: string,
  locale: string
): Promise<{ success: boolean; error?: string }> {
  if (!isDatabaseConfigured()) {
    return { success: false, error: 'database_not_configured' };
  }

  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { success: false, error: 'invalid_message' };
  }

  try {
    await getDb().insert(feedback).values({
      message: trimmed,
      page,
      locale,
    });
    return { success: true };
  } catch {
    return { success: false, error: 'submission_failed' };
  }
}
