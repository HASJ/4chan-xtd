// @ts-nocheck
import Callbacks from "../classes/Callbacks";
import Post from "../classes/Post";
import { indexState } from "../General/IndexState";
import { g, Conf, d, doc } from "../globals/globals";
import $ from "../platform/$";
import { DAY, HOUR, MINUTE, SECOND } from "../platform/helpers";

const RelativeDates = {
  INTERVAL: 30000,

  init() {
    if (
      (
        ['index', 'thread', 'archive'].includes(g.VIEW) &&
        ['Show', 'Both', 'BothRelativeFirst'].includes(Conf.RelativeTime)
      ) ||
indexState.enabled
    ) {
      this.flush();
      $.on(d, 'visibilitychange PostsInserted', this.flush);
    }

    if (Conf.RelativeTime !== 'No') {
      return Callbacks.Post.push({
        name: 'Relative Post Dates',
        cb:   this.node
      });
    }
  },

  node(this: Post) {
    if (!this.info.date) { return; }
    const dateEl = this.nodes.date;
    if (Conf.RelativeTime === 'Hover') {
      $.on(dateEl, 'mouseover', () => RelativeDates.hover(this));
      return;
    }
    if (this.isClone) { return; }

    // Show original absolute time as tooltip so users can still know exact times
    // Since "Time Formatting" runs its `node` before us, the title tooltip will
    // pick up the user-formatted time instead of 4chan time when enabled.
    if (Conf.RelativeTime === 'Show') {
      dateEl.dataset.fullTime = dateEl.textContent;
      dateEl.title = dateEl.textContent;
    }

    return RelativeDates.update(this);
  },

  /** @param diff is milliseconds from now. */
  relative(diff: number, now: Date, date: Date, abbrev: boolean): string {
    let number: number;
    let unit: string;
    if ((number = (diff / DAY)) >= 1) {
      ({ number, unit } = RelativeDates.calendarRelative(number, now, date));
    } else if ((number = (diff / HOUR)) >= 1) {
      unit = 'hour';
    } else if ((number = (diff / MINUTE)) >= 1) {
      unit = 'minute';
    } else {
      // prevent "-1 seconds ago"
      number = Math.max(0, diff) / SECOND;
      unit = 'second';
    }

    const rounded = Math.round(number);

    if (abbrev) {
      unit = unit === 'month' ? 'mo' : unit[0];
    } else if (rounded !== 1) {
      unit += 's';
    }

    if (abbrev) { return `${rounded}${unit}`; }
    return `${rounded} ${unit} ago`;
  },

  calendarRelative(number: number, now: Date, date: Date) {
    const years = now.getFullYear() - date.getFullYear();
    let months = now.getMonth() - date.getMonth();
    const days = now.getDate() - date.getDate();

    if (years > 1) {
      return {
        number: years - Number((months < 0) || ((months === 0) && (days < 0))),
        unit: 'year'
      };
    }
    if ((years === 1) && ((months > 0) || ((months === 0) && (days >= 0)))) {
      return { number: years, unit: 'year' };
    }

    months += 12 * years;
    if (months > 1) {
      return { number: months - Number(days < 0), unit: 'month' };
    }
    if ((months === 1) && (days >= 0)) {
      return { number: months, unit: 'month' };
    }
    return { number, unit: 'day' };
  },

  // Changing all relative dates as soon as possible incurs many annoying
  // redraws and scroll stuttering. Thus, sacrifice accuracy for UX/CPU economy,
  // and perform redraws when the DOM is otherwise being manipulated (and scroll
  // stuttering won't be noticed), falling back to INTERVAL while the page
  // is visible.
  //
  // Each individual dateTime element will add its update() function to the stale list
  // when it is to be called.
  stale: [],
  timeout: undefined as undefined | number,
  flush() {
    // No point in changing the dates until the user sees them.
    if (d.hidden) { return; }

    const now = new Date();
    for (const data of RelativeDates.stale) { RelativeDates.update(data, now); }
    RelativeDates.stale = [];

    // Reset automatic flush.
    clearTimeout(RelativeDates.timeout);
    RelativeDates.timeout = setTimeout(RelativeDates.flush, RelativeDates.INTERVAL);
  },

  hover(post) {
    const { date } = post.info;
    const now  = new Date();
    const diff = now - date;
    post.nodes.date.title = RelativeDates.relative(diff, now, date);
  },

  // `update()`, when called from `flush()`, updates the elements,
  // and re-calls `setOwnTimeout()` to re-add `data` to the stale list later.
  update(data: Post | HTMLElement, now = new Date()) {
    let abbrev: boolean, date: Date;
    const isPost = data instanceof Post;
    if (isPost) {
      ({ date } = data.info);
      abbrev = false;
    } else {
      date = new Date(+data.dataset.utc);
      abbrev = !!data.dataset.abbrev;
    }
    const diff = now - date;
    const relative = RelativeDates.relative(diff, now, date, abbrev);
    if (isPost) {
      RelativeDates.updatePostDates(data, relative);
    } else {
      data.firstChild.textContent = relative;
    }
    RelativeDates.setOwnTimeout(diff, data);
  },

  updatePostDates(post, relative) {
    for (const singlePost of [post].concat(post.clones)) {
      const node = singlePost.nodes.date;
      if (Conf.RelativeTime === 'Show') {
        node.textContent = relative;
        continue;
      }

      let full = node.dataset.fullTime;
      if (!full) {
        full = node.textContent;
        node.dataset.fullTime = full;
      }
      node.textContent = Conf.RelativeTime === 'Both' ? `${full}, ${relative}` : `${relative}, ${full}`;
    }
  },

  setOwnTimeout(diff, data) {
    let delay;
    if (diff < MINUTE) {
      delay = SECOND - ((diff + (SECOND / 2)) % SECOND);
    } else if (diff < HOUR) {
      delay = MINUTE - ((diff + (MINUTE / 2)) % MINUTE);
    } else if (diff < DAY) {
      delay = HOUR - ((diff + (HOUR / 2)) % HOUR);
    } else {
      delay = DAY - ((diff + (DAY / 2)) % DAY);
    }
    setTimeout(RelativeDates.markStale, delay, data);
  },

  markStale(data) {
    if (RelativeDates.stale.includes(data)) { return; } // We can call RelativeDates.update() multiple times.
    if (data instanceof Post && !g.posts.get(data.fullID)) { return; } // collected post.
    if (data instanceof Element && !doc.contains(data)) { return; } // removed catalog reply.
    RelativeDates.stale.push(data);
  }
};
export default RelativeDates;
