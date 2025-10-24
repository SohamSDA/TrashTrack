export abstract class Role {
  constructor(public readonly name: 'recycler'|'collector'|'admin') {}
  canAwardCoins(){ return this.name !== 'recycler'; }
}
export class Recycler extends Role { constructor(){ super('recycler'); } }
export class Collector extends Role { constructor(){ super('collector'); } }

