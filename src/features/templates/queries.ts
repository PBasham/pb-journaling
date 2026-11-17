import { useDb } from '@/db';
import type { Template } from '@/db/schema';
import { useLive } from '@/db/useLive';

import { listTemplates } from './templates';

export function useTemplates() {
  const db = useDb();
  return useLive<Template[]>(() => listTemplates(db), ['templates'], [db], []);
}
