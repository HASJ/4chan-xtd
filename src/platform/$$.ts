import { d } from "../globals/globals";

const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = d.body): T[] =>
  Array.from(root.querySelectorAll(selector)) as T[];

export default $$;
