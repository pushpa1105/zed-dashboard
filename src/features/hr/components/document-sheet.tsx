import { History } from 'lucide-react';

import { useTranslation } from '@/core/i18n/use-translation';
import { VerticalTimeline } from '@/shared/components/timeline/vertical-timeline';
import { Progress } from '@/shared/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { useRemindDocument } from '../api/people-ops-api';
import { longDate, percent, shortDate } from '../lib/format';
import { pendingOf, type Acknowledgement, type HrDocument } from '../model/documents';

import { FactGrid, PersonLink, RemindButton } from './hr-parts';

export function DocumentRemindButton({ doc }: { doc: HrDocument }) {
  const remind = useRemindDocument();
  const pending = pendingOf(doc);
  return (
    <RemindButton
      reminded={pending.length > 0 && pending.every((a) => a.remindedAt)}
      disabled={!pending.length || remind.isPending}
      onRemind={() => remind.mutate(doc.id)}
    />
  );
}

function PeopleList({
  people,
  note,
  empty,
}: {
  people: Acknowledgement[];
  note: (a: Acknowledgement) => string;
  empty: string;
}) {
  if (!people.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="divide-y rounded-lg border">
      {people.map((a) => (
        <li key={a.personId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <PersonLink personId={a.personId} name={a.name} />
          <span className="shrink-0 text-xs text-muted-foreground">{note(a)}</span>
        </li>
      ))}
    </ul>
  );
}

type DocumentSheetProps = {
  doc: HrDocument | undefined;
  onOpenChange: (open: boolean) => void;
};

export function DocumentSheet({ doc, onOpenChange }: DocumentSheetProps) {
  const { t } = useTranslation('hr');
  const pending = doc ? pendingOf(doc) : [];
  const signed = doc ? doc.acknowledgements.filter((a) => a.signedAt) : [];

  return (
    <Sheet open={!!doc} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {doc && (
          <>
            <SheetHeader>
              <p className="text-xs text-muted-foreground">
                {t(`documents.kinds.${doc.kind}`)} · {t(`documents.categories.${doc.category}`)}
              </p>
              <SheetTitle>{doc.title}</SheetTitle>
              <SheetDescription>
                {t('documents.versionLabel', { version: doc.version })}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <FactGrid
                items={[
                  { label: t('documents.fields.owner'), value: doc.owner },
                  { label: t('documents.fields.updated'), value: longDate(doc.updatedAt) },
                  { label: t('documents.fields.due'), value: longDate(doc.dueDate) },
                  { label: t('documents.fields.audience'), value: doc.acknowledgements.length },
                ]}
              />
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">
                    {t('documents.signedOf', {
                      signed: signed.length,
                      total: doc.acknowledgements.length,
                    })}
                  </span>
                  <DocumentRemindButton doc={doc} />
                </div>
                <Progress
                  value={percent(signed.length, doc.acknowledgements.length)}
                  className="h-2"
                />
              </section>
              <Tabs defaultValue="pending">
                <TabsList className="w-full">
                  <TabsTrigger value="pending">
                    {t('documents.tabs.pending', { count: pending.length })}
                  </TabsTrigger>
                  <TabsTrigger value="signed">
                    {t('documents.tabs.signed', { count: signed.length })}
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History /> {t('documents.tabs.history')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="pt-2">
                  <PeopleList
                    people={pending}
                    empty={t('documents.allSigned')}
                    note={(a) =>
                      a.remindedAt
                        ? t('documents.remindedOn', { date: shortDate(a.remindedAt) })
                        : a.department
                    }
                  />
                </TabsContent>
                <TabsContent value="signed" className="pt-2">
                  <PeopleList
                    people={signed}
                    empty={t('documents.noneSigned')}
                    note={(a) => shortDate(a.signedAt!)}
                  />
                </TabsContent>
                <TabsContent value="history" className="pt-4">
                  <VerticalTimeline
                    items={doc.versions.map((v, i) => ({
                      id: v.version,
                      title: t('documents.versionLabel', { version: v.version }),
                      time: longDate(v.date),
                      description: `${v.note} · ${v.author}`,
                      tone: i === 0 ? 'primary' : 'neutral',
                    }))}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
