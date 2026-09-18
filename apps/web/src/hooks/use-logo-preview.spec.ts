import { act, renderHook } from '@testing-library/react';
import { useLogoPreview } from './use-logo-preview';

function makeFile(name: string): File {
  return new File(['binario'], name, { type: 'image/png' });
}

describe('useLogoPreview', () => {
  let created: string[];
  let revoked: string[];

  beforeEach(() => {
    created = [];
    revoked = [];
    let counter = 0;

    global.URL.createObjectURL = jest.fn(() => {
      counter += 1;
      const url = `blob:mock/${counter}`;
      created.push(url);
      return url;
    });

    global.URL.revokeObjectURL = jest.fn((url: string) => {
      revoked.push(url);
    });
  });

  it('começa sem preview', () => {
    const { result } = renderHook(() => useLogoPreview());

    expect(result.current.previewUrl).toBeNull();
  });

  it('expõe a URL do arquivo escolhido', () => {
    const { result } = renderHook(() => useLogoPreview());

    act(() => result.current.setFile(makeFile('logo.png')));

    expect(result.current.previewUrl).toBe(created[0]);
  });

  it('revoga a URL anterior ao trocar de arquivo', () => {
    const { result } = renderHook(() => useLogoPreview());

    act(() => result.current.setFile(makeFile('a.png')));
    act(() => result.current.setFile(makeFile('b.png')));

    expect(revoked).toEqual([created[0]]);
    expect(result.current.previewUrl).toBe(created[1]);
  });

  // Sem isto, remover o logo deixava a imagem apagada na tela enquanto o botão de remover
  // sumia junto — a tela ficava num estado impossível.
  it('revoga e zera o preview em clear()', () => {
    const { result } = renderHook(() => useLogoPreview());

    act(() => result.current.setFile(makeFile('logo.png')));
    act(() => result.current.clear());

    expect(revoked).toEqual([created[0]]);
    expect(result.current.previewUrl).toBeNull();
  });

  it('não revoga nada quando clear() é chamado sem preview', () => {
    const { result } = renderHook(() => useLogoPreview());

    act(() => result.current.clear());

    expect(revoked).toEqual([]);
  });

  it('revoga a URL pendente no unmount', () => {
    const { result, unmount } = renderHook(() => useLogoPreview());

    act(() => result.current.setFile(makeFile('logo.png')));
    unmount();

    expect(revoked).toEqual([created[0]]);
  });

  it('não revoga duas vezes quando clear() precede o unmount', () => {
    const { result, unmount } = renderHook(() => useLogoPreview());

    act(() => result.current.setFile(makeFile('logo.png')));
    act(() => result.current.clear());
    unmount();

    expect(revoked).toEqual([created[0]]);
  });
});
