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

export function urlDuplicateValidator(): ValidatorFn {
  const bookmarkService = inject(Bookmark)
  return (control:AbstractControl) : ValidationErrors | null => {
    let url = control.value;

    if (!url) {
      return null;
    }

    const bookmarks = bookmarkService.getBookmarks();
    console.log(bookmarks);
    const normalisedUrl = bookmarkService.normaliseUrl(url);


    return !(bookmarks.includes(normalisedUrl)) ? null : {duplicateUrl: true};  
  }
}