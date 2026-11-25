import { AlertTriangle, ArrowLeft, Maximize2, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { MultiSelect } from '@/shared/components/forms/multi-select';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { Stepper } from '@/shared/components/forms/stepper';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Field, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

import { TEAM_OPTIONS } from './sample-data';
import { Demo } from './showcase';

function BasicDialog() {
  const { t } = useTranslation('ui-forms');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{t('dialogs.basic')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogs.basicTitle')}</DialogTitle>
          <DialogDescription>{t('dialogs.basicText')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>{t('dialogs.gotIt')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FormDialog() {
  const { t } = useTranslation('ui-forms');
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> {t('dialogs.form')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            notify.success(t('dialogs.invited', { email: email || 'teammate' }));
            setOpen(false);
            setEmail('');
            setTeams([]);
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('dialogs.formTitle')}</DialogTitle>
            <DialogDescription>{t('dialogs.formText')}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="invite-email">{t('dialogs.email')}</FieldLabel>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </Field>
          <Field>
            <FieldLabel>{t('dialogs.role')}</FieldLabel>
            <SegmentedControl
              block
              value={role}
              onChange={setRole}
              options={[
                { value: 'member', label: t('dialogs.member') },
                { value: 'admin', label: t('dialogs.admin') },
              ]}
            />
          </Field>
          <Field>
            <FieldLabel>{t('dialogs.teams')}</FieldLabel>
            <MultiSelect options={TEAM_OPTIONS} value={teams} onChange={setTeams} />
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {t('dialogs.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit">{t('dialogs.sendInvite')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TypedConfirmDialog() {
  const { t } = useTranslation('ui-forms');
  const name = 'acme-production';
  const [typed, setTyped] = useState('');
  return (
    <Dialog onOpenChange={() => setTyped('')}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 /> {t('dialogs.typed')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </span>
          <DialogTitle>{t('dialogs.typedTitle')}</DialogTitle>
          <DialogDescription>{t('dialogs.typedText')}</DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="confirm-name" className="font-normal">
            {t('dialogs.typeToConfirm')}{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{name}</code>
          </FieldLabel>
          <Input
            id="confirm-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="font-mono"
          />
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t('dialogs.cancel')}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="destructive"
              disabled={typed !== name}
              onClick={() =>
                notify.undoable(
                  t('dialogs.deleted', { name }),
                  () => notify.info(t('dialogs.restored')),
                  {
                    undoLabel: t('dialogs.undo'),
                  },
                )
              }
            >
              {t('dialogs.deleteForever')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScrollDialog() {
  const { t } = useTranslation('ui-forms');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{t('dialogs.scroll')}</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="border-b p-4">
          <DialogTitle>{t('dialogs.scrollTitle')}</DialogTitle>
          <DialogDescription>{t('dialogs.scrollText')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto p-4 text-sm leading-relaxed text-muted-foreground">
          {Array.from({ length: 8 }, (_, i) => (
            <section key={i} className="space-y-1">
              <h3 className="font-medium text-foreground">
                {i + 1}. {t(`dialogs.terms.${(i % 4) as 0 | 1 | 2 | 3}`)}
              </h3>
              <p>{t('dialogs.termsBody')}</p>
            </section>
          ))}
        </div>
        <DialogFooter className="m-0 border-t p-4">
          <DialogClose asChild>
            <Button variant="ghost">{t('dialogs.decline')}</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>{t('dialogs.accept')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FullscreenDialog() {
  const { t } = useTranslation('ui-forms');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Maximize2 /> {t('dialogs.fullscreen')}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[calc(100svh-2rem)] max-w-[calc(100vw-2rem)] flex-col sm:max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>{t('dialogs.fullscreenTitle')}</DialogTitle>
          <DialogDescription>{t('dialogs.fullscreenText')}</DialogDescription>
        </DialogHeader>
        <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-[1fr_20rem]">
          <Textarea
            className="h-full resize-none font-mono text-sm"
            defaultValue={'# Release notes\n\n- Faster dashboards\n- New table filters\n'}
          />
          <aside className="space-y-4 rounded-lg border p-4">
            <SwitchRow
              label={t('dialogs.publish')}
              description={t('dialogs.publishHint')}
              defaultChecked
            />
            <SwitchRow label={t('dialogs.notify')} description={t('dialogs.notifyHint')} />
          </aside>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>{t('dialogs.done')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MultiStepDialog() {
  const { t } = useTranslation('ui-forms');
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const steps = [
    { key: 'source', title: t('dialogs.stepSource') },
    { key: 'map', title: t('dialogs.stepMap') },
    { key: 'review', title: t('dialogs.stepReview') },
  ];
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setStep(0);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">{t('dialogs.multiStep')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('dialogs.importTitle')}</DialogTitle>
          <DialogDescription>{t('dialogs.importText')}</DialogDescription>
        </DialogHeader>
        <Stepper steps={steps} current={step} className="py-2" />
        <div className="min-h-24 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {t(`dialogs.stepBody.${step as 0 | 1 | 2}`)}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft /> {t('wizard.back')}
          </Button>
          <Button
            onClick={() => {
              if (step < steps.length - 1) return setStep((s) => s + 1);
              notify.promise(new Promise((r) => setTimeout(r, 1200)), {
                loading: t('dialogs.importing'),
                success: t('dialogs.imported'),
                error: t('dialogs.importFailed'),
              });
              setOpen(false);
              setStep(0);
            }}
          >
            {step < steps.length - 1 ? t('wizard.next') : t('dialogs.startImport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NestedDialog() {
  const { t } = useTranslation('ui-forms');
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{t('dialogs.nested')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dialogs.nestedTitle')}</DialogTitle>
          <DialogDescription>{t('dialogs.nestedText')}</DialogDescription>
        </DialogHeader>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">{t('dialogs.openAnother')}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>{t('dialogs.innerTitle')}</DialogTitle>
              <DialogDescription>{t('dialogs.innerText')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>{t('dialogs.close')}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function AlertDialogDemo() {
  const { t } = useTranslation('ui-forms');
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">{t('dialogs.alert')}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('dialogs.alertTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('dialogs.alertText')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('dialogs.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => notify.success(t('dialogs.revoked'))}
          >
            {t('dialogs.revoke')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Every dialog pattern in one card grid. */
export function DialogDemos() {
  const { t } = useTranslation('ui-forms');
  return (
    <>
      <Demo title={t('dialogs.title')} description={t('dialogs.description')} wide>
        <div className="flex flex-wrap gap-2">
          <BasicDialog />
          <FormDialog />
          <ScrollDialog />
          <FullscreenDialog />
          <MultiStepDialog />
          <NestedDialog />
        </div>
      </Demo>
      <Demo title={t('dialogs.destructiveTitle')} description={t('dialogs.destructiveText')}>
        <div className="flex flex-wrap gap-2">
          <AlertDialogDemo />
          <TypedConfirmDialog />
        </div>
      </Demo>
    </>
  );
}
