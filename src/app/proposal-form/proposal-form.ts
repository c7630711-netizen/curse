import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Proposal, STATUSES } from '../models';

@Component({
  selector: 'app-proposal-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './proposal-form.html',
  styleUrl: './proposal-form.css',
})
export class ProposalForm {
  readonly statuses = STATUSES;
  boyName = '';
  girlName = '';
  status = 0;
  notes = '';
  endReason = '';
  editingId: number | null = null;
  error = '';
  showBoyForm = false;
  showGirlForm = false;
  newBoyName = '';
  newBoyPhone = '';
  newBoyNotes = '';
  newGirlName = '';
  newGirlPhone = '';
  newGirlNotes = '';

  constructor(public data: DataService, route: ActivatedRoute, private router: Router) {
    route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) return;
      const proposal = data.proposals().find(x => x.id === id);
      if (!proposal) return;
      this.editingId = id;
      this.boyName = data.boy(proposal.boyId)?.name ?? '';
      this.girlName = data.girl(proposal.girlId)?.name ?? '';
      this.status = proposal.status;
      this.notes = proposal.notes;
      this.endReason = proposal.endReason;
    });
  }

  activeBoys() { return this.data.boys().filter(x => x.active); }
  activeGirls() { return this.data.girls().filter(x => x.active); }

  addPerson(kind: 'boy' | 'girl'): void {
    const isBoy = kind === 'boy';
    const name = (isBoy ? this.newBoyName : this.newGirlName).trim();
    if (!name) { this.error = 'יש להזין שם מועמד'; return; }
    const person = this.data.createPerson(kind, {
      name,
      phone: isBoy ? this.newBoyPhone : this.newGirlPhone,
      notes: isBoy ? this.newBoyNotes : this.newGirlNotes,
    });
    if (isBoy) { this.boyName = person.name; this.showBoyForm = false; }
    else { this.girlName = person.name; this.showGirlForm = false; }
    this.error = '';
  }

  save(): void {
    const boyName = this.boyName.trim();
    const girlName = this.girlName.trim();
    if (!boyName || !girlName) {
      this.error = 'יש להזין שם של בחור ושל בחורה';
      return;
    }

    const existing = this.editingId
      ? this.data.proposals().find(x => x.id === this.editingId)
      : undefined;
    const boy = this.findPerson('boy', boyName, existing?.boyId);
    const girl = this.findPerson('girl', girlName, existing?.girlId);

    if (boy && girl && this.data.duplicate(boy.id, girl.id, this.editingId ?? undefined)) {
      this.error = 'כבר קיימת הצעה בין אותו בחור לאותה בחורה';
      return;
    }

    const savedBoy = boy ?? this.data.createPerson('boy', {
      name: boyName, phone: '', notes: ''
    });
    const savedGirl = girl ?? this.data.createPerson('girl', {
      name: girlName, phone: '', notes: ''
    });
    const today = new Date().toISOString().slice(0, 10);
    const proposal: Proposal = {
      id: this.editingId ?? Math.max(0, ...this.data.proposals().map(x => x.id)) + 1,
      boyId: savedBoy.id,
      girlId: savedGirl.id,
      status: this.status,
      notes: this.notes,
      endReason: this.status === 7 ? this.endReason : '',
      createdAt: existing?.createdAt ?? today,
      updatedAt: today,
    };
    this.data.saveProposal(proposal);
    this.router.navigate(['/proposals']);
  }

  private findPerson(kind: 'boy' | 'girl', name: string, currentId?: number): ReturnType<DataService['boy']> {
    const normalizedName = this.normalizeName(name);
    const people = kind === 'boy' ? this.data.boys() : this.data.girls();
    const activeMatch = people.find(person =>
      person.active && this.normalizeName(person.name) === normalizedName);
    if (activeMatch) return activeMatch;

    const currentPerson = currentId === undefined
      ? undefined
      : kind === 'boy' ? this.data.boy(currentId) : this.data.girl(currentId);
    return currentPerson && this.normalizeName(currentPerson.name) === normalizedName
      ? currentPerson
      : undefined;
  }

  private normalizeName(name: string): string {
    return name.trim().toLocaleLowerCase();
  }
}
