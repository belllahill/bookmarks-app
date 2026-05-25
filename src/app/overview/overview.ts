import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Validators, ReactiveFormsModule, FormControl, FormGroup, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Bookmark } from '../services/bookmark';
import { urlDuplicateValidator, urlFormatValidator, urlValidator } from '../validators/url.validator';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { filter, firstValueFrom, race, take, timer } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-overview',
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
    PaginatorModule, 
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.scss',
})
export class Overview implements OnInit{
  private router = inject(Router);
  bookmarkService: Bookmark = inject(Bookmark);
  first: number = 0;
  rows: number = 20;
  displayedBookmarks: string[] = [];
  allBookmarks: string[] = [];
  urlError: string|null = null;
  duplicateBookmark: string|null = null;
  editingBookmark: string|null = null;

  bookmarkForm = new FormGroup({
    link: new FormControl('', {
      validators: [
        Validators.required, 
        urlFormatValidator(),
        urlDuplicateValidator(),
      ],
      asyncValidators: [urlValidator()],
      updateOn: 'submit'
    })
  });

  editForm = new FormGroup({
    edit: new FormControl('', {
      validators: [
        Validators.required, 
        urlFormatValidator(),
        urlDuplicateValidator(),
      ],
      asyncValidators: [urlValidator()],
      updateOn: 'submit'
    })
  });

  ngOnInit(): void {
    this.updateErrorsAndBookmarks();
  }

  async onSubmit() {
    this.clearErrors();
    this.bookmarkForm.updateValueAndValidity();
    const urlInput = this.bookmarkForm.get('link');
    
    // First check if URL has been entered, 
    // then check if it is a duplicate, 
    // then check if it is valid format.
    // Add relevant errors for each case.
    if (this.bookmarkForm.invalid) {
      if (urlInput?.hasError('required')) {
        this.bookmarkService.addUrlError('URL must not be empty.');
      } 
      else if (urlInput?.hasError('duplicateUrl')) {
        this.bookmarkService.addUrlError('URL already bookmarked.');
        this.highlightDuplicateBookmark(urlInput);
      } 
      else if (urlInput?.hasError('invalidUrlFormat')) {
        this.bookmarkService.addUrlError('Not a valid URL.');
      }
      this.urlError = this.bookmarkService.getError();
      this.toggleErrors();
      return;
    }

    // This is to make sure the URL checker has time to process.
    const finished = race(
      this.bookmarkForm.statusChanges.pipe(
        filter(status => status !== 'PENDING'),
        take(1)
      ),
      timer(5000) 
    );

    await firstValueFrom(finished);

    // Check that URL is a real URL.
    if (this.bookmarkForm.invalid) {
      if (urlInput?.hasError('invalidUrl')) {
        this.bookmarkService.addUrlError('URL not found.');

      }
      this.urlError = this.bookmarkService.getError();
      this.toggleErrors();
      return;
    }

    // Add normalised URL to local storage and take user to results page.
    const normalisedUrl = this.bookmarkService.normaliseUrl(String(urlInput?.value));
    this.bookmarkService.addBookmark(normalisedUrl);  
    this.router.navigate(['/results']);
  }

  async onEdit() {
    this.clearErrors();
    this.editForm.updateValueAndValidity();
    const urlInput = this.editForm.get('edit');
    const oldUrl = this.editingBookmark;
    // No changes made.
    if (oldUrl == this.bookmarkService.normaliseUrl(String(urlInput?.value))) {
      this.editingBookmark = null;
      this.updateErrorsAndBookmarks();
      return;
    }
    
    // First check if URL has been entered, 
    // then check if it is a duplicate, 
    // then check if it is valid format.
    // Add relevant errors for each case.
    if (this.editForm.invalid) {
      if (urlInput?.hasError('required')) {
        this.bookmarkService.addUrlError('URL must not be empty.');
      } 
      else if (urlInput?.hasError('duplicateUrl')) {
        this.bookmarkService.addUrlError('URL already bookmarked.');
        this.highlightDuplicateBookmark(urlInput);
      } 
      else if (urlInput?.hasError('invalidUrlFormat')) {
        this.bookmarkService.addUrlError('Not a valid URL.');
      }
      this.urlError = this.bookmarkService.getError();
      this.toggleErrors();
      return;
    }

    // This is to make sure the URL checker has time to process.
    const finished = race(
      this.editForm.statusChanges.pipe(
        filter(status => status !== 'PENDING'),
        take(1)
      ),
      timer(5000) 
    );

    await firstValueFrom(finished);

    // Check that URL is a real URL.
    if (this.editForm.invalid) {
      if (urlInput?.hasError('invalidUrl')) {
        this.bookmarkService.addUrlError('URL not found.');

      }
      this.urlError = this.bookmarkService.getError();
      this.toggleErrors();
      return;
    }

    // Add normalised URL to local storage and take user to results page.
    const normalisedUrl = this.bookmarkService.normaliseUrl(String(urlInput?.value));
    this.bookmarkService.editBookmark(oldUrl!, normalisedUrl);  
    this.editingBookmark = null;
    this.updateErrorsAndBookmarks();
  }

  /**
   * 
   * @param event 
   */
  onPageChange(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 20;
    this.displayedBookmarks = this.bookmarkService.updatedDisplayedBookmarks(this.first, this.rows, this.allBookmarks);
  }
  
  /**
   * Calls the bookmark delete function in service.
   * Updates the errors and displayed bookmarks.
   * @param bookmarkToDelete 
   */
  deleteBookmark(bookmarkToDelete: string): void {
    this.bookmarkService.deleteBookmark(bookmarkToDelete);
    this.updateErrorsAndBookmarks();
  }

  editBookmark(bookmarkToEdit: string): void {
    this.editingBookmark = bookmarkToEdit;
    this.editForm.get('edit')?.setValue(this.editingBookmark);
  }

  clearErrors(): void {
    this.bookmarkService.clearErrors();
    this.urlError = this.bookmarkService.getError();
    this.duplicateBookmark = null;
    this.toggleErrors();
  }

  toggleErrors(): void {
    const input = document.getElementById('link') as HTMLElement;
    const hasErrors = !!this.bookmarkService.getError();
    input.classList.toggle('input-error', hasErrors);
  }

  updateErrorsAndBookmarks(): void {
    this.clearErrors();
    this.allBookmarks = this.bookmarkService.getBookmarks();
    this.displayedBookmarks = this.bookmarkService.updatedDisplayedBookmarks(this.first, this.rows, this.allBookmarks);
  }

  /**
   * Highlights a bookmark that is already on list when user tries to rebookmark it.
   * Takes user to page where bookmark is located.
   * @param urlInput URL already bookmarked by user.
   */
  highlightDuplicateBookmark(urlInput: any): void {
    // Clear input from duplicated bookmark attempt.
    const input = document.getElementById('link') as HTMLInputElement;
    input.value = '';
    this.duplicateBookmark = this.bookmarkService.normaliseUrl(String(urlInput?.value));
    // Get index of duplicated bookmark.
    const index = this.allBookmarks.indexOf(this.duplicateBookmark);
    // Calculate correct 'first' value for bookmark for pagination.
    this.first = Math.floor(index/this.rows)*this.rows;
    this.displayedBookmarks = this.bookmarkService.updatedDisplayedBookmarks(this.first, this.rows, this.allBookmarks);
  }

}
