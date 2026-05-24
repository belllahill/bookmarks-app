import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Validators, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Bookmark } from '../services/bookmark';
import { urlFormatValidator, urlValidator } from '../validators/url.validator';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { filter, firstValueFrom, race, take, timer } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-overview',
  imports: [ReactiveFormsModule, CommonModule, PaginatorModule, MatButtonModule],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview implements OnInit{
  private router = inject(Router);
  bookmarkService: Bookmark = inject(Bookmark);
  first = 0;
  rows = 20;
  displayedBookmarks: string[] = [];
  allBookmarks: string[] = [];
  buttonDisabled = false;
  urlError: string|null = null;

  bookmarkForm = new FormGroup({
    link: new FormControl('', {
      validators: [
        Validators.required, 
        urlFormatValidator()
      ],
      asyncValidators: [urlValidator()],
      updateOn: 'submit'
    })
  });

  ngOnInit(): void {
    this.allBookmarks = this.bookmarkService.getBookmarks();
    this.displayedBookmarks = this.bookmarkService.updatedDisplayedBookmarks(this.first, this.rows, this.allBookmarks);
    this.clearErrors();
  }

  async onSubmit() {
    this.clearErrors();
    this.bookmarkForm.updateValueAndValidity();
    
    if (this.bookmarkForm.invalid) {
      const control = this.bookmarkForm.get('link');
      if (control?.hasError('required')) {
        this.bookmarkService.addUrlError('URL must not be empty.');
      }
      if (control?.hasError('invalidUrlFormat')) {
        this.bookmarkService.addUrlError('Not a valid URL.');
      }
      this.urlError = this.bookmarkService.getError();
      this.toggleErrors();
      return;
    }

    const finished = race(
      this.bookmarkForm.statusChanges.pipe(
        filter(status => status !== 'PENDING'),
        take(1)
      ),
      timer(5000) 
    );

    await firstValueFrom(finished);

    if (this.bookmarkForm.invalid) {
      const control = this.bookmarkForm.get('link');
      if (control?.hasError('invalidUrl')) {
        this.bookmarkService.addUrlError('URL not found.');

      }
      this.urlError = this.bookmarkService.getError();
      this.toggleErrors();
      return;
    }

    const url = this.bookmarkService.normaliseUrl(String(this.bookmarkForm.get('link')?.value));
    this.bookmarkService.addBookmark(url);  
    this.router.navigate(['/results']);
    this.buttonDisabled = false;
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 20;
    this.displayedBookmarks = this.bookmarkService.updatedDisplayedBookmarks(this.first, this.rows, this.allBookmarks);
    }

  clearErrors() {
    this.bookmarkService.clearErrors();
    this.urlError = this.bookmarkService.getError();
    this.toggleErrors();
  }

  toggleErrors() {
    const input = document.getElementById('link') as HTMLElement;
    const hasErrors = !!this.bookmarkService.getError();
    input.classList.toggle('input-error', hasErrors);
  }

}
