import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Bookmark {

  /**
   * Checks for existance of bookmarks list in local storage, 
   * and creates one if one does not already exist.
   */
  initialiseBookmarkList(): void {
    const existingList = localStorage.getItem('bookmarks');
    if (!existingList) {
      localStorage.setItem('bookmarks', JSON.stringify([]));
    }
  }

  /**
   * @returns a list of all bookmarks in local storage.
   */
  getBookmarks(): string[] {
    return JSON.parse(localStorage.getItem('bookmarks') || '[]');
  }

  /**
   * Updates 'url' item in local storage to display on results page.
   * Adds URL to list of bookmarks in local storage.
   * @param url Most recent successful URL input (normalised).
   */
  addBookmark(url: string): void {
    localStorage.setItem('url', url);
    this.updateBookmarks([...this.getBookmarks(), url]);
  }

  /**
   * Deletes bookmark requested by user.
   * @param bookmarkToDelete 
   */
  deleteBookmark(bookmarkToDelete: string): void {
    const bookmarks = this.getBookmarks();
    const newBookmarks = bookmarks.filter(bookmark => bookmark !== bookmarkToDelete);
    this.updateBookmarks(newBookmarks);
  }

  updateBookmarks(bookmarks: string[]): void {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }

  /**
   * Slices list of bookmarks to show correct number for pagination.
   * @param pageIndex Page number.
   * @param pageSize Number of results per page.
   * @param allBookmarks List of all bookmarks.
   * @returns Subset of bookmark URLs for the page specified.
   */
  updatedDisplayedBookmarks(pageIndex: number, pageSize: number, allBookmarks: string[]): string[] {
    const start = pageIndex;
    const end = start + pageSize;
    return allBookmarks.slice(start, end);
  }

  checkUrlParsing(url: string): boolean {
    try {
      new URL(url);
      return true; 
    } catch {
      try {
        new URL('https://' + url);
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * @param url URL as submitted by user.
   * @returns Whether the URL can both be parsed and fit validation regex.
   */
  checkUrlFormat(url: string): boolean {
    const urlRegex = /^(https?:\/\/)?([\w.-]+\.[a-z]{2,})(:\d+)?(\/[^\s#]*)?(#[^\s]*)?$/i;
    return this.checkUrlParsing(url) && urlRegex.test(url);
  }

  /**
   * Checks if URL starts with 'http'.
   * Adds it if not already there.
   * @param url URL as submitted by user.
   * @returns Normalised URL.
   */
  normaliseUrl(url: string): string {
    if (!(url.includes('http'))) {
      url = 'https://' + url;
    }
    return url;
  }
  
  addUrlError(errorMessage: string): void {
    localStorage.setItem('urlError', errorMessage);
  }

  clearErrors(): void {
    localStorage.removeItem('urlError');
  }

  getError(): string|null {
    return localStorage.getItem('urlError');
  }
}
