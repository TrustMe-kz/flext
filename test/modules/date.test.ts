import { describe, it, expect, vi } from 'vitest';
import { DateTime } from 'luxon';
import { getHtml, mockPut } from '@test-lib';


// Constants

export const MODULE_NAME = 'date';

export const TEMPLATE_DATA = {
    data: {
        createdAt: '2024-03-05T14:23:45Z',
    },
};

export const TEMPLATE_DATA_DATE = DateTime.fromISO(TEMPLATE_DATA.data.createdAt).setZone('UTC');


// Tests

describe('"date" module', () => {
    it('op formats values with color support', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:op data.createdAt "day" padding=2 timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('05'));
    });

    it('seconds returns zero-padded seconds', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:seconds data.createdAt timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('45'));
    });

    it('minutes returns zero-padded minutes', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:minutes data.createdAt timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('23'));
    });

    it('hours returns zero-padded hours', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:hours data.createdAt timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('14'));
    });

    it('day returns zero-padded day numbers', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:day data.createdAt timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('05'));
    });

    it('month returns zero-padded month numbers', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:month data.createdAt timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('03'));
    });

    it('monthText returns localized month names', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:monthText data.createdAt lang="fr-FR" nominative=true timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut(TEMPLATE_DATA_DATE.setLocale('fr-FR').toLocaleString({ month: 'long' }).toLowerCase()));
    });

    it('year returns zero-padded years', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:year data.createdAt timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('2024'));
    });

    it('text respects locale settings', () => {
        const expected = TEMPLATE_DATA_DATE.setLocale('en-US').toLocaleString();

        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:text data.createdAt lang="en-US" timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut(expected));
    });

    it('unix returns milliseconds without color wrapper', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:unix data.createdAt timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(String(TEMPLATE_DATA_DATE.toMillis()));
    });

    it('iso returns ISO time strings', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:iso data.createdAt timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(TEMPLATE_DATA_DATE.toISOTime());
    });

    it('noColor exposes raw values', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:noColor data.createdAt "month" padding=2 timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe('03');
    });

    it('default helper mirrors the colored base implementation', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date data.createdAt "day" padding=2 timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('05'));
    });

    it('monthText defaults to genitive form when nominative flag is absent', () => {
        const localized = TEMPLATE_DATA_DATE.setLocale('ru-RU').toLocaleString({ day: 'numeric', month: 'long' });
        const expected = localized.replace(/[^\p{L}]/gu, '').toLowerCase();

        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date:monthText data.createdAt lang="ru-RU" timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut(expected));
    });

    it('honors Flext-level @timeZone when helper argument is omitted', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{!-- @timeZone "Asia/Almaty" --}}{{ date:hours data.createdAt padding=2 }}',
            data: TEMPLATE_DATA,
        }).trim();

        expect(html).toBe(mockPut('19'));
    });

    it('uses fallback text when the source date is missing', () => {
        const html = getHtml({
            modules: MODULE_NAME,
            template: '{{ date data.missing "day" fallback="--" timeZone="UTC" }}',
            data: { data: {} },
        }).trim();

        expect(html).toBe(mockPut('--'));
    });

    it('throws a descriptive error when padding is combined with unsupported ops', () => {
        expect(() => getHtml({
            modules: MODULE_NAME,
            template: '{{ date:text data.createdAt padding=2 timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        })).toThrow(/argument 'padding'/i);
    });

    it('rejects genitive flag for operations other than monthText', () => {
        expect(() => getHtml({
            modules: MODULE_NAME,
            template: '{{ date data.createdAt "day" genitive=true timeZone="UTC" }}',
            data: TEMPLATE_DATA,
        })).toThrow(/argument 'genitive'/i);
    });
});
