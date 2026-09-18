'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorField } from '@/components/branding/color-field';
import { AppearancePreview } from '@/components/branding/appearance-preview';
import { buildLogoUrl } from '@/lib/appearance';
import { useLogoPreview } from '@/hooks/use-logo-preview';
import { DEFAULT_PORTAL_APPEARANCE } from '@ged/types';
import {
  useDeletePortalLogo,
  usePortalAppearance,
  useUpdatePortalAppearance,
  useUploadPortalLogo,
} from '@/hooks/use-portal-appearance';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const hexSchema = z.string().regex(HEX_PATTERN, 'Cor deve estar no formato #RRGGBB');

const schema = z.object({
  primaryColor: hexSchema,
  secondaryColor: hexSchema,
  backgroundColor: hexSchema,
  useDefaultTheme: z.boolean(),
  heroTitle: z.string().min(1, 'Obrigatório').max(200),
  heroSubtitle: z.string().min(1, 'Obrigatório').max(400),
  footerMessage: z.string().min(1, 'Obrigatório').max(400),
});

type FormValues = z.infer<typeof schema>;

// Fonte única compartilhada com o fallback de SSR e com o CSS estático (@ged/types).
const DEFAULT_VALUES: FormValues = {
  primaryColor: DEFAULT_PORTAL_APPEARANCE.primaryColor,
  secondaryColor: DEFAULT_PORTAL_APPEARANCE.secondaryColor,
  backgroundColor: DEFAULT_PORTAL_APPEARANCE.backgroundColor,
  useDefaultTheme: true,
  heroTitle: DEFAULT_PORTAL_APPEARANCE.heroTitle,
  heroSubtitle: DEFAULT_PORTAL_APPEARANCE.heroSubtitle,
  footerMessage: DEFAULT_PORTAL_APPEARANCE.footerMessage,
};

export function PortalAppearancePageClient() {
  const { data, isLoading, isError } = usePortalAppearance();
  const update = useUpdatePortalAppearance();
  const uploadLogo = useUploadPortalLogo();
  const deleteLogo = useDeletePortalLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { previewUrl, setFile, clear: clearPreview } = useLogoPreview();

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (data) {
      reset({
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        backgroundColor: data.backgroundColor,
        useDefaultTheme: data.useDefaultTheme,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        footerMessage: data.footerMessage,
      });
    }
  }, [data, reset]);

  const watched = watch();

  const previewColors = watched.useDefaultTheme
    ? {
        primaryColor: DEFAULT_PORTAL_APPEARANCE.primaryColor,
        secondaryColor: DEFAULT_PORTAL_APPEARANCE.secondaryColor,
        backgroundColor: DEFAULT_PORTAL_APPEARANCE.backgroundColor,
      }
    : {
        primaryColor: watched.primaryColor,
        secondaryColor: watched.secondaryColor,
        backgroundColor: watched.backgroundColor,
      };

  function onSubmit(values: FormValues) {
    update.mutate(values);
  }

  function handleLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    uploadLogo.mutate(file, {
      // O preview local só sai de cena depois que a URL do servidor (já com o novo ?v=)
      // está disponível -- limpar antes faria a marca piscar entre as duas imagens.
      onSuccess: () => clearPreview(),
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  }

  const currentLogoUrl = data?.hasLogo ? buildLogoUrl('portal', data.logoVersion) : null;
  const logoSrc = previewUrl ?? currentLogoUrl;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Aparência do Portal</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Personalize cores, logo e textos do portal público de documentos — totalmente
          independente do tema do sistema.
        </p>
      </div>

      {isError ? (
        <p className="py-4 text-sm text-rose-500 dark:text-rose-400">
          Não foi possível carregar a aparência salva. Recarregue a página para tentar de novo.
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <Controller
              name="useDefaultTheme"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Usar cores padrão do portal
                  </span>
                </label>
              )}
            />

            <div>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Paleta de cores</h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Escolha 1 cor por campo — as variações são calculadas automaticamente.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Controller
                  name="primaryColor"
                  control={control}
                  render={({ field }) => (
                    <ColorField
                      label="Cor primária"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.primaryColor?.message}
                      disabled={watched.useDefaultTheme}
                    />
                  )}
                />
                <Controller
                  name="secondaryColor"
                  control={control}
                  render={({ field }) => (
                    <ColorField
                      label="Cor secundária"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.secondaryColor?.message}
                      disabled={watched.useDefaultTheme}
                    />
                  )}
                />
                <Controller
                  name="backgroundColor"
                  control={control}
                  render={({ field }) => (
                    <ColorField
                      label="Cor de fundo"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.backgroundColor?.message}
                      disabled={watched.useDefaultTheme}
                    />
                  )}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Textos</h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Título e subtítulo do hero, e a mensagem exibida no rodapé do portal.
              </p>
              <div className="space-y-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Título do hero</span>
                  <input
                    {...register('heroTitle')}
                    maxLength={200}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  {errors.heroTitle && <span className="text-xs text-rose-400">{errors.heroTitle.message}</span>}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Subtítulo do hero</span>
                  <textarea
                    {...register('heroSubtitle')}
                    maxLength={400}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  {errors.heroSubtitle && (
                    <span className="text-xs text-rose-400">{errors.heroSubtitle.message}</span>
                  )}
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Mensagem do rodapé</span>
                  <textarea
                    {...register('footerMessage')}
                    maxLength={400}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  {errors.footerMessage && (
                    <span className="text-xs text-rose-400">{errors.footerMessage.message}</span>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={update.isPending}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
              >
                {update.isPending ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>

            <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Logo</h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                PNG, JPEG ou WEBP, até 2MB. Usado no cabeçalho do portal público.
              </p>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                  {logoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element -- preview usa blob: (URL.createObjectURL), que next/image não carrega
                    <img src={logoSrc} alt="Logo atual" className="h-12 w-12 object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">Sem logo</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoSelected}
                    className="text-sm text-slate-600 dark:text-slate-400"
                  />
                  {data?.hasLogo && (
                    <button
                      type="button"
                      onClick={() => deleteLogo.mutate(undefined, { onSuccess: () => clearPreview() })}
                      disabled={deleteLogo.isPending}
                      className="text-left text-xs font-medium text-rose-500 hover:text-rose-400 disabled:opacity-60"
                    >
                      Remover logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Pré-visualização</h3>
            <AppearancePreview
              primaryColor={previewColors.primaryColor}
              secondaryColor={previewColors.secondaryColor}
              backgroundColor={previewColors.backgroundColor}
              mode="light"
            />
          </div>
        </div>
      )}
    </main>
  );
}
