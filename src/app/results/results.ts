import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-results',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results {
  url: string = localStorage.getItem('url')!;
}
