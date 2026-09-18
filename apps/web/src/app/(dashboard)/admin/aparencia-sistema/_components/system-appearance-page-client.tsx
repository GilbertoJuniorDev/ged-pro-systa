'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorField } from '@/components/branding/color-field';
import { AppearancePreview } from '@/components/branding/appearance-preview';
import { buildLogoUrl } from '@/lib/appearance';
import { useLogoPreview } from '@/hooks/use-logo-preview';
import { DEFAULT_SYSTEM_APPEARANCE } from '@ged/types';
import {
  useDeleteSystemLogo,
  useSystemAppearance,
  useUpdateSystemAppearance,
  useUploadSystemLogo,
} from '@/hooks/use-system-appearance';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const hexSchema = z.string().regex(HEX_PATTERN, 'Cor deve estar no formato #RRGGBB');

const schema = z.object({
  primaryColor: hexSchema,
  secondaryColor: hexSchema,
  backgroundColor: hexSchema,
  useDefaultTheme: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// Fonte única compartilhada com o fallback de SSR e com o CSS estático (@ged/types).
const DEFAULT_VALUES: FormValues = {
  primaryColor: DEFAULT_SYSTEM_APPEARANCE.primaryColor,
  secondaryColor: DEFAULT_SYSTEM_APPEARANCE.secondaryColor,
  backgroundColor: DEFAULT_SYSTEM_APPEARANCE.backgroundColor,
  useDefaultTheme: true,
};

export function SystemAppearancePageClient() {
  const { data, isLoading, isError } = useSystemAppearance();
  const update = useUpdateSystemAppearance();
  const uploadLogo = useUploadSystemLogo();
  const deleteLogo = useDeleteSystemLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { previewUrl, setFile, clear: clearPreview } = useLogoPreview();
  const { resolvedTheme } = useTheme();

  const {
    control,
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
      });
    }
  }, [data, reset]);

  const watched = watch();

  const previewColors = watched.useDefaultTheme
    ? {
        primaryColor: DEFAULT_SYSTEM_APPEARANCE.primaryColor,
        secondaryColor: DEFAULT_SYSTEM_APPEARANCE.secondaryColor,
        backgroundColor: DEFAULT_SYSTEM_APPEARANCE.backgroundColor,
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

  const currentLogoUrl = data?.hasLogo ? buildLogoUrl('system', data.logoVersion) : null;
  const logoSrc = previewUrl ?? currentLogoUrl;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Aparência do Sistema</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Personalize a paleta de cores e o logo usados na área administrativa e na tela de login.
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
                    Usar cores padrão do sistema
                  </span>
                </label>
              )}
            />

            <div>
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Paleta de cores</h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Escolha 1 cor por campo — as variações para o modo claro e escuro são calculadas
                automaticamente.
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

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={update.isPending}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
              >
                {update.isPending ? 'Salvando...' : 'Salvar cores'}
              </button>
            </div>

            <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
              <h3 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">Logo</h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                PNG, JPEG ou WEBP, até 2MB. Usado na barra lateral e na tela de login.
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
              mode={resolvedTheme === 'light' ? 'light' : 'dark'}
            />
          </div>
        </div>
      )}
    </main>
  );
}
