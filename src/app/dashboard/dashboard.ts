import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../data.service';
import { STATUSES } from '../models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  readonly statuses = STATUSES;

  constructor(public data: DataService) {}

  count(status: number): number {
    return this.data.proposals().filter(x => x.status === status).length;
  }
}
