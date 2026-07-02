export interface RandomAccessListItem {
  prev?: RandomAccessListItem | null;
  next?: RandomAccessListItem | null;
  data: any;
  ID: string | number;
}

export default class RandomAccessList {
  length: number;
  first: RandomAccessListItem | null = null;
  last: RandomAccessListItem | null = null;
  [key: string]: any; // Index signature to allow random access properties by ID

  constructor(items?: any[]) {
    this.length = 0;
    if (items) {
      for (const item of items) {
        this.push(item);
      }
    }
  }

  push(data: any): number | undefined {
    let item: RandomAccessListItem;
    let ID = data.ID;
    if (!ID) {
      ID = data.id;
    }
    if (this[ID]) {
      return;
    }
    const last = this.last;
    this[ID] = (item = {
      prev: last,
      next: null,
      data,
      ID
    });
    item.prev = last;
    this.last = last ? (last.next = item) : (this.first = item);
    return this.length++;
  }

  before(root: RandomAccessListItem, item: RandomAccessListItem): void {
    if ((item.next === root) || (item === root)) {
      return;
    }

    this.rmi(item);

    const prev = root.prev;
    root.prev = item;
    item.next = root;
    item.prev = prev;
    if (prev) {
      prev.next = item;
    } else {
      this.first = item;
    }
  }

  after(root: RandomAccessListItem, item: RandomAccessListItem): void {
    if ((item.prev === root) || (item === root)) {
      return;
    }

    this.rmi(item);

    const next = root.next;
    root.next = item;
    item.prev = root;
    item.next = next;
    if (next) {
      next.prev = item;
    } else {
      this.last = item;
    }
  }

  prepend(item: RandomAccessListItem): boolean | undefined {
    const first = this.first;
    if ((item === first) || !this[item.ID]) {
      return;
    }
    this.rmi(item);
    item.next = first;
    if (first) {
      first.prev = item;
    } else {
      this.last = item;
    }
    this.first = item;
    return delete item.prev;
  }

  shift(): boolean | undefined {
    if (this.first) {
      return this.rm(this.first.ID);
    }
  }

  order(): RandomAccessListItem[] {
    let item = this.first;
    if (!item) return [];
    const order: RandomAccessListItem[] = [item];
    while (item && item.next) {
      item = item.next;
      order.push(item);
    }
    return order;
  }

  rm(ID: string | number): boolean | undefined {
    const item = this[ID];
    if (!item) {
      return;
    }
    delete this[ID];
    this.length--;
    this.rmi(item);
    delete item.next;
    return delete item.prev;
  }

  rmi(item: RandomAccessListItem): void {
    const { prev, next } = item;
    if (prev) {
      prev.next = next;
    } else {
      this.first = next || null;
    }
    if (next) {
      next.prev = prev;
    } else {
      this.last = prev || null;
    }
  }
}
