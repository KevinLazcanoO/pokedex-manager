import { describe, expect, it, vi } from 'vitest';

import { LimitadorDeUso } from '../lib/rate-limit.js';

describe('LimitadorDeUso', () => {
  it('deja pasar hasta el máximo y luego corta', () => {
    const limitador = new LimitadorDeUso(3, 60_000);

    expect(limitador.intentarConsumir('ana')).toBe(true);
    expect(limitador.intentarConsumir('ana')).toBe(true);
    expect(limitador.intentarConsumir('ana')).toBe(true);
    expect(limitador.intentarConsumir('ana')).toBe(false);
    expect(limitador.usosRestantes('ana')).toBe(0);
  });

  it('lleva la cuenta por separado para cada clave', () => {
    const limitador = new LimitadorDeUso(1, 60_000);

    expect(limitador.intentarConsumir('ana')).toBe(true);
    expect(limitador.intentarConsumir('bea')).toBe(true);
    expect(limitador.intentarConsumir('ana')).toBe(false);
  });

  it('devuelve un uso cuando el intento falló', () => {
    const limitador = new LimitadorDeUso(1, 60_000);

    limitador.intentarConsumir('ana');
    limitador.devolver('ana');

    expect(limitador.usosRestantes('ana')).toBe(1);
    expect(limitador.intentarConsumir('ana')).toBe(true);
  });

  it('vuelve a empezar cuando pasa la ventana de tiempo', () => {
    vi.useFakeTimers();
    const limitador = new LimitadorDeUso(1, 60_000);

    expect(limitador.intentarConsumir('ana')).toBe(true);
    expect(limitador.intentarConsumir('ana')).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(limitador.intentarConsumir('ana')).toBe(true);
    vi.useRealTimers();
  });

  it('no baja de cero al devolver usos que no se habían gastado', () => {
    const limitador = new LimitadorDeUso(2, 60_000);

    limitador.devolver('ana');
    limitador.devolver('ana');

    expect(limitador.usosRestantes('ana')).toBe(2);
  });
});
