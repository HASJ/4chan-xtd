import { Conf } from "../globals/globals";

let headerBar: HTMLElement | undefined;

export function setHeaderBar(bar: HTMLElement): void {
  headerBar = bar;
}

export function getHeaderDialogBorders(): [number, number] {
  if (Conf["Header auto-hide"] || !Conf["Fixed Header"]) return [0, 0];
  const height = headerBar?.getBoundingClientRect().height || 0;
  return Conf["Bottom Header"] ? [0, height] : [height, 0];
}
