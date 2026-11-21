// Generador aleatorio con semilla (mulberry32). Guardar su estado dentro de la
// partida hace que todo sea reproducible: misma semilla + mismas decisiones = mismo resultado.

export class Rng {
  constructor(private holder: { rng: number }) {}

  next(): number {
    this.holder.rng = (this.holder.rng + 0x6d2b79f5) | 0;
    let t = this.holder.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** Normal estándar (Box-Muller). */
  normal(): number {
    const u = Math.max(this.next(), 1e-9);
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  weighted<T>(items: readonly T[], weights: readonly number[]): T | undefined {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return undefined;
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
}
