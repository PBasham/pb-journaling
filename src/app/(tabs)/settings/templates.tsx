import { useState } from 'react';

import { ConfirmDialog, ListGroup, ListRow, Screen, Section, Text } from '@/components/ui';
import { useDb } from '@/db';
import type { Template } from '@/db/schema';
import { docToPlainText, previewText } from '@/features/editor/document';
import { useTemplates } from '@/features/templates/queries';
import { deleteTemplate, templateDoc } from '@/features/templates/templates';
import { run } from '@/lib/errors';

export default function TemplatesScreen() {
  const db = useDb();
  const { data: templates } = useTemplates();
  const [removing, setRemoving] = useState<Template | null>(null);
  const saved = templates.filter((t) => !t.isBuiltIn);
  const builtIn = templates.filter((t) => t.isBuiltIn);
  const describe = (t: Template) => previewText(docToPlainText(templateDoc(t)), 80) || 'Empty';

  return (
    <Screen safeTop={false}>
      <Text color="textMuted">
        A new note offers these until you start writing. Save your own from any note&apos;s options with Save as template.
      </Text>
      <Section title="Yours" footer={saved.length ? 'Tap one to delete it.' : 'None yet.'}>
        {saved.length ? (
          <ListGroup>
            {saved.map((t, i) => (
              <ListRow key={t.id} icon="bookmark-outline" title={t.name} description={describe(t)} divider={i > 0} onPress={() => setRemoving(t)} />
            ))}
          </ListGroup>
        ) : null}
      </Section>
      <Section title="Built in">
        <ListGroup>
          {builtIn.map((t, i) => (
            <ListRow key={t.id} icon="document-text-outline" title={t.name} description={describe(t)} divider={i > 0} />
          ))}
        </ListGroup>
      </Section>
      <ConfirmDialog
        visible={removing !== null}
        title={`Delete “${removing?.name ?? ''}”?`}
        message="Notes made from it are not changed."
        confirmLabel="Delete"
        destructive
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const t = removing;
          setRemoving(null);
          if (t) run(deleteTemplate(db, t.id), 'Could not delete the template.');
        }}
      />
    </Screen>
  );
}
