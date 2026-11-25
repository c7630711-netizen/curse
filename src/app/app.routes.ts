import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Proposals } from './proposals/proposals';
import { ProposalForm } from './proposal-form/proposal-form';
import { People } from './people/people';
import { PersonCard } from './person-card/person-card';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'proposals', component: Proposals },
  { path: 'proposals/new', component: ProposalForm },
  { path: 'proposals/:id/edit', component: ProposalForm },
  { path: 'boys', component: People, data: { kind: 'boy' } },
  { path: 'girls', component: People, data: { kind: 'girl' } },
  { path: ':kind/:id', component: PersonCard },
  { path: '**', redirectTo: '' },
];
