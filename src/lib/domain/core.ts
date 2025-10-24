import { BaseMaterial } from './materials';

export class CoinSystem {
  calculate(material: BaseMaterial, weightKg: number){ return material.coinsFor(weightKg); }
}
export class User {
  #balance = 0;
  constructor(public id: string, public fullName: string){}
  get balance(){ return this.#balance; }
  credit(n: number){ this.#balance += n; }
  debit(n: number){ this.#balance = Math.max(0, this.#balance - n); }
}
export type PickupStatus = 'requested'|'collected';
export class PickupRequest {
  constructor(
    public id: number,
    public userId: string,
    public materialCode: 'PAPER'|'PLASTIC'|'IRON',
    public weightKg: number,
    public status: PickupStatus = 'requested',
    public coinsAwarded = 0
  ){}
}
