import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Bookmark,
  Building2,
  CalendarClock,
  Clock,
  CreditCard,
  Globe,
  Heart,
  Italic,
  Laptop,
  Moon,
  Search,
  Star,
  Sun,
  Underline,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { demoFormsApi } from '@/features/ui-forms/api/ui-forms-api';
import { AvatarUpload } from '@/shared/components/forms/avatar-upload';
import { ChipGroup } from '@/shared/components/forms/chip-group';
import { FileDropzone } from '@/shared/components/forms/file-dropzone';
import { FloatingLabelInput } from '@/shared/components/forms/floating-label-input';
import { MaskedInput } from '@/shared/components/forms/masked-input';
import { cardBrand, MASKS, unmask } from '@/shared/components/forms/masks';
import { RichTextEditor } from '@/shared/components/forms/rich-text-editor';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { SignaturePad } from '@/shared/components/forms/signature-pad';
import { SliderField } from '@/shared/components/forms/slider-field';
import { StatusInput, type InputStatus } from '@/shared/components/forms/status-input';
import { SwitchRow } from '@/shared/components/forms/switch-row';
import { TagInput } from '@/shared/components/forms/tag-input';
import { TreeSelect, type TreeNode } from '@/shared/components/forms/tree-select';
import { ButtonUpload, GalleryUpload } from '@/shared/components/forms/upload-variants';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Toggle } from '@/shared/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { DemoLabel, ValuePreview } from '../showcase';

const ORG_TREE: TreeNode[] = [
  {
    value: 'eng',
    label: 'Engineering',
    children: [
      { value: 'eng-web', label: 'Web platform' },
      { value: 'eng-mobile', label: 'Mobile' },
      {
        value: 'eng-infra',
        label: 'Infrastructure',
        children: [
          { value: 'eng-sre', label: 'SRE' },
          { value: 'eng-sec', label: 'Security' },
        ],
      },
    ],
  },
  {
    value: 'gtm',
    label: 'Go-to-market',
    children: [
      { value: 'gtm-sales', label: 'Sales' },
      { value: 'gtm-mkt', label: 'Marketing' },
      { value: 'gtm-cs', label: 'Customer success', disabled: true },
    ],
  },
  {
    value: 'ops',
    label: 'Operations',
    children: [
      { value: 'ops-fin', label: 'Finance' },
      { value: 'ops-people', label: 'People' },
    ],
  },
];

/* ------------------------------------------------------------- sizes */

