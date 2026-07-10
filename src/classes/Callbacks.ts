let errorHandler: ((errors: any[]) => void) | null = null;

export default class Callbacks {
  static readonly Post = new Callbacks('Post');
  static readonly Thread = new Callbacks('Thread');
  static readonly CatalogThread = new Callbacks('Catalog Thread');
  static readonly CatalogThreadNative = new Callbacks('Catalog Thread');
  static setErrorHandler(handler: ((errors: any[]) => void) | null) {
    errorHandler = handler;
  }

  static handleErrors(errors: any[]) {
    errorHandler?.(errors);
  }

  type: string;
  keys: string[];
  [key: string]: any; // Index signature to allow dynamic callback name registration

  constructor(type: string) {
    this.type = type;
    this.keys = [];
  }

  push({ name, cb }: { name: string; cb: (this: any) => void }): (this: any) => void {
    if (!this[name]) {
      this.keys.push(name);
    }
    this[name] = cb;
    return cb;
  }

  execute(node: any, keys: string[] = this.keys, force = false): void {
    let errors: any[] | undefined;
    if (node.callbacksExecuted && !force) {
      return;
    }
    node.callbacksExecuted = true;
    for (const name of keys) {
      try {
        this[name]?.call(node);
      } catch (err) {
        if (!errors) {
          errors = [];
        }
        errors.push({
          message: ['"', name, '" crashed on node ', this.type, ' No.', node.ID, ' (', node.board, ').'].join(''),
          error: err,
          html: node.nodes?.root?.outerHTML
        });
      }
    }

    if (errors) {
      Callbacks.handleErrors(errors);
    }
  }
}
