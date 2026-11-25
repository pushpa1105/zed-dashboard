import { Palette } from 'lucide-react';

import { BrandCustomizer } from '@/core/brand/components/brand-customizer';
import { useTranslation } from '@/core/i18n/use-translation';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { ThemeCustomizer } from './theme-customizer';

/** Header button that opens the theme and brand editors in a side sheet. */
export function ThemeSheet() {
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('theme.customize')}>
          <Palette className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('theme.customize')}</SheetTitle>
          <SheetDescription>{t('theme.description')}</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="theme" className="px-4 pb-6">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="theme">{t('theme.tab')}</TabsTrigger>
            <TabsTrigger value="brand">{t('brand.title')}</TabsTrigger>
          </TabsList>
          <TabsContent value="theme">
            <ThemeCustomizer />
          </TabsContent>
          <TabsContent value="brand">
            <BrandCustomizer />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
