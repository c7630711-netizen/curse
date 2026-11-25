import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { Proposal, STATUSES } from '../models';

@Component({
  selector: 'app-proposals',
  imports: [FormsModule, RouterLink],
  templateUrl: './proposals.html',
  styleUrl: './proposals.css',
})
export class Proposals {
  boyQuery = '';
  girlQuery = '';
  statusFilter = -1;
  readonly statuses = STATUSES;

  constructor(public data: DataService, route: ActivatedRoute) {
    route.queryParamMap.subscribe(params => {
      const status = params.get('status');
      this.statusFilter = status === null ? -1 : Number(status);
    });
  }

  filtered(): Proposal[] {
    return this.data.proposals().filter(p => {
      const boy = this.data.boy(p.boyId);
      const girl = this.data.girl(p.girlId);
      return (this.statusFilter === -1 || p.status === this.statusFilter)
        && (boy?.name.includes(this.boyQuery) ?? false)
        && (girl?.name.includes(this.girlQuery) ?? false);
    });
  }

  deleteProposal(id: number): void {
    if (confirm('למחוק את ההצעה לחלוטין?')) this.data.deleteProposal(id);
  }
}
