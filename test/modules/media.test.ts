import { describe, it, expect, vi } from 'vitest';
import Flext from '@flext';


// Constants

export const MODULE_NAME = 'media';


// Tests

describe('"media" module', () => {
  const template = `
    {{!-- @use "media" --}}
    <img src="{{ media:url "logo" }}" alt="Company Seal">
  `;

  it('returns a blob URL when the requested asset exists', () => {
    const blob = new Blob([ 'seal' ], { type: 'text/plain' });
    const flext = new Flext(template).setAssets({ logo: blob });

    const createSpy = vi.spyOn(URL, 'createObjectURL');
    const html = flext.html.trim();

    expect(html).toMatch(/^<img src="blob:.+" alt="Company Seal">$/);
    const [ _first, blobUrl ] = html.match(/src="([^"]+)"/) ?? [];
    expect(blobUrl).toMatch(/^blob:/);

    URL.revokeObjectURL(blobUrl!);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(blob);
    createSpy.mockRestore();
  });

  it('throws a descriptive error if the asset is missing', () => {
    const flext = new Flext(template);
    expect(() => flext.html).toThrow(/Asset 'logo' does not exist/);
  });

  it('supports adding assets after initialization', () => {
    const blob = new Blob([ 'logo-2' ], { type: 'text/plain' });
    const flext = new Flext(template).setAssets({});
    const createSpy = vi.spyOn(URL, 'createObjectURL');

    flext.addAsset('logo', blob);

    const html = flext.html.trim();
    expect(html).toMatch(/^<img src="blob:.+" alt="Company Seal">$/);
    expect(createSpy).toHaveBeenCalledTimes(1);

    createSpy.mockRestore();
  });
});
