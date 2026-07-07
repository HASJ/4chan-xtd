import { d } from "../globals/globals";

const $$: any = (selector: string, root: ParentNode = d.body): HTMLElement[] => Array.from(root.querySelectorAll(selector)) as HTMLElement[];
export default $$;
