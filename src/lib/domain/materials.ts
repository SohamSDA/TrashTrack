export abstract class BaseMaterial {
  #baseRate: number;
  constructor(public readonly code: 'PAPER'|'PLASTIC'|'IRON', public readonly name: string, baseRate: number){
    this.#baseRate = baseRate;
  }
  protected get baseRate(){ return this.#baseRate; }
  coinsFor(weightKg: number){ return Math.round(this.baseRate * weightKg); }
}
export class Paper extends BaseMaterial { constructor(rate=2){ super('PAPER','Paper', rate); } }
export class Plastic extends BaseMaterial {
  constructor(rate=3){ super('PLASTIC','Plastic', rate); }
  coinsFor(w: number){ const base = super.coinsFor(w); return w>5 ? base+5 : base; }
}
export class Iron extends BaseMaterial {
  constructor(rate=6){ super('IRON','Iron', rate); }
  coinsFor(w: number){ return Math.round(this.baseRate * 1.1 * w); }
}
export type MaterialCode = 'PAPER'|'PLASTIC'|'IRON';
export function materialFactory(code: MaterialCode){
  switch(code){ case 'PAPER': return new Paper(); case 'PLASTIC': return new Plastic(); case 'IRON': return new Iron(); }
}
