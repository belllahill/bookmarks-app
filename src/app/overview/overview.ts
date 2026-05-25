import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Validators, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
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

  // Variables for pagination.
  first: number = 0;
  rows: number = 20;
  displayedBookmarks: string[] = [];
  allBookmarks: string[] = [];

  // Variables for displaying errors and editing bookmarks.
  urlError: string|null = null;
  duplicateBookmark: string|null = null;
  editingBookmark: string|null = null;

  // Initial input form for new bookmarks.
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

  // Form for editing bookmarks.
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

  /**
   * Checks for any issues when a user submits a bookmark.
   * Displays errors if they are found, otherwise adds
   * bookmark to list of bookmarks and takes user to
   * the results page.
   */
  async onSubmit(): Promise<void> {
    // Make sure bookmark editing form is closed so errors don't overlap.
    this.editingBookmark = null;
    this.clearErrors();
    this.bookmarkForm.updateValueAndValidity();
    const urlInput = this.bookmarkForm.get('link');

    // Validate URL.
    if (await this.validateUrl(this.bookmarkForm, urlInput, 'link')) return;
    
    // Add normalised URL to local storage and take user to results page.
    const normalisedUrl = this.bookmarkService.normaliseUrl(String(urlInput?.value));
    this.bookmarkService.addBookmark(normalisedUrl);  
    this.router.navigate(['/results']);
  }

  /**
   * Similar to the onSubmit function, but slightly different as 
   * is called when the user attempts to edit a bookmark.
   * Checks for validation errors and updates bookmark in list
   * to new bookmark if none occur.
   */
  async onEdit(): Promise<void> {
    this.clearErrors();
    this.editForm.updateValueAndValidity();
    const urlInput = this.editForm.get('edit');

    // Save original URL for comparison.
    const oldUrl = this.editingBookmark;
    // No changes made so no validation needed.
    if (oldUrl == this.bookmarkService.normaliseUrl(String(urlInput?.value))) {
      this.editingBookmark = null;
      this.updateErrorsAndBookmarks();
      return;
    }

    // Validate URL.
    if (await this.validateUrl(this.editForm, urlInput, 'edit')) return;
    
    // Normalise URL and replace old URL with new one.
    const normalisedUrl = this.bookmarkService.normaliseUrl(String(urlInput?.value));
    this.bookmarkService.editBookmark(oldUrl!, normalisedUrl);  
    this.editingBookmark = null;
    this.updateErrorsAndBookmarks();
  }

  /**
   * First checks if URL has been entered.
   * Then checks if it is a duplicate that is already saved.
   * Then checks if it is syntactically valid.
   * Finally checks if the URL exists.
   * Adds relevant errors for each case.
   * @param form Either initial input form or editing form.
   * @param urlInput The user input, including errors
   * @param field The id field to add error classes.
   * @returns True if there are errors, false if no errors.
   */  
  async validateUrl(form: any, urlInput: any, field: string): Promise<boolean> {
    if (form.invalid) {
      if (urlInput?.hasError('required')) {
        this.bookmarkService.addUrlError('URL must not be empty.');
      } 
      else if (urlInput?.hasError('duplicateUrl')) {
        this.bookmarkService.addUrlError('URL already bookmarked.');
        if (field === 'link') this.highlightDuplicateBookmark(urlInput);
      } 
      else if (urlInput?.hasError('invalidUrlFormat')) {
        this.bookmarkService.addUrlError('Not a valid URL.');
      }
      this.urlError = this.bookmarkService.getError();
      this.toggleErrors(field);
      return true;
    }

    // This is to make sure the URL checker has time to process.
    const finished = race(
      form.statusChanges.pipe(
        filter(status => status !== 'PENDING'),
        take(1)
      ),
      timer(5000) 
    );

    await firstValueFrom(finished);

    // Check that URL is a real URL.
    if (form.invalid) {
      if (urlInput?.hasError('invalidUrl')) {
        this.bookmarkService.addUrlError('URL not found.');

      }
      this.urlError = this.bookmarkService.getError();
      this.toggleErrors(field);
      return true;
    }
    return false;
  }

  /**
   * Paginator to display 20 results per page.
   */
  onPageChange(event: PaginatorState): void {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 20;
    this.displayedBookmarks = this.bookmarkService.updatedDisplayedBookmarks(this.first, this.rows, this.allBookmarks);
  }
  
  /**
   * Calls the bookmark delete function in service.
   * Clears URL input from form.
   * Updates the errors and displayed bookmarks.
   * @param bookmarkToDelete 
   */
  deleteBookmark(bookmarkToDelete: string): void {
    const input = document.getElementById('link') as HTMLInputElement;
    input.value = '';
    this.bookmarkService.deleteBookmark(bookmarkToDelete);
    this.editingBookmark = null;
    this.updateErrorsAndBookmarks();
  }

  /**
   * Opens bookmark editing form and sets initial value as original bookmark URL.
   * @param bookmarkToEdit 
   */
  editBookmark(bookmarkToEdit: string): void {
    this.clearErrors();
    this.editingBookmark = bookmarkToEdit;
    this.editForm.get('edit')?.setValue(this.editingBookmark);
  }

  /**
   * Close editing form and clear any errors (URL remains unchanged).
   */
  closeEditing(): void {
  this.editingBookmark = null;
  this.clearErrors();
  }


  clearErrors(): void {
    this.bookmarkService.clearErrors();
    this.urlError = this.bookmarkService.getError();
    this.duplicateBookmark = null;
    this.toggleErrors('link');
    this.toggleErrors('edit');
  }

  /**
   * Toggles displayed errors for either the original input form,
   * or the edit bookmark form.
   * @param field the id of the input where errors occured.
   */
  toggleErrors(field: string): void {
    const input = document.getElementById(field) as HTMLElement;
    const hasErrors = !!this.bookmarkService.getError();
    if (field === 'link') {
      input?.classList.toggle('input-error', hasErrors);
    } else if (field === 'edit') {
      input?.classList.toggle('edit-error', hasErrors); 
    }
  }

  /**
   * Clears errors and updates bookmarks displayed on page (e.g. if a bookmark is deleted).
   */
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
    this.duplicateBookmark = this.bookmarkService.normaliseUrl(String(urlInput?.value));
    // Get index of duplicated bookmark.
    const index = this.allBookmarks.indexOf(this.duplicateBookmark);
    // Calculate correct 'first' value for bookmark for pagination.
    this.first = Math.floor(index/this.rows)*this.rows;
    this.displayedBookmarks = this.bookmarkService.updatedDisplayedBookmarks(this.first, this.rows, this.allBookmarks);
  }

}
