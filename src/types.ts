export interface PasteOptions {
  ignoreEmpty: boolean;
  trimLines: boolean;
  reverse: boolean;
  shuffle: boolean;
  loop: boolean;
  sortByPosition: boolean;
  separator: 'newline' | 'comma' | 'custom';
  customSeparator: string;
}

export const DEFAULT_OPTIONS: PasteOptions = {
  ignoreEmpty: true,
  trimLines: false,
  reverse: false,
  shuffle: false,
  loop: true,
  sortByPosition: false,
  separator: 'newline',
  customSeparator: '',
};

export const STORAGE_KEY = 'paster.options';
