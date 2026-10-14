import { describe, expect, test } from 'bun:test';
import { defaultPalette, emptyAppearance, resolveAppearance, paletteTokens, normalizePalette } from './custom-appearance';

describe('Personal appearance rules', () => {
  test('Morning and Evening retain independent images and colors', () => {
    const config = emptyAppearance();
    config.morning.all = { photo: 'morning-photo', colors: { accent: '#123456' } };
    config.evening.all = { photo: 'evening-photo', colors: { accent: '#abcdef' } };
    expect(resolveAppearance(config, 'morning', 'salah')).toEqual({ photo: 'morning-photo', colors: { accent: '#123456' } });
    expect(resolveAppearance(config, 'evening', 'salah')).toEqual({ photo: 'evening-photo', colors: { accent: '#abcdef' } });
  });
  test('Per-page edits do not change other pages', () => {
    const config = emptyAppearance();
    config.morning.all = { photo: 'base', colors: { card: '#ffffff', accent: '#123456' } };
    config.morning.salah = { photo: 'salah', colors: { accent: '#654321' } };
    expect(resolveAppearance(config, 'morning', 'salah')).toEqual({ photo: 'salah', colors: { card: '#ffffff', accent: '#654321' } });
    expect(resolveAppearance(config, 'morning', 'tasbih').photo).toBe('base');
    expect(resolveAppearance(config, 'morning', 'tasbih').colors?.accent).toBe('#123456');
  });
  test('Removing a per-page photo uses the standard artwork rather than the inherited image', () => {
    const config = emptyAppearance(); config.morning.all = { photo: 'base' }; config.morning.salah = { photo: null };
    expect(resolveAppearance(config, 'morning', 'salah').photo).toBeNull();
  });
  test('Manual card, text, primary, and font choices are applied exactly', () => {
    const p = { ...defaultPalette('morning'), card: '#123456', text: '#fedcba', accent: '#234567', font: 'Outfit' };
    const tokens = paletteTokens(p, 'morning');
    expect(tokens['--card']).toBe('#123456'); expect(tokens['--card-foreground']).toBe('#fedcba');
    expect(tokens['--primary']).toBe('#234567'); expect(tokens['--font-sans']).toContain('Outfit');
  });
  test('Invalid stored values cannot become CSS values', () => {
    const p = normalizePalette({ accent: 'url(https://invalid)', font: 'bad font' }, 'morning');
    expect(p.accent).toBe(defaultPalette('morning').accent); expect(p.font).toBe('Jost');
  });
});