export function SizesDemo() {
  const { t } = useTranslation('ui-forms');
  const sizes = [
    { key: 'sm', input: 'h-8 text-[0.8125rem]', select: 'sm' as const, button: 'sm' as const },
    { key: 'default', input: '', select: 'default' as const, button: 'default' as const },
    { key: 'lg', input: 'h-10', select: 'default' as const, button: 'lg' as const },
  ] as const;
  return (
    <div className="space-y-4">
      {sizes.map((s) => (
        <div key={s.key} className="grid items-center gap-3 md:grid-cols-[4.5rem_1fr_1fr_1fr_auto]">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            {t(`inputs.sizes.${s.key}`)}
          </span>
          <Input
            aria-label={t('inputs.sizes.input')}
            placeholder={t('inputs.sizes.input')}
            className={s.input}
          />
          <Select defaultValue="weekly">
            <SelectTrigger
              size={s.select}
              className={cn('w-full', s.key === 'lg' && 'h-10')}
              aria-label={t('inputs.sizes.select')}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('inputs.freq.daily')}</SelectItem>
              <SelectItem value="weekly">{t('inputs.freq.weekly')}</SelectItem>
              <SelectItem value="monthly">{t('inputs.freq.monthly')}</SelectItem>
            </SelectContent>
          </Select>
          <TreeSelect data={ORG_TREE} size={s.key} placeholder={t('inputs.sizes.tree')} />
          <Button size={s.button}>{t('inputs.sizes.button')}</Button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- floating labels */

export function FloatingLabelsDemo() {
  const { t } = useTranslation('ui-forms');
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FloatingLabelInput label={t('inputs.floating.fullName')} defaultValue="Ines Duarte" />
      <FloatingLabelInput label={t('inputs.floating.email')} type="email" />
      <FloatingLabelInput label={t('inputs.floating.company')} variant="filled" />
      <FloatingLabelInput
        label={t('inputs.floating.website')}
        variant="filled"
        defaultValue="northwind"
        invalid
        hint={t('inputs.floating.websiteError')}
      />
    </div>
  );
}

/* ------------------------------------------------------------- masks */

export function MasksDemo() {
  const { t } = useTranslation('ui-forms');
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [iban, setIban] = useState('');
  const brand = cardBrand(unmask(card));
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <DemoLabel>{t('inputs.masks.card')}</DemoLabel>
        <MaskedInput
          mask={MASKS.card}
          value={card}
          onChange={setCard}
          leading={<CreditCard className="size-4" />}
          trailing={
            brand && (
              <span className="text-[0.625rem] font-semibold tracking-wider uppercase">
                {brand}
              </span>
            )
          }
        />
      </div>
      <div>
        <DemoLabel>{t('inputs.masks.iban')}</DemoLabel>
        <MaskedInput
          mask={MASKS.iban}
          value={iban}
          onChange={setIban}
          uppercase
          leading={<Building2 className="size-4" />}
        />
      </div>
      <div>
        <DemoLabel>{t('inputs.masks.phone')}</DemoLabel>
        <MaskedInput mask={MASKS.phoneUs} defaultValue="4155550142" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <DemoLabel>{t('inputs.masks.date')}</DemoLabel>
          <MaskedInput
            mask={MASKS.date}
            placeholder="DD/MM/YYYY"
            leading={<CalendarClock className="size-4" />}
          />
        </div>
        <div>
          <DemoLabel>{t('inputs.masks.time')}</DemoLabel>
          <MaskedInput
            mask={MASKS.time}
            placeholder="HH:MM"
            leading={<Clock className="size-4" />}
          />
        </div>
      </div>
      <ValuePreview
        label={t('inputs.masks.raw')}
        value={{ card: unmask(card), iban: unmask(iban) }}
      />
    </div>
  );
}

/* ------------------------------------------------------------- validation icons */

const TAKEN = ['admin', 'hannah', 'support', 'root'];

/** Debounced async-looking check.  is derived, so the effect only sets state from a timer. */
function useDebouncedCheck(
  value: string,
  check: (v: string) => boolean,
  minLength = 3,
): InputStatus {
  const [result, setResult] = useState<{ value: string; ok: boolean } | null>(null);
  useEffect(() => {
    if (value.length < minLength) return;
    const timer = window.setTimeout(() => setResult({ value, ok: check(value) }), 600);
    return () => window.clearTimeout(timer);
    // `check` is a stable module-level predicate in every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, minLength]);
  if (value.length < minLength) return 'idle';
  if (result?.value !== value) return 'validating';
  return result.ok ? 'valid' : 'invalid';
}

const usernameOk = (v: string) => /^[a-z0-9_]+$/.test(v) && !TAKEN.includes(v.toLowerCase());
const urlOk = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]{2,}$/.test(v);
const couponOk = (v: string) => ['WELCOME10', 'TEAM25'].includes(v.toUpperCase());

export function ValidationDemo() {
  const { t } = useTranslation('ui-forms');
  const [username, setUsername] = useState('hannah');
  const [url, setUrl] = useState('https://northwind.io');
  const [coupon, setCoupon] = useState('');
  const [search, setSearch] = useState('quarterly report');
  const uStatus = useDebouncedCheck(username, usernameOk);
  const urlStatus = useDebouncedCheck(url, urlOk, 8);
  const cStatus = useDebouncedCheck(coupon, couponOk, 4);

  const message = (status: InputStatus, ok: string, bad: string) =>
    status === 'valid' ? (
      <p className="text-xs text-success">{ok}</p>
    ) : status === 'invalid' ? (
      <p className="text-xs text-destructive">{bad}</p>
    ) : (
      <p className="text-xs text-muted-foreground">&nbsp;</p>
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-1.5">
        <DemoLabel>{t('inputs.validation.username')}</DemoLabel>
        <StatusInput
          value={username}
          onChange={setUsername}
          status={uStatus}
          clearable
          leading="@"
        />
        {message(uStatus, t('inputs.validation.usernameOk'), t('inputs.validation.usernameTaken'))}
      </div>
      <div className="space-y-1.5">
        <DemoLabel>{t('inputs.validation.website')}</DemoLabel>
        <StatusInput
          value={url}
          onChange={setUrl}
          status={urlStatus}
          clearable
          leading={<Globe />}
        />
        {message(urlStatus, t('inputs.validation.urlOk'), t('inputs.validation.urlBad'))}
      </div>
      <div className="space-y-1.5">
        <DemoLabel>{t('inputs.validation.coupon')}</DemoLabel>
        <StatusInput
          value={coupon}
          onChange={(v) => setCoupon(v.toUpperCase())}
          status={cStatus}
          placeholder="WELCOME10"
        />
        {message(cStatus, t('inputs.validation.couponOk'), t('inputs.validation.couponBad'))}
      </div>
      <div className="space-y-1.5">
        <DemoLabel>{t('inputs.validation.search')}</DemoLabel>
        <StatusInput value={search} onChange={setSearch} clearable leading={<Search />} size="lg" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- rich text + signature */

const RELEASE_NOTES_HTML =
  '<h2>Q4 launch notes</h2><p>The new <b>scheduled reports</b> ship on <i>Tuesday</i>. Before then:</p><ul><li>Finish the onboarding emails</li><li>Record the walkthrough video</li></ul>';
const RELEASE_NOTES_TEXT = RELEASE_NOTES_HTML.replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function RichTextDemo() {
  const { t } = useTranslation('ui-forms');
  const [text, setText] = useState(RELEASE_NOTES_TEXT);
  return (
    <div className="space-y-3">
      <RichTextEditor
        maxLength={600}
        placeholder={t('inputs.rich.placeholder')}
        defaultValue={RELEASE_NOTES_HTML}
        onChange={(_, plain) => setText(plain)}
        labels={{
          bold: t('inputs.rich.bold'),
          italic: t('inputs.rich.italic'),
          underline: t('inputs.rich.underline'),
          strike: t('inputs.rich.strike'),
          heading: t('inputs.rich.heading'),
          paragraph: t('inputs.rich.paragraph'),
          quote: t('inputs.rich.quote'),
          bullet: t('inputs.rich.bullet'),
          ordered: t('inputs.rich.ordered'),
          link: t('inputs.rich.link'),
          unlink: t('inputs.rich.unlink'),
          undo: t('inputs.rich.undo'),
          redo: t('inputs.rich.redo'),
          linkPrompt: t('inputs.rich.linkPrompt'),
        }}
      />
      <p className="text-xs text-muted-foreground">
        {t('inputs.rich.words', { count: text ? text.split(/\s+/).length : 0 })}
      </p>
    </div>
  );
}

export function SignatureDemo() {
  const { t } = useTranslation('ui-forms');
  const [signed, setSigned] = useState(false);
  return (
    <div className="space-y-3">
      <SignaturePad
        placeholder={t('inputs.signature.placeholder')}
        clearLabel={t('inputs.signature.clear')}
        undoLabel={t('inputs.signature.undo')}
        onChange={(url) => setSigned(!!url)}
      />
      <p className="text-xs text-muted-foreground">
        {signed ? t('inputs.signature.signed') : t('inputs.signature.unsigned')}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- tree select */

export function TreeSelectDemo() {
  const { t } = useTranslation('ui-forms');
  const [single, setSingle] = useState<string[]>(['eng-web']);
  const [multi, setMulti] = useState<string[]>(['eng-sre', 'gtm-sales']);
  const [folder, setFolder] = useState<string[]>([]);
  const lazyRoots: TreeNode[] = [
    { value: '/shared', label: 'Shared drive', hasChildren: true },
    { value: '/personal', label: 'My files', hasChildren: true },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <DemoLabel>{t('inputs.tree.single')}</DemoLabel>
        <TreeSelect
          data={ORG_TREE}
          mode="single"
          value={single}
          onChange={setSingle}
          searchable
          clearable
          searchPlaceholder={t('inputs.tree.filter')}
        />
      </div>
      <div>
        <DemoLabel>{t('inputs.tree.multi')}</DemoLabel>
        <TreeSelect
          data={ORG_TREE}
          value={multi}
          onChange={setMulti}
          searchable
          searchPlaceholder={t('inputs.tree.filter')}
        />
      </div>
      <div>
        <DemoLabel>{t('inputs.tree.async')}</DemoLabel>
        <TreeSelect
          data={lazyRoots}
          mode="single"
          defaultExpanded={[]}
          value={folder}
          onChange={setFolder}
          placeholder={t('inputs.tree.pickFolder')}
          loadChildren={(node) => demoFormsApi.treeChildren(node.value)}
        />
      </div>
      <ValuePreview value={{ single, multi, folder }} />
      <div className="sm:col-span-2">
        <DemoLabel>{t('inputs.tree.inline')}</DemoLabel>
        <TreeSelect
          data={ORG_TREE}
          inline
          searchable
          defaultValue={['ops-fin']}
          searchPlaceholder={t('inputs.tree.filter')}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- chips & tags */

export function ChipsDemo() {
  const { t } = useTranslation('ui-forms');
  const jobOptions = (
    ['remote', 'hybrid', 'onsite', 'fullTime', 'contract', 'senior'] as const
  ).map((k) => ({
    value: k,
    label: t(`inputs.chips.options.${k}`),
  }));
  return (
    <div className="space-y-5">
      <div>
        <DemoLabel>{t('inputs.chips.soft')}</DemoLabel>
        <ChipGroup
          options={jobOptions}
          defaultValue={['remote', 'fullTime']}
          label={t('inputs.chips.soft')}
        />
      </div>
      <div>
        <DemoLabel>{t('inputs.chips.solid')}</DemoLabel>
        <ChipGroup
          options={jobOptions.slice(0, 3)}
          multiple={false}
          variant="solid"
          defaultValue={['hybrid']}
          label={t('inputs.chips.solid')}
        />
      </div>
      <div>
        <DemoLabel>{t('inputs.chips.outline')}</DemoLabel>
        <ChipGroup
          options={jobOptions}
          variant="outline"
          size="sm"
          defaultValue={['senior']}
          label={t('inputs.chips.outline')}
        />
      </div>
      <div>
        <DemoLabel>{t('inputs.chips.tags')}</DemoLabel>
        <TagInput
          defaultValue={['design-system', 'q4', 'launch']}
          placeholder={t('inputs.chips.tagsPlaceholder')}
          lowercase
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- sliders */

export function SlidersDemo() {
  const { t } = useTranslation('ui-forms');
  const [volume, setVolume] = useState([40]);
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_auto]">
      <div className="space-y-8">
        <div>
          <DemoLabel>{t('inputs.sliders.marks')}</DemoLabel>
          <SliderField
            defaultValue={[50]}
            step={25}
            marks={[0, 25, 50, 75, 100].map((v) => ({ value: v, label: `${v}%` }))}
            tooltip="none"
            thumbLabels={[t('inputs.sliders.marks')]}
          />
        </div>
        <div>
          <DemoLabel>{t('inputs.sliders.range')}</DemoLabel>
          <SliderField
            defaultValue={[120, 640]}
            min={0}
            max={1000}
            step={10}
            tooltip="always"
            formatValue={(v) => `$${v}`}
            thumbLabels={[t('inputs.sliders.min'), t('inputs.sliders.max')]}
          />
        </div>
        <div>
          <DemoLabel>{t('inputs.sliders.stepped')}</DemoLabel>
          <SliderField
            defaultValue={[3]}
            min={1}
            max={5}
            step={1}
            marks={([1, 2, 3, 4, 5] as const).map((v) => ({
              value: v,
              label: t(`inputs.sliders.levels.${v}`),
            }))}
            tooltip="none"
            thumbLabels={[t('inputs.sliders.stepped')]}
          />
        </div>
      </div>
      <div className="flex items-end justify-center gap-8 md:border-l md:pl-8">
        <div className="flex flex-col items-center gap-2">
          <SliderField
            orientation="vertical"
            value={volume}
            onChange={setVolume}
            tooltip="active"
            height={180}
            thumbLabels={[t('inputs.sliders.volume')]}
          />
          <span className="text-xs text-muted-foreground tabular-nums">
            {t('inputs.sliders.volume')} {volume[0]}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <SliderField
            orientation="vertical"
            defaultValue={[20, 70]}
            tooltip="none"
            height={180}
            thumbLabels={[t('inputs.sliders.min'), t('inputs.sliders.max')]}
          />
          <span className="text-xs text-muted-foreground">{t('inputs.sliders.band')}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- toggles */

export function TogglesDemo() {
  const { t } = useTranslation('ui-forms');
  const [theme, setTheme] = useState('system');
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch id="sw-sm" size="sm" defaultChecked />
          <Label htmlFor="sw-sm" className="font-normal">
            {t('inputs.toggles.small')}
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="sw-md" defaultChecked />
          <Label htmlFor="sw-md" className="font-normal">
            {t('inputs.toggles.default')}
          </Label>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <Label htmlFor="sw-right" className="font-normal">
            {t('inputs.toggles.labelLeft')}
          </Label>
          <Switch id="sw-right" />
        </div>
        <div className="flex items-center gap-3 opacity-100">
          <Switch id="sw-dis" disabled defaultChecked />
          <Label htmlFor="sw-dis" className="font-normal text-muted-foreground">
            {t('inputs.toggles.disabled')}
          </Label>
        </div>
        <SwitchRow
          label={t('inputs.toggles.rowLabel')}
          description={t('inputs.toggles.rowDescription')}
          defaultChecked
        />
      </div>
      <div className="space-y-5">
        <div>
          <DemoLabel>{t('inputs.toggles.group')}</DemoLabel>
          <ToggleGroup
            type="multiple"
            variant="outline"
            defaultValue={['bold']}
            aria-label={t('inputs.toggles.group')}
          >
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div>
          <DemoLabel>{t('inputs.toggles.align')}</DemoLabel>
          <ToggleGroup type="single" defaultValue="left" aria-label={t('inputs.toggles.align')}>
            <ToggleGroupItem value="left" aria-label="Left">
              <AlignLeft />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Center">
              <AlignCenter />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Right">
              <AlignRight />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div>
          <DemoLabel>{t('inputs.toggles.segmented')}</DemoLabel>
          <SegmentedControl
            value={theme}
            onChange={setTheme}
            options={[
              {
                value: 'light',
                label: t('inputs.toggles.light'),
                icon: <Sun className="size-3.5" />,
              },
              {
                value: 'dark',
                label: t('inputs.toggles.dark'),
                icon: <Moon className="size-3.5" />,
              },
              {
                value: 'system',
                label: t('inputs.toggles.system'),
                icon: <Laptop className="size-3.5" />,
              },
            ]}
          />
        </div>
        <div className="flex gap-2">
          <Toggle
            variant="outline"
            aria-label={t('inputs.toggles.favorite')}
            className="data-[state=on]:text-warning data-[state=on]:[&_svg]:fill-current"
          >
            <Star /> {t('inputs.toggles.favorite')}
          </Toggle>
          <Toggle
            variant="outline"
            aria-label={t('inputs.toggles.save')}
            className="data-[state=on]:[&_svg]:fill-current"
          >
            <Bookmark /> {t('inputs.toggles.save')}
          </Toggle>
          <Toggle
            aria-label={t('inputs.toggles.like')}
            className="data-[state=on]:text-destructive data-[state=on]:[&_svg]:fill-current"
          >
            <Heart />
          </Toggle>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- uploads */

export function UploadsDemo() {
  const { t } = useTranslation('ui-forms');
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div>
          <DemoLabel>{t('inputs.uploads.avatar')}</DemoLabel>
          <AvatarUpload
            fallback="IN"
            uploadLabel={t('inputs.uploads.upload')}
            removeLabel={t('inputs.uploads.remove')}
            hint={t('inputs.uploads.avatarHint')}
          />
        </div>
        <div>
          <DemoLabel>{t('inputs.uploads.button')}</DemoLabel>
          <ButtonUpload
            multiple
            label={t('inputs.uploads.attach')}
            emptyText={t('inputs.uploads.none')}
            removeLabel={t('inputs.uploads.remove')}
          />
        </div>
        <div>
          <DemoLabel>{t('inputs.uploads.gallery')}</DemoLabel>
          <GalleryUpload
            max={6}
            addLabel={t('inputs.uploads.addImage')}
            removeLabel={t('inputs.uploads.remove')}
            coverLabel={t('inputs.uploads.cover')}
          />
        </div>
      </div>
      <div>
        <DemoLabel>{t('inputs.uploads.dropzone')}</DemoLabel>
        <FileDropzone
          multiple
          maxFiles={5}
          maxSize={5 * 1024 * 1024}
          accept={{ 'image/*': [], 'application/pdf': [] }}
          title={t('inputs.uploads.dropTitle')}
          hint={t('inputs.uploads.dropHint')}
        />
      </div>
    </div>
  );
}
