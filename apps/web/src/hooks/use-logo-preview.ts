'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface LogoPreview {
  /** URL `blob:` do arquivo escolhido, ou `null` quando não há preview local. */
  readonly previewUrl: string | null;
  readonly setFile: (file: File) => void;
  readonly clear: () => void;
}

/**
 * Preview local do logo antes/durante o upload.
 *
 * Duas coisas que a versão inline nos page clients errava:
 * 1. A URL de `createObjectURL` nunca era revogada — cada troca de arquivo vazava um blob
 *    até o reload da página.
 * 2. O preview nunca era zerado, e como o `<img>` usa `preview ?? urlDoServidor`, clicar
 *    em "Remover logo" deixava a imagem apagada na tela (o botão de remover sumia junto,
 *    porque é gated em `hasLogo`, então a tela ficava num estado impossível).
 *
 * Por isso `clear()` deve ser chamado tanto no sucesso do upload (quando a URL do servidor,
 * já com o novo `?v=`, assume) quanto no sucesso da remoção.
 */
export function useLogoPreview(): LogoPreview {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Espelha o state num ref para o cleanup de unmount poder revogar a URL atual sem
  // recriar o efeito (e portanto sem revogar a cada render).
  const currentUrlRef = useRef<string | null>(null);

  const revokeCurrent = useCallback(() => {
    if (currentUrlRef.current !== null) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const setFile = useCallback(
    (file: File) => {
      revokeCurrent();
      const url = URL.createObjectURL(file);
      currentUrlRef.current = url;
      setPreviewUrl(url);
    },
    [revokeCurrent],
  );

  const clear = useCallback(() => {
    revokeCurrent();
    setPreviewUrl(null);
  }, [revokeCurrent]);

  useEffect(() => revokeCurrent, [revokeCurrent]);

  return { previewUrl, setFile, clear };
}
