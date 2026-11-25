import { translateLabel, type NavNode } from '@/core/feature/define-feature';
import { useTranslation } from '@/core/i18n/use-translation';

/** Returns a function that translates a menu entry's label. */
export function useNavLabel() {
  const { t } = useTranslation();
  return (node: Pick<NavNode, 'label'>) => translateLabel(node.label, t);
}
