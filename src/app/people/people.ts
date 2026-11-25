import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Person, Proposal, STATUSES } from '../models';

@Component({
  selector: 'app-people',
  imports: [FormsModule, RouterLink],
  templateUrl: './people.html',
  styleUrl: './people.css',
})
export class People {
  readonly statuses = STATUSES;
  kind: 'boy' | 'girl' = 'boy';
  query = '';
  editing: Person | null = null;
  personName = '';
  personPhone = '';
  personNotes = '';

  constructor(public data: DataService, route: ActivatedRoute) {
    route.data.subscribe(data => this.kind = data['kind'] ?? 'boy');
  }

  list(): Person[] {
    const all = this.kind === 'boy' ? this.data.boys() : this.data.girls();
    return all.filter(x => x.active && x.name.includes(this.query));
  }

  proposalsFor(person: Person): Proposal[] {
    return this.data.proposals().filter(proposal =>
      this.kind === 'boy' ? proposal.boyId === person.id : proposal.girlId === person.id);
  }

  proposedName(proposal: Proposal): string | undefined {
    return this.kind === 'boy'
      ? this.data.girl(proposal.girlId)?.name
      : this.data.boy(proposal.boyId)?.name;
  }

  openEdit(person: Person): void {
    this.editing = person;
    this.personName = person.name;
    this.personPhone = person.phone ?? '';
    this.personNotes = person.notes;
  }

  saveEdit(): void {
    if (!this.editing || !this.personName.trim()) return;
    this.data.upsertPerson(this.kind, {
      ...this.editing,
      name: this.personName.trim(),
      phone: this.personPhone,
      notes: this.personNotes,
    });
    this.editing = null;
  }

  add(): void {
    this.editing = { id: 0, name: '', phone: '', notes: '', active: true };
    this.personName = '';
    this.personPhone = '';
    this.personNotes = '';
  }

  saveNew(): void {
    if (!this.personName.trim()) return;
    this.data.createPerson(this.kind, {
      name: this.personName.trim(), phone: this.personPhone, notes: this.personNotes
    });
    this.editing = null;
  }

  deletePerson(id: number): void {
    if (confirm('לסמן מועמד זה כמחוק? ההצעות הקיימות יישמרו.')) {
      this.data.deletePerson(this.kind, id);
    }
  }
}
