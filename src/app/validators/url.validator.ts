import { inject } from "@angular/core";
import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from "@angular/forms";
import { Bookmark } from "../services/bookmark";

/**
 * Takes the URL input from user and validates that the URL is
 * reachable by attempting a HEAD request.
 * @returns A validation error if the request can't be completed.
 */
export function urlValidator(): AsyncValidatorFn {
  return async (control:AbstractControl) : Promise<ValidationErrors | null> => {
    let url = control.value.trim();

    if (!url) {
      return null;
    }
    
    async function urlExists(value: string): Promise<boolean> {
      try {
        const url = /^https?:\/\//i.test(value)
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
    return (await urlExists(url)) ? null : {invalidUrl: true};
  }
}

/**
 * Takes the URL input from the user and validates its format.
 * @returns A validation error if there are syntax errors in the URL input.
 */
export function urlFormatValidator(): ValidatorFn {
  const bookmarkService = inject(Bookmark)
  return (control:AbstractControl) : ValidationErrors | null => {
    let url = control.value.trim();

    if (!url) {
      return null;
    }

    return bookmarkService.checkUrlFormat(url) ? null : {invalidUrlFormat: true};  
  }
}

/**
 * Takes the URL input from the user and validates whether it is already saved.
 * @returns A validation error if the URL is already bookmarked.
 */
export function urlDuplicateValidator(): ValidatorFn {
  const bookmarkService = inject(Bookmark)
  return (control:AbstractControl) : ValidationErrors | null => {
    let url = control.value.trim();

    if (!url) {
      return null;
    }

    const bookmarks = bookmarkService.getBookmarks();
    const normalisedUrl = bookmarkService.normaliseUrl(url);
    
    return !(bookmarks.includes(normalisedUrl)) ? null : {duplicateUrl: true};  
  }
}

/**
 * Takes the URL input from the user and validates whether anything has been entered after trimming whitespace.
 * @returns A validation error if the URL is empty.
 */
export function urlEmptyValidator(): ValidatorFn {
  return (control:AbstractControl) : ValidationErrors | null => {
    let url = control.value.trim();
    if (url == null || url === '') {
      return { required: true };
    }

    return null;
  };
}