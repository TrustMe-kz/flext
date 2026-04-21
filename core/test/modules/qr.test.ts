import { describe, it, expect, vi } from 'vitest';
import Flext from '@flext';


// Constants

export const MODULE_NAME = 'qr';


// Tests

describe('"qr" module', () => {
  it('url returns a blob URL for QR SVG data', () => {
    const template = `
      {{!-- @use "qr" --}}
      <img src="{{ qr:url data.paymentUrl }}" alt="QR">
    `;
    const createSpy = vi.spyOn(URL, 'createObjectURL');
    const flext = new Flext(template, {
      data: { paymentUrl: 'https://trustme24.com/pay/123' },
    });

    const html = flext.html.trim();
    const blob = createSpy.mock.calls[0]?.[0] as Blob;
    const blobUrl = html.match(/src="([^"]+)"/)?.[1];

    expect(html).toMatch(/^<img src="blob:.+" alt="QR">$/);
    expect(blobUrl).toMatch(/^blob:/);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/svg+xml;charset=utf-8');

    if (blobUrl) URL.revokeObjectURL(blobUrl);
    createSpy.mockRestore();
  });

  it('default helper mirrors url behavior', () => {
    const template = `
      {{!-- @use "qr" --}}
      <img src="{{ qr data.paymentUrl }}" alt="QR">
    `;
    const createSpy = vi.spyOn(URL, 'createObjectURL');
    const flext = new Flext(template, {
      data: { paymentUrl: 'https://trustme24.com/pay/123' },
    });

    const html = flext.html.trim();
    const blobUrl = html.match(/src="([^"]+)"/)?.[1];

    expect(html).toMatch(/^<img src="blob:.+" alt="QR">$/);
    expect(createSpy).toHaveBeenCalledTimes(1);

    if (blobUrl) URL.revokeObjectURL(blobUrl);
    createSpy.mockRestore();
  });

  it('handles empty and missing values without throwing', () => {
    const emptyTemplate = `
      {{!-- @use "qr" --}}
      <img src="{{ qr:url data.empty }}" alt="QR">
    `;
    const missingTemplate = `
      {{!-- @use "qr" --}}
      <img src="{{ qr:url data.missing }}" alt="QR">
    `;
    const createSpy = vi.spyOn(URL, 'createObjectURL');

    const emptyHtml = new Flext(emptyTemplate, { data: { empty: '' } }).html.trim();
    const missingHtml = new Flext(missingTemplate, { data: {} }).html.trim();

    expect(emptyHtml).toMatch(/^<img src="blob:.+" alt="QR">$/);
    expect(missingHtml).toMatch(/^<img src="blob:.+" alt="QR">$/);
    expect(createSpy).toHaveBeenCalledTimes(2);

    createSpy.mockRestore();
  });

  it('accepts number values as QR input', () => {
    const template = `
      {{!-- @use "qr" --}}
      <img src="{{ qr:url data.id }}" alt="QR">
    `;
    const createSpy = vi.spyOn(URL, 'createObjectURL');
    const flext = new Flext(template, {
      data: { id: 12345 },
    });

    const html = flext.html.trim();
    const blobUrl = html.match(/src="([^"]+)"/)?.[1];

    expect(html).toMatch(/^<img src="blob:.+" alt="QR">$/);
    expect(createSpy).toHaveBeenCalledTimes(1);

    if (blobUrl) URL.revokeObjectURL(blobUrl);
    createSpy.mockRestore();
  });

  it('accepts object values without failing template rendering', () => {
    const template = `
      {{!-- @use "qr" --}}
      <img src="{{ qr:url data.payload }}" alt="QR">
    `;
    const createSpy = vi.spyOn(URL, 'createObjectURL');
    const flext = new Flext(template, {
      data: { payload: { id: 12345 } },
    });

    const html = flext.html.trim();
    const blobUrl = html.match(/src="([^"]+)"/)?.[1];

    expect(html).toMatch(/^<img src="blob:.+" alt="QR">$/);
    expect(createSpy).toHaveBeenCalledTimes(1);

    if (blobUrl) URL.revokeObjectURL(blobUrl);
    createSpy.mockRestore();
  });

  it('works in mixed conditional templates', () => {
    const template = `
      {{!-- @use "qr" "cond" --}}
      {{#if (cond:equal data.enabled true)}}<img src="{{ qr:url data.paymentUrl }}" alt="QR">{{else}}disabled{{/if}}
    `;
    const createSpy = vi.spyOn(URL, 'createObjectURL');
    const flext = new Flext(template, {
      data: { enabled: true, paymentUrl: 'https://trustme24.com/pay/123' },
    });

    const html = flext.html.trim();
    const blobUrl = html.match(/src="([^"]+)"/)?.[1];

    expect(html).toMatch(/^<img src="blob:.+" alt="QR">$/);
    expect(createSpy).toHaveBeenCalledTimes(1);

    if (blobUrl) URL.revokeObjectURL(blobUrl);
    createSpy.mockRestore();
  });
});
