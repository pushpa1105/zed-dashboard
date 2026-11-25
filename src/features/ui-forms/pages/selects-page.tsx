import { useCallback, useState } from 'react';

import { useTranslation } from '@/core/i18n/use-translation';
import { Page } from '@/core/layout/page';
import { AsyncAutocomplete } from '@/shared/components/forms/async-autocomplete';
import { Cascader } from '@/shared/components/forms/cascader';
import { Combobox } from '@/shared/components/forms/combobox';
import { CreatableSelect } from '@/shared/components/forms/creatable-select';
import { MultiSelect } from '@/shared/components/forms/multi-select';
import type { SelectOption } from '@/shared/components/forms/options';
import { TagInput } from '@/shared/components/forms/tag-input';
import { TransferList } from '@/shared/components/forms/transfer-list';
import { TreeSelect } from '@/shared/components/forms/tree-select';
import { getInitials } from '@/shared/lib/format';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

import { uiFormsApi } from '../api/ui-forms-api';
import {
  FRAMEWORKS,
  INDUSTRIES,
  LOCATIONS,
  PERMISSIONS,
  TEAM_OPTIONS,
} from '../components/sample-data';
import { Demo, DemoLabel, ShowcaseGrid, ValuePreview } from '../components/showcase';
import { UiFormsTabs } from '../components/ui-forms-tabs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Initials({ name }: { name: string }) {
  const [first = '', last = ''] = name.split(' ');
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
      {getInitials(first, last)}
    </span>
  );
}

export default function SelectsPage() {
  const { t } = useTranslation('ui-forms');
  const [teams, setTeams] = useState<string[]>(['design', 'engineering', 'data', 'sales']);
  const [stack, setStack] = useState<string[]>(['react']);
  const [industry, setIndustry] = useState<string | null>('saas');
  const [labels, setLabels] = useState<string | null>(null);
  const [owner, setOwner] = useState<SelectOption | null>(null);
  const [countries, setCountries] = useState<SelectOption[]>([]);
  const [locations, setLocations] = useState<string[]>(['london', 'berlin']);
  const [path, setPath] = useState<string[]>(['amer', 'us', 'sf']);
  const [granted, setGranted] = useState<string[]>(['billing.read', 'members.read']);
  const [emails, setEmails] = useState<string[]>(['hannah@acme.io']);
  const [plan, setPlan] = useState('pro');

  const searchUsers = useCallback(
    async (q: string, signal: AbortSignal) =>
      (await uiFormsApi.searchUsers(q, signal)).map((u) => ({
        value: u.id,
        label: u.name,
        description: `${u.role} · ${u.team}`,
        icon: <Initials name={u.name} />,
      })),
    [],
  );

  const searchCountries = useCallback(
    async (q: string, signal: AbortSignal) =>
      (await uiFormsApi.searchCountries(q, signal)).map((c) => ({
        value: c.code,
        label: c.name,
        description: c.region,
      })),
    [],
  );

  return (
    <Page title={t('selects.title')} description={t('selects.description')} width="full">
      <UiFormsTabs />
      <ShowcaseGrid>
        <Demo title={t('selects.multi')} description={t('selects.multiText')}>
          <MultiSelect
            options={TEAM_OPTIONS}
            value={teams}
            onChange={setTeams}
            selectAll
            maxVisible={3}
          />
          <ValuePreview value={teams} />
        </Demo>

        <Demo title={t('selects.capped')} description={t('selects.cappedText')}>
          <MultiSelect
            options={FRAMEWORKS}
            value={stack}
            onChange={setStack}
            maxSelected={3}
            creatable
          />
          <ValuePreview value={stack} />
        </Demo>

        <Demo title={t('selects.combobox')} description={t('selects.comboboxText')}>
          <Combobox options={INDUSTRIES} value={industry} onChange={setIndustry} clearable />
          <ValuePreview value={industry} />
        </Demo>

        <Demo title={t('selects.creatable')} description={t('selects.creatableText')}>
          <CreatableSelect
            options={[
              { value: 'bug', label: 'Bug' },
              { value: 'feature', label: 'Feature request' },
              { value: 'question', label: 'Question' },
            ]}
            value={labels}
            onChange={setLabels}
            placeholder={t('selects.labelPlaceholder')}
          />
          <ValuePreview value={labels} />
        </Demo>

        <Demo title={t('selects.asyncUser')} description={t('selects.asyncUserText')}>
          <AsyncAutocomplete
            fetchOptions={searchUsers}
            value={owner}
            onChange={setOwner}
            placeholder={t('selects.userPlaceholder')}
            hintText={t('selects.typeToSearch')}
            emptyText={t('selects.noMatches')}
            errorText={t('selects.loadError')}
          />
          <ValuePreview value={owner && { value: owner.value, label: owner.label }} />
        </Demo>

        <Demo title={t('selects.asyncMulti')} description={t('selects.asyncMultiText')}>
          <AsyncAutocomplete
            multiple
            fetchOptions={searchCountries}
            value={countries}
            onChange={setCountries}
            placeholder={t('selects.countryPlaceholder')}
            hintText={t('selects.typeToSearch')}
            emptyText={t('selects.noMatches')}
            errorText={t('selects.loadError')}
          />
          <ValuePreview value={countries.map((c) => c.value)} />
        </Demo>

        <Demo title={t('selects.tree')} description={t('selects.treeText')}>
          <TreeSelect data={LOCATIONS} value={locations} onChange={setLocations} />
          <ValuePreview value={locations} />
        </Demo>

        <Demo title={t('selects.cascader')} description={t('selects.cascaderText')}>
          <Cascader data={LOCATIONS} value={path} onChange={setPath} />
          <ValuePreview value={path} />
        </Demo>

        <Demo title={t('selects.treeInline')} description={t('selects.treeInlineText')}>
          <TreeSelect
            data={LOCATIONS}
            inline
            defaultExpanded={['emea', 'uk']}
            defaultValue={['london']}
            className="max-h-72 overflow-y-auto"
          />
        </Demo>

        <Demo title={t('selects.tags')} description={t('selects.tagsText')}>
          <TagInput
            value={emails}
            onChange={setEmails}
            placeholder="name@company.com"
            lowercase
            max={10}
            validate={(v) => (EMAIL.test(v) ? undefined : t('wizard.invalidEmail', { email: v }))}
          />
          <ValuePreview value={emails} />
        </Demo>

        <Demo title={t('selects.transfer')} description={t('selects.transferText')} wide>
          <TransferList
            options={PERMISSIONS}
            value={granted}
            onChange={setGranted}
            titles={[t('selects.available'), t('selects.granted')]}
          />
        </Demo>

        <Demo title={t('selects.basic')} description={t('selects.basicText')} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <DemoLabel>{t('selects.radixSelect')}</DemoLabel>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{t('selects.plans')}</SelectLabel>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="enterprise" disabled>
                      Enterprise
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div>
              <DemoLabel>{t('selects.native')}</DemoLabel>
              <NativeSelect defaultValue="eu" className="w-full">
                <NativeSelectOption value="us">US East</NativeSelectOption>
                <NativeSelectOption value="eu">EU West</NativeSelectOption>
                <NativeSelectOption value="ap">Asia Pacific</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
        </Demo>
      </ShowcaseGrid>
    </Page>
  );
}
