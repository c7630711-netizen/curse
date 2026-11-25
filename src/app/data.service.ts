import { Injectable, signal } from '@angular/core';
import { Person, Proposal } from './models';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly storageKey = 'shiduchim-angular-v1';
  readonly boys = signal<Person[]>([]);
  readonly girls = signal<Person[]>([]);
  readonly proposals = signal<Proposal[]>([]);

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        const boys = this.removeDemoPeople(data.boys ?? [], 'boy');
        const girls = this.removeDemoPeople(data.girls ?? [], 'girl');
        const seedBoyIds = new Set(boys.removedIds);
        const seedGirlIds = new Set(girls.removedIds);
        const proposals = (data.proposals ?? []).filter((proposal: Proposal) =>
          ![1, 2, 3, 4].includes(proposal.id) &&
          !seedBoyIds.has(proposal.boyId) &&
          !seedGirlIds.has(proposal.girlId));

        this.boys.set(boys.people);
        this.girls.set(girls.people);
        this.proposals.set(proposals);

        if (boys.removed || girls.removed || proposals.length !== (data.proposals?.length ?? 0)) {
          this.save();
        }
        return;
      }
    } catch (error) {
      console.warn('Could not load saved shiduchim data:', error);
    }

    this.boys.set([]);
    this.girls.set([]);
    this.proposals.set([]);
  }

  private removeDemoPeople(people: Person[], kind: 'boy' | 'girl'): {
    people: Person[];
    removed: boolean;
    removedIds: number[];
  } {
    const demoRecords = kind === 'boy'
      ? [
          ['יעקב כהן', '050-1234567'],
          ['דוד ישראלי', '052-2345678'],
          ['משה לוי', '054-3456789'],
          ['אברהם רוזן', '050-4567890'],
        ]
      : [
          ['רחל לוי', '050-9876543'],
          ['שרה כהן', '052-8765432'],
          ['מרים פרידמן', '054-7654321'],
          ['אסתר כהן', '053-6543210'],
        ];

    const removedIds: number[] = [];
    const filtered = people.filter(person => {
      const isDemo = demoRecords.some(([name, phone]) =>
        person.name === name && person.phone === phone);
      if (isDemo) removedIds.push(person.id);
      return !isDemo;
    });

    return { people: filtered, removed: removedIds.length > 0, removedIds };
  }

  private save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify({
      boys: this.boys(), girls: this.girls(), proposals: this.proposals()
    }));
  }

  boy(id: number): Person | undefined { return this.boys().find(x => x.id === id); }
  girl(id: number): Person | undefined { return this.girls().find(x => x.id === id); }

  upsertPerson(kind: 'boy' | 'girl', person: Person): void {
    const list = kind === 'boy' ? this.boys : this.girls;
    const values = list();
    list.set(values.some(x => x.id === person.id)
      ? values.map(x => x.id === person.id ? person : x)
      : [...values, person]);
    this.save();
  }

  createPerson(kind: 'boy' | 'girl', data: Omit<Person, 'id' | 'active'>): Person {
    const list = kind === 'boy' ? this.boys : this.girls;
    const person = { ...data, id: Math.max(0, ...list().map(x => x.id)) + 1, active: true };
    list.set([...list(), person]);
    this.save();
    return person;
  }

  deletePerson(kind: 'boy' | 'girl', id: number): void {
    const list = kind === 'boy' ? this.boys : this.girls;
    list.set(list().map(x => x.id === id ? { ...x, active: false } : x));
    this.save();
  }

  saveProposal(proposal: Proposal): void {
    const values = this.proposals();
    this.proposals.set(values.some(x => x.id === proposal.id)
      ? values.map(x => x.id === proposal.id ? proposal : x)
      : [...values, proposal]);
    this.save();
  }

  deleteProposal(id: number): void {
    this.proposals.set(this.proposals().filter(x => x.id !== id));
    this.save();
  }

  duplicate(boyId: number, girlId: number, excludeId?: number): boolean {
    return this.proposals().some(x =>
      x.boyId === boyId && x.girlId === girlId && x.id !== excludeId);
  }
}
