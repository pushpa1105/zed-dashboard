import { Grid2X2, List, Rows3 } from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { notify } from '@/core/notify/notify';
import { CheckboxGroup } from '@/shared/components/forms/checkbox-group';
import { ColorPicker } from '@/shared/components/forms/color-picker';
import { DateRangePicker, type DateRange } from '@/shared/components/forms/date-range-picker';
import { DateTimePicker } from '@/shared/components/forms/date-time-picker';
import { FileDropzone } from '@/shared/components/forms/file-dropzone';
import { InlineEdit } from '@/shared/components/forms/inline-edit';
import { MentionsTextarea } from '@/shared/components/forms/mentions-textarea';
import { NumberInput } from '@/shared/components/forms/number-input';
import { OtpInput } from '@/shared/components/forms/otp-input';
import { PasswordInput } from '@/shared/components/forms/password-input';
import { RangeSlider } from '@/shared/components/forms/range-slider';
import { Rating } from '@/shared/components/forms/rating';
import { SearchInput } from '@/shared/components/forms/search-input';
import { SegmentedControl } from '@/shared/components/forms/segmented-control';
import { TimePicker } from '@/shared/components/forms/time-picker';

import { PEOPLE, PERMISSIONS } from './sample-data';
import { Demo, DemoLabel, ShowcaseGrid, ValuePreview } from './showcase';

/** Every standalone input, each with a live value readout. */
export function InputGallery() {
  const { t } = useTranslation('ui-forms');
  const [range, setRange] = useState<DateRange | null>(null);
  const [when, setWhen] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>('09:30');
  const [qty, setQty] = useState<number | null>(3);
  const [price, setPrice] = useState<[number, number]>([120, 640]);
  const [view, setView] = useState<'grid' | 'list' | 'rows'>('grid');
  const [perms, setPerms] = useState<string[]>(['billing.read', 'members.read']);
  const [title, setTitle] = useState('Q4 revenue review');
  const [comment, setComment] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('');

  return (
    <ShowcaseGrid>
      <Demo title={t('gallery.dates')} description={t('gallery.datesText')}>
        <div>
          <DemoLabel>{t('gallery.range')}</DemoLabel>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <div>
            <DemoLabel>{t('gallery.dateTime')}</DemoLabel>
            <DateTimePicker value={when} onChange={setWhen} step={15} />
          </div>
          <div>
            <DemoLabel>{t('gallery.time')}</DemoLabel>
            <TimePicker value={time} onChange={setTime} hour12 step={15} />
          </div>
        </div>
        <ValuePreview value={{ range, when, time }} />
      </Demo>

      <Demo title={t('gallery.numbers')} description={t('gallery.numbersText')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <DemoLabel>{t('gallery.quantity')}</DemoLabel>
            <NumberInput value={qty} onChange={setQty} min={0} max={20} />
          </div>
          <div>
            <DemoLabel>{t('gallery.discount')}</DemoLabel>
            <NumberInput
              defaultValue={12.5}
              format="percent"
              min={0}
              max={100}
              step={0.5}
              steppers={false}
            />
          </div>
        </div>
        <div>
          <DemoLabel>{t('gallery.priceRange')}</DemoLabel>
          <RangeSlider
            value={price}
            onChange={setPrice}
            min={0}
            max={1000}
            step={10}
            format="currency"
            labels={[t('gallery.min'), t('gallery.max')]}
          />
        </div>
        <ValuePreview value={{ qty, price }} />
      </Demo>

      <Demo title={t('gallery.choice')} description={t('gallery.choiceText')}>
        <SegmentedControl
          value={view}
          onChange={setView}
          aria-label={t('gallery.view')}
          options={[
            { value: 'grid', label: t('gallery.grid'), icon: <Grid2X2 /> },
            { value: 'list', label: t('gallery.list'), icon: <List /> },
            { value: 'rows', label: t('gallery.rows'), icon: <Rows3 /> },
          ]}
        />
        <CheckboxGroup
          options={PERMISSIONS.slice(0, 6)}
          value={perms}
          onChange={setPerms}
          selectAllLabel={t('gallery.allPermissions')}
        />
        <div className="flex flex-wrap items-center gap-6">
          <Rating defaultValue={4} showValue aria-label={t('gallery.rating')} />
          <Rating defaultValue={2.5} allowHalf size="sm" aria-label={t('gallery.rating')} />
        </div>
      </Demo>

      <Demo title={t('gallery.text')} description={t('gallery.textText')}>
        <div>
          <DemoLabel>{t('gallery.search')}</DemoLabel>
          <SearchInput
            value={query}
            onChange={setQuery}
            shortcut
            placeholder={t('gallery.searchPlaceholder')}
          />
        </div>
        <div>
          <DemoLabel>{t('gallery.inlineEdit')}</DemoLabel>
          <InlineEdit
            value={title}
            className="text-base font-semibold"
            onSave={async (v) => {
              await new Promise((r) => setTimeout(r, 400));
              if (!v) return t('gallery.titleRequired');
              setTitle(v);
              notify.success(t('gallery.renamed'));
            }}
          />
        </div>
        <div>
          <DemoLabel>{t('gallery.mentions')}</DemoLabel>
          <MentionsTextarea
            value={comment}
            onChange={setComment}
            suggestions={PEOPLE}
            placeholder={t('gallery.mentionsPlaceholder')}
          />
        </div>
      </Demo>

      <Demo title={t('gallery.security')} description={t('gallery.securityText')}>
        <div>
          <DemoLabel>{t('gallery.password')}</DemoLabel>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showStrength
          />
        </div>
        <div>
          <DemoLabel>{t('gallery.otp')}</DemoLabel>
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={(v) => notify.info(t('gallery.otpDone', { code: v }))}
          />
        </div>
      </Demo>

      <Demo title={t('gallery.color')} description={t('gallery.colorText')}>
        <ColorPicker inline />
      </Demo>

      <Demo title={t('gallery.upload')} description={t('gallery.uploadText')} wide>
        <FileDropzone
          accept={{ 'image/*': [], 'application/pdf': ['.pdf'] }}
          maxSize={5 * 1024 ** 2}
          title={t('gallery.dropTitle')}
        />
      </Demo>
    </ShowcaseGrid>
  );
}
