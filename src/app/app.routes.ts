import { Routes } from '@angular/router';
import { Overview } from './overview/overview';
import { Results } from './results/results';

export const routes: Routes = [
  {
    path: 'overview',
    component: Overview,
    title: 'Overview'
  },
  {
    path: 'results',
    component: Results,
    title: 'Results'
  },
  {
    path: '',
    redirectTo: '/overview',
    pathMatch: 'full'
  }
];
