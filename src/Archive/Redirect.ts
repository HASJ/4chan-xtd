import Notice from '../classes/Notice.js';
import { Conf } from '../globals/globals.js';
import $ from '../platform/$.js';
import CrossOrigin from '../platform/CrossOrigin.js';
import { DAY, dict } from '../platform/helpers.js';
import archives from './archives.json';

type Archive = (typeof archives)[number];

interface ArchiveFetchResult {
  status: number;
  statusText?: string;
  response: any;
}

const Redirect = {
  archives,
  /** List of archives by compatible functions. */
  data: null as {
    thread: Map<string, Archive>,
    threadJSON: Map<string, Archive>,
    post: Map<string, Archive>,
    file: Map<string, Archive>,
  } | null,

  init() {
    this.selectArchives();
    if (Conf['archiveAutoUpdate']) {
      const now = Date.now();
      if (now - (2 * DAY) >= Conf['lastarchivecheck'] || Conf['lastarchivecheck'] > now) this.update();
    }
  },

  selectArchives() {
    const o = {
      thread: new Map<string, Archive>(),
      threadJSON: new Map<string, Archive>(),
      post: new Map<string, Archive>(),
      file: new Map<string, Archive>(),
    };

    const archives = Redirect.indexArchivesByBoard(o);
    Redirect.applySelectedArchives(o, archives);

    Redirect.data = o;
  },

  indexArchivesByBoard(o) {
    const archives = dict();
    for (const data of Array.isArray(Conf['archives']) ? Conf['archives'] : []) {
      if (!data || typeof data !== 'object') { continue; }
      Redirect.normalizeArchiveBoards(data);
      if (!Redirect.isCompatibleArchive(data)) { continue; }
      archives[JSON.stringify(data.uid ?? data.name)] = data;
      Redirect.indexArchiveBoards(o, data);
    }
    return archives;
  },

  normalizeArchiveBoards(data) {
    for (const key of ['boards', 'files']) {
      if (!Array.isArray(data[key])) { data[key] = []; }
    }
  },

  isCompatibleArchive({software}) {
    return ['fuuka', 'foolfuuka'].includes(software);
  },

  indexArchiveBoards(o, data) {
    const { boards, files, software } = data;
    for (const boardID of boards) {
      Redirect.registerArchiveForBoard(o, boardID, data, files, software);
    }
  },

  registerArchiveForBoard(o, boardID, data, files, software) {
    if (!o.thread.has(boardID)) o.thread.set(boardID, data);
    if (!o.file.has(boardID) && files.includes(boardID)) o.file.set(boardID, data);
    if (software !== 'foolfuuka') { return; }
    if (!o.threadJSON.has(boardID)) o.threadJSON.set(boardID, data);
    if (!o.post.has(boardID)) o.post.set(boardID, data);
  },

  applySelectedArchives(o, archives) {
    for (const boardID in Conf['selectedArchives']) {
      const record = Conf['selectedArchives'][boardID];
      if (!record || typeof record !== 'object') { continue; }
      for (const [type, id] of Object.entries(record)) {
        const archive = archives[JSON.stringify(id)];
        if (!archive || !$.hasOwn(o, type)) { continue; }
        const boards = type === 'file' ? archive.files : archive.boards;
        if (boards.includes(boardID)) { o[type].set(boardID, archive); }
      }
    }
  },

  update(cb?: () => void) {
    const urls = Redirect.collectArchiveListUrls();
    if (!urls.length) {
      Redirect.parse([], cb);
      return;
    }
    Redirect.fetchArchiveLists(urls, cb);
  },

  collectArchiveListUrls(): string[] {
    const urls: string[] = [];
    for (const raw of Conf['archiveLists'].split('\n')) {
      const url = raw.trim();
      if (url && !url.startsWith('#')) { urls.push(url); }
    }
    return urls;
  },

  fetchArchiveLists(urls: string[], cb?: () => void) {
    const responses: any[] = [];
    let nloaded = 0;

    const fail = (url: string, action: string, msg: string) => new Notice('warning', `Error ${action} archive data from\n${url}\n${msg}`, 20);

    const load = (i: number) => (function(this: ArchiveFetchResult) {
      if (this.status !== 200) { return fail(urls[i], 'fetching', (this.status ? `Error ${this.statusText} (${this.status})` : 'Connection Error')); }
      let {response} = this;
      if (!Array.isArray(response)) { response = [response]; }
      responses[i] = response;
      nloaded++;
      if (nloaded === urls.length) {
        return Redirect.parse(responses, cb);
      }
    });

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      if (['[', '{'].includes(url[0])) {
        let response;
        try {
          response = JSON.parse(url);
        } catch (err) {
          fail(url, 'parsing', err instanceof Error ? err.message : String(err));
          continue;
        }
        load(i).call({status: 200, response});
      } else {
        CrossOrigin.ajax(url,
          {onloadend: load(i)});
      }
    }
  },

  parse(responses, cb?: () => void) {
    const archives: Archive[] = [];
    const archiveUIDs = dict();
    for (const response of responses) {
      for (const data of response) {
        const uid = JSON.stringify(data.uid ?? data.name);
        if (uid in archiveUIDs) {
          $.extend(archiveUIDs[uid], data);
        } else {
          archiveUIDs[uid] = dict.clone(data);
          archives.push(data);
        }
      }
    }
    const items = {archives, lastarchivecheck: Date.now()};
    $.set(items);
    $.extend(Conf, items);
    Redirect.selectArchives();
    return cb?.();
  },

  to(
    dest: 'post' | 'thread' | 'threadJSON' | 'file' | 'board' | 'search',
    data: { boardID: string, threadID?: string | number, postID?: string | number }
  ): string {
    const archive = (['search', 'board'].includes(dest) ? Redirect.data!.thread : Redirect.data![dest]).get(data.boardID);
    if (!archive) { return ''; }
    return (Redirect as any)[dest](archive, data);
  },

  protocol(archive) {
    let {
      protocol
    } = location;
    if (!$.getOwn(archive, protocol.slice(0, -1))) {
      protocol = protocol === 'https:' ? 'http:' : 'https:';
    }
    return `${protocol}//`;
  },

  thread(archive, {boardID, threadID, postID}) {
    // Keep the post number only if the location.hash was sent f.e.
    let path = threadID ?
      `${boardID}/thread/${threadID}`
    :
      `${boardID}/post/${postID}`;
    if (archive.software === 'foolfuuka') {
      path += '/';
    }
    if (threadID && postID) {
      path += archive.software === 'foolfuuka' ?
        `#${postID}`
      :
        `#p${postID}`;
    }
    return `${Redirect.protocol(archive)}${archive.domain}/${path}`;
  },

  threadJSON(archive, { boardID, threadID }) {
    return `${Redirect.protocol(archive)}${archive.domain}/_/api/chan/thread/?board=${boardID}&num=${threadID}`;
  },

  post(archive, {boardID, postID}) {
    // For fuuka-based archives:
    // https://github.com/eksopl/fuuka/issues/27
    const protocol = Redirect.protocol(archive);
    const url = `${protocol}${archive.domain}/_/api/chan/post/?board=${boardID}&num=${postID}`;
    if (!Redirect.securityCheck(url)) { return ''; }

    return url;
  },

  file(archive, {boardID, filename}) {
    if (!filename) { return ''; }
    if (boardID === 'f') {
      filename = encodeURIComponent($.unescape(decodeURIComponent(filename)));
    } else if (/[sm]\.jpg$/.test(filename)) {
      return '';
    }
    if (archive.name.endsWith('arch.b4k.co') || archive.name.endsWith('palanq.win')) {
      const [timeStamp, ext] = filename.split('.');
      if (timeStamp.length > 13) {
        // remove last 3 digits
        filename = `${timeStamp.slice(0,-3)}.${ext}`;
      }
    }
    return `${Redirect.protocol(archive)}${archive.domain}/${boardID}/full_image/${filename}`;
  },

  board(archive, {boardID}) {
    return `${Redirect.protocol(archive)}${archive.domain}/${boardID}/`;
  },

  search(archive, {boardID, type, value}) {
    if (type === 'name') {
      type = 'username';
    } else if (type === 'MD5') {
      type = 'image';
    }
    if (type === 'capcode') {
      // https://github.com/pleebe/FoolFuuka/blob/bf4224eed04637a4d0bd4411c2bf5f9945dfec0b/src/Model/Search.php#L363
      value = $.getOwn({
        'Developer': 'dev',
        'Verified':  'ver'
      }, value) || value.toLowerCase();
    } else if (type === 'image') {
      value = value.replace(/[+/=]/g, c => ({'+': '-', '/': '_', '=': ''})[c]);
    }
    value = encodeURIComponent(value);
    let path: string;
    if (archive.software === 'foolfuuka') {
      path = `${boardID}/search/${type}/${value}/`;
    } else if (type === 'image') {
      path = `${boardID}/image/${value}`;
    } else {
      path = `${boardID}/?task=search2&search_${type}=${value}`;
    }
    return `${Redirect.protocol(archive)}${archive.domain}/${path}`;
  },

  report(boardID) {
    const urls: [string, string][] = [];
    for (const archive of Conf['archives']) {
      const {software, https, reports, boards, name, domain} = archive;
      if ((software === 'foolfuuka') && https && reports && Array.isArray(boards) && boards.includes(boardID)) {
        urls.push([name, `https://${domain}/_/api/chan/offsite_report/`]);
      }
    }
    return urls;
  },

  securityCheck(url) {
    return url.startsWith('https://') ||
    (location.protocol === 'http:') ||
    Conf['Exempt Archives from Encryption'];
  },

  navigate(dest, data, alternative) {
    if (!Redirect.data) { Redirect.init(); }
    const url = Redirect.to(dest, data);
    if (url && (
      Redirect.securityCheck(url) ||
      confirm(`Redirect to ${url}?\n\nYour connection will not be encrypted.`)
    )) {
      return location.replace(url);
    } else if (alternative) {
      return location.replace(alternative);
    }
  }
};

export default Redirect;
