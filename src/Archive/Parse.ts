import Redirect from './Redirect';
import { isEscaped } from '../globals/jsx';
import Callbacks from '../classes/Callbacks';
import ImageHost from '../Images/ImageHost';
import Board from '../classes/Board';
import ArchiveTags from './ArchiveTags';
import Post, { type File } from '../classes/Post';
import Thread from '../classes/Thread';
import { E, g } from '../globals/globals';
import { dict } from '../platform/helpers';
import $ from '../platform/$';

// Got this from just putting a response in a json to ts converter, it might be incomplete.
export interface RawArchivePost {
  doc_id: string;
  num: string;
  subnum: string;
  thread_num: string;
  op: string;
  timestamp: number;
  timestamp_expired: string;
  capcode: string;
  email: any;
  name: string;
  trip: any;
  title: any;
  comment: string;
  poster_hash: any;
  poster_country?: string;
  troll_country_code?: string;
  troll_country_name?: string;
  sticky: string;
  locked: string;
  deleted: string;
  nreplies: any;
  nimages: any;
  fourchan_date: string;
  comment_sanitized: string;
  comment_processed: string;
  formatted: boolean;
  title_processed: any;
  name_processed: string;
  email_processed: any;
  trip_processed: any;
  poster_hash_processed: any;
  poster_country_name: boolean;
  poster_country_name_processed: string;
  extra_data: any[];
  exif?: string;
  media: {
    media_id: string;
    spoiler: string;
    preview_orig: string;
    media: string;
    preview_op: any;
    preview_reply: string;
    preview_w: string;
    preview_h: string;
    media_filename: string;
    media_w: string;
    media_h: string;
    media_size: string;
    media_hash: string;
    media_orig: string;
    exif: any;
    total: string;
    banned: string;
    media_status: string;
    safe_media_hash: string;
    remote_media_link: string;
    media_link: string;
    thumb_link: string;
    media_filename_processed: string;
  };
  board: {
    name: string;
    shortname: string;
  };
}


function parseComment(commentRaw: string) {
  let comment = (commentRaw || '').split(/(\n|\[\/?(?:b|spoiler|code|moot|banned|fortune(?: color="#\w+")?|i|red|green|blue)\])/);
  const parsed = comment.map((text, i) => {
    if ((i % 2) === 1) {
      const tag = ArchiveTags[text.includes(' ') ? text.split(' ')[0] + ']' : text];
      return (typeof tag === 'function') ? tag(text) : tag;
    }
    const greentext = text.startsWith('>');
    const processedText = text
      .replace(/(\[\/?[a-z]+):lit(\])/g, '$1$2')
      .split(/(>>(?:>\/[a-z\d]+\/)?\d+)/g)
      .map((text2, j) => ((j % 2) ? `<span class="deadlink">${E(text2)}</span>` : E(text2)))
      .join('');
    return { innerHTML: (greentext ? `<span class="quote">${processedText}</span>` : processedText) };
  });
  return { innerHTML: E.cat(parsed as any), [isEscaped]: true } as any;
}

function getCapcode(capcode: string): string | undefined {
  switch (capcode) {
    // https://github.com/pleebe/FoolFuuka/blob/bf4224eed04637a4d0bd4411c2bf5f9945dfec0b/assets/themes/foolz/foolfuuka-theme-fuuka/src/Partial/Board.php#L77
    case 'M': return 'Mod';
    case 'A': return 'Admin';
    case 'D': return 'Developer';
    case 'V': return 'Verified';
    case 'F': return 'Founder';
    case 'G': return 'Manager';
  }
}

function parseFile(media: RawArchivePost['media'], boardID: string, url: string): File | null {
  if (!media?.media_filename) {
    return null;
  }
  let { thumb_link } = media;
  // Fix URLs missing origin
  if (thumb_link?.startsWith('/')) {
    thumb_link = url.split('/', 3).join('/') + thumb_link;
  }
  if (!Redirect.securityCheck(thumb_link)) {
    thumb_link = '';
  }
  let media_link = Redirect.to('file', { boardID, filename: media.media_orig } as any);
  if (!Redirect.securityCheck(media_link)) {
    media_link = '';
  }

  const fileUrl = media_link ||
    (boardID === 'f' ?
      `${location.protocol}//${ImageHost.flashHost()}/${boardID}/${encodeURIComponent(E(media.media_filename))}`
      :
      `${location.protocol}//${ImageHost.host()}/${boardID}/${media.media_orig}`);

  const file: File = {
    name: media.media_filename,
    url: fileUrl,
    height: media.media_h,
    width: media.media_w,
    MD5: media.media_hash,
    size: $.bytesToString(media.media_size),
    thumbURL: thumb_link || `${location.protocol}//${ImageHost.thumbHost()}/${boardID}/${media.preview_orig}`,
    theight: media.preview_h,
    twidth: media.preview_w,
    isSpoiler: media.spoiler === '1'
  } as File;

  if (!file.url.endsWith('.pdf')) {
    file.dimensions = `${file.width}x${file.height}`;
  }
  if (boardID === 'f' && media.exif) {
    file.tag = JSON.parse(media.exif).Tag;
  }

  return file;
}

export const parseArchivePost = (data: RawArchivePost, url: string) => {
  if (!data || typeof data !== 'object') {
    throw new TypeError("Invalid post data from archive");
  }
  const postNum = Number.parseInt(data.num, 10);
  const threadNum = Number.parseInt(data.thread_num, 10);
  if (Number.isNaN(postNum) || Number.isNaN(threadNum) || postNum <= 0 || threadNum <= 0) {
    throw new Error("Invalid post or thread ID from archive");
  }
  const boardShortName = data.board?.shortname;
  if (typeof boardShortName !== 'string' || !boardShortName) {
    throw new Error("Invalid board identifier from archive");
  }

  const comment = parseComment(data.comment);

  const o = {
    ID: data.num,
    threadID: data.thread_num,
    boardID: data.board.shortname,
    isReply: data.num !== data.thread_num,
    fileDeleted: false,
    info: {
      subject: data.title,
      email: data.email,
      name: data.name || '',
      tripcode: data.trip,
      capcode: getCapcode(data.capcode),
      uniqueID: data.poster_hash,
      flagCode: data.poster_country,
      flagCodeTroll: data.troll_country_code,
      flag: data.poster_country_name || data.troll_country_name,
      dateUTC: data.timestamp,
      dateText: data.fourchan_date,
      commentHTML: comment,
    },
    file: null as File,
    extra: null as any,
  };

  if (o.info.capcode) {
    delete o.info.uniqueID;
  }

  if (data.media && !!+data.media.banned) {
    o.fileDeleted = true;
  } else {
    o.file = parseFile(data.media, o.boardID, url);
  }

  o.extra = dict();

  const board = g.boards[o.boardID] || new Board(o.boardID);
  const thread = g.threads.get(`${o.boardID}.${o.threadID}`) || new Thread(o.threadID, board);
  const post = new Post(g.SITE.Build.post(o), thread, board);
  post.resurrect();
  if (data.deleted === '1') {
    post.markAsFromArchive();
  }
  if (post.file) {
    post.file.thumbURL = o.file?.thumbURL;
  }
  Callbacks.Post.execute(post);
  return post;
};

export default parseArchivePost;