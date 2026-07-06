type SettingsOpener = (openSection?: string) => void;
type FilterSettingsOpener = (type: string) => void;

let settingsOpener: SettingsOpener = () => {};
let filterSettingsOpener: FilterSettingsOpener = () => {};

export function registerSettingsOpener(opener: SettingsOpener): void {
  settingsOpener = opener;
}

export function openSettings(openSection?: string): void {
  settingsOpener(openSection);
}

export function registerFilterSettingsOpener(opener: FilterSettingsOpener): void {
  filterSettingsOpener = opener;
}

export function openFilterSettings(type: string): void {
  filterSettingsOpener(type);
}
