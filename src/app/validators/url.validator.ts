import { inject } from "@angular/core";
import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from "@angular/forms";
import { Bookmark } from "../services/bookmark";


export function urlValidator(): AsyncValidatorFn {
  return async (control:AbstractControl) : Promise<ValidationErrors | null> => {
    
    let url = control.value;

    if (!url) {
      return null;
    }
    
    async function urlExists(value: string): Promise<boolean> {
      try {
        const url = value.startsWith('http')
        ? value
        : `https://${value}`;
        
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        
        return true;
      } catch {
        return false;
      }
    }
    return await urlExists(url) ? null : {invalidUrl: true};
  }
}

/**
 * Gets the URL input from the user and checks it for format issues.
 * @returns An error if there are syntax errors in the URL input.
 */
export function urlFormatValidator(): ValidatorFn {
  const bookmarkService = inject(Bookmark)
  return (control:AbstractControl) : ValidationErrors | null => {
    let url = control.value;

    if (!url) {
      return null;
    }

    return bookmarkService.checkUrlFormat(url) ? null : {invalidUrlFormat: true};  
  }
}

/**
 * Gets the URL input from the user and checks it isn't already saved.
 * @returns An error if the URL is already bookmarked.
 */
export function urlDuplicateValidator(): ValidatorFn {
  const bookmarkService = inject(Bookmark)
  return (control:AbstractControl) : ValidationErrors | null => {
    let url = control.value;

    if (!url) {
      return null;
    }

    const bookmarks = bookmarkService.getBookmarks();
    const normalisedUrl = bookmarkService.normaliseUrl(url);
    
    return !(bookmarks.includes(normalisedUrl)) ? null : {duplicateUrl: true};  
  }
}