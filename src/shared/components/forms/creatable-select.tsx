import { Combobox, type ComboboxProps } from './combobox';
import { MultiSelect, type MultiSelectProps } from './multi-select';

export type CreatableSelectProps =
  | ({ multiple?: false } & Omit<ComboboxProps, 'creatable'>)
  | ({ multiple: true } & Omit<MultiSelectProps, 'creatable'>);

/**
 * Select that lets users add options that don't exist yet (labels,
 * categories, cost centers…). Single by default, `multiple` for many.
 * Persist new options through `onCreate`.
 */
export function CreatableSelect(props: CreatableSelectProps) {
  if (props.multiple) {
    const { multiple: _multiple, ...rest } = props;
    return <MultiSelect {...rest} creatable />;
  }
  const { multiple: _multiple, ...rest } = props;
  return <Combobox {...rest} creatable />;
}
