import type { ReactElement, ReactNode } from 'react';
import { toast } from 'sonner';

/**
 * Notification adapter. Code calls `notify.success(...)` instead of a toast
 * library, so replacing the library (or routing messages elsewhere) is a
 * one-file change. ESLint forbids importing `sonner` outside this folder and
 * `shared/ui/sonner.tsx`.
 */
export type ToastId = string | number;

export type NotifyOptions = {
  description?: ReactNode;
  /** Milliseconds; `Infinity` keeps the toast until dismissed. */
  duration?: number;
  /** Reuse an id to update an existing toast in place (e.g. loading → success). */
  id?: ToastId;
  /** A single inline action button. */
  action?: { label: string; onClick: () => void };
  /** A secondary "cancel" button. */
  cancel?: { label: string; onClick?: () => void };
  /** Keep the toast until the user acts on it. */
  important?: boolean;
  position?:
    'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

const toSonner = ({ important, cancel, ...options }: NotifyOptions = {}) => ({
  ...options,
  ...(important ? { duration: Infinity } : {}),
  ...(cancel ? { cancel: { label: cancel.label, onClick: () => cancel.onClick?.() } } : {}),
});

export const notify = {
  /** Neutral message without an icon. */
  message: (message: ReactNode, options?: NotifyOptions) => toast(message, toSonner(options)),
  success: (message: ReactNode, options?: NotifyOptions) =>
    toast.success(message, toSonner(options)),
  error: (message: ReactNode, options?: NotifyOptions) => toast.error(message, toSonner(options)),
  info: (message: ReactNode, options?: NotifyOptions) => toast.info(message, toSonner(options)),
  warning: (message: ReactNode, options?: NotifyOptions) =>
    toast.warning(message, toSonner(options)),
  /** Spinner toast. Returns its id: pass it to `success`/`error` to resolve it in place. */
  loading: (message: ReactNode, options?: NotifyOptions) =>
    toast.loading(message, toSonner(options)),

  /** Tracks a promise: loading → success/error, all in one toast. */
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: ReactNode;
      success: ReactNode | ((data: T) => ReactNode);
      error: ReactNode | ((error: unknown) => ReactNode);
    },
  ) => {
    toast.promise(promise, messages);
  },

  /** "Item deleted · Undo" pattern. `onUndo` runs only if the user clicks within the duration. */
  undoable: (
    message: ReactNode,
    onUndo: () => void,
    options?: NotifyOptions & { undoLabel?: string },
  ) =>
    toast(message, {
      ...toSonner(options),
      duration: options?.duration ?? 6000,
      action: { label: options?.undoLabel ?? 'Undo', onClick: onUndo },
    }),

  /** Fully custom content (render prop receives the toast id for self-dismissal). */
  custom: (
    render: (id: ToastId) => ReactElement,
    options?: Pick<NotifyOptions, 'duration' | 'position' | 'id'>,
  ) => toast.custom((id) => render(id), options),

  dismiss: (id?: ToastId) => {
    toast.dismiss(id);
  },
};
