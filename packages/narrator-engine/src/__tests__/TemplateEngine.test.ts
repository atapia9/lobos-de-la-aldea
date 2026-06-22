import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../TemplateEngine.js';

describe('TemplateEngine', () => {
  const engine = new TemplateEngine();

  it('replaces a single variable', () => {
    expect(engine.render('Hola {name}', { name: 'Alice' })).toBe('Hola Alice');
  });

  it('replaces multiple variables', () => {
    expect(engine.render('{a} y {b}', { a: 'uno', b: 'dos' })).toBe('uno y dos');
  });

  it('replaces numeric variables', () => {
    expect(engine.render('Día {dayNumber}', { dayNumber: 3 })).toBe('Día 3');
  });

  it('leaves unknown placeholders intact', () => {
    expect(engine.render('{unknown}', {})).toBe('{unknown}');
  });

  it('returns template unchanged when no vars provided', () => {
    expect(engine.render('Sin variables')).toBe('Sin variables');
  });

  it('replaces the same variable appearing multiple times', () => {
    expect(engine.render('{x} and {x}', { x: 'foo' })).toBe('foo and foo');
  });
});
