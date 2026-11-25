import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Person, Proposal, STATUSES } from '../models';

@Component({
  selector: 'app-person-card',
  imports: [RouterLink],
  templateUrl: './person-card.html',
  styleUrl: './person-card.css',
})
export class PersonCard {
  person: Person | undefined;
  kind: 'boy' | 'girl' = 'boy';
  readonly statuses = STATUSES;

  constructor(public data: DataService, route: ActivatedRoute) {
    route.paramMap.subscribe(params => {
      const kindParam = route.snapshot.url[0]?.path;
      this.kind = kindParam === 'girl' ? 'girl' : 'boy';
      const id = Number(params.get('id'));
      this.person = this.kind === 'boy' ? data.boy(id) : data.girl(id);
    });
  }

  proposals(): Proposal[] {
    if (!this.person) return [];
    return this.data.proposals().filter(p =>
      this.kind === 'boy' ? p.boyId === this.person?.id : p.girlId === this.person?.id);
  }
}
