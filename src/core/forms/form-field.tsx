import { useId, type ReactNode } from 'react';
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';

import { cn } from '@/shared/lib/cn';
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/field';

import { FormFieldError } from './form-field-error';

export type FormFieldRenderProps<T extends FieldValues, N extends FieldPath<T>> = {
  /** `value`, `onChange`, `onBlur`, `name`, `ref`: spread onto most inputs, or map them. */
  field: ControllerRenderProps<T, N>;
  fieldState: ControllerFieldState;
  /** Put on the control so the label points at it. */
  id: string;
  /** Convenience flag for the control's `invalid` / `aria-invalid`. */
  invalid: boolean;
};

type FormFieldProps<T extends FieldValues, N extends FieldPath<T>, TOut extends FieldValues = T> = {
  /** `form.control`. Forms whose schema transforms values (zod `.transform`, coercion) work too. */
  control: Control<T, unknown, TOut>;
  name: N;
  label?: ReactNode;
  description?: ReactNode;
  /** `vertical` (label above) or `horizontal` (label column on the left, settings-style). */
  orientation?: 'vertical' | 'horizontal';
  /** Marks the label with an asterisk. Validation still comes from the schema. */
  required?: boolean;
  className?: string;
  render: (props: FormFieldRenderProps<T, N>) => ReactNode;
};

/**
 * Binds ANY input to React Hook Form: label, description and translated
 * error around a render prop. Works with every component in
 * `shared/components/forms` because they all take `value` + `onChange`:
 *
 *   <FormField control={form.control} name="tags" label="Tags"
 *     render={({ field, id, invalid }) => (
 *       <TagInput id={id} value={field.value} onChange={field.onChange} invalid={invalid} />
 *     )} />
 */
export function FormField<
  T extends FieldValues,
  N extends FieldPath<T>,
  TOut extends FieldValues = T,
>({
  control,
  name,
  label,
  description,
  orientation = 'vertical',
  required,
  className,
  render,
}: FormFieldProps<T, N, TOut>) {
  const id = `${useId()}-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const control = render({ field, fieldState, id, invalid: fieldState.invalid });
        const labelNode = label && (
          <FieldLabel htmlFor={id}>
            {label}
            {required && <span className="text-destructive">*</span>}
          </FieldLabel>
        );

        if (orientation === 'horizontal') {
          return (
            <Field
              data-invalid={fieldState.invalid}
              className={cn('grid gap-2 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-8', className)}
            >
              <div className="space-y-1">
                {labelNode}
                {description && <FieldDescription>{description}</FieldDescription>}
              </div>
              <div className="space-y-1.5">
                {control}
                <FormFieldError error={fieldState.error} />
              </div>
            </Field>
          );
        }

        return (
          <Field data-invalid={fieldState.invalid} className={className}>
            {labelNode}
            {control}
            {description && <FieldDescription>{description}</FieldDescription>}
            <FormFieldError error={fieldState.error} />
          </Field>
        );
      }}
    />
  );
}
