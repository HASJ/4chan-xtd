import { g, Conf, d } from "../globals/globals";
import UIState from "../globals/UIState";
import Icon from "../Icons/icon";
import $ from "../platform/$";
import CrossOrigin from "../platform/CrossOrigin";
import Notice from "../classes/Notice";

const DownloadAll = {
  queue: [] as { file: any, folderName: string, seqName: string, threadID: number }[],
  isDownloading: false,

  getDownloadedSet(threadID: number): Set<string> {
    try {
      const stored = localStorage.getItem(`4chan-xtd-downloaded-${threadID}`) || localStorage.getItem(`4chan-xt-downloaded-${threadID}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch (error) {
      console.warn('Unable to read download history.', error);
    }
    return new Set();
  },

  addDownloadedUrl(threadID: number, url: string) {
    const downloadedSet = DownloadAll.getDownloadedSet(threadID);
    downloadedSet.add(url);
    try {
      localStorage.setItem(`4chan-xtd-downloaded-${threadID}`, JSON.stringify(Array.from(downloadedSet)));
    } catch (error) {
      console.warn('Unable to save download history.', error);
    }
  },

  init() {
    const view = g.VIEW;
    if (!view || !['index', 'thread'].includes(view) || !Conf['Download All Media']) return;

    if (view === 'thread') {
      const el = $.el('a', {
        href: 'javascript:;',
        title: 'Download All Media',
        className: 'download-all-link'
      });
      Icon.set(el, 'download', 'Download All Media');
      $.on(el, 'click', (e) => {
        e.preventDefault();
        const threads = g.threads;
        const board = g.BOARD;
        const threadID = g.THREADID;
        if (!threads || !board || threadID == null) return;
        const thread = threads.get(`${board.ID}.${threadID}`);
        if (thread) DownloadAll.queueThread(thread);
      });
      UIState.addShortcut('download-all', el, 526);
    }
  },

  queueThread(thread: any) {
    const OP = thread.OP;
    const excerpt = (OP.info.subject?.trim() || OP.commentDisplay().replace(/\n+/g, ' ').trim() || '')
      .replace(/[\\/:*?"<>|]/g, '-')
      .slice(0, 50)
      .trim();
    const folderName = excerpt ? `${thread.ID} - ${excerpt}` : `${thread.ID}`;
    const downloadedSet = DownloadAll.getDownloadedSet(thread.ID);
    
    let addedCount = 0;
    let fileIndex = 1;
    thread.posts.forEach((post: any) => {
      if (post.isClone || post.isHidden) return;
      if (post.files) {
        post.files.forEach((file: any) => {
          if (!file.isDead && file.url) {
            // Check if already in queue or downloaded
            const inQueue = DownloadAll.queue.some(item => item.file.url === file.url);
            if (!inQueue && !downloadedSet.has(file.url)) {
              const paddedIndex = String(fileIndex).padStart(3, '0');
              const seqName = `${paddedIndex} - ${file.name}`;
              DownloadAll.queue.push({ file, folderName, seqName, threadID: thread.ID });
              addedCount++;
            }
            // Increment fileIndex regardless of whether it's in the queue to maintain accurate ordering relative to the thread
            fileIndex++;
          }
        });
      }
    });

    if (addedCount === 0) {
      const _notice = new Notice('info', 'No new media to download.', 3);
    } else {
      const _notice = new Notice('info', `Added ${addedCount} files to download queue.`, 3);
      DownloadAll.processQueue();
    }
  },

  processQueue() {
    if (DownloadAll.isDownloading || DownloadAll.queue.length === 0) return;
    DownloadAll.isDownloading = true;

    while (DownloadAll.queue.length > 0) {
      const item = DownloadAll.queue.shift();
      if (!item) break;

      const { file, folderName, seqName, threadID } = item;
      
      DownloadAll.addDownloadedUrl(threadID, file.url);

      const gmDownload = (globalThis as any).GM_download;
      const GM_download_fn = gmDownload ?? (globalThis as any).GM?.download;

      if (GM_download_fn) {
        GM_download_fn({
          url: file.url,
          name: `${folderName}/${seqName}`,
          saveAs: false,
          onload: () => {},
          onerror: () => {
            const _notice = new Notice('warning', `Could not download ${file.url}`, 5);
          }
        });
      } else {
        // Use fallback async download (breaks while loop)
        CrossOrigin.file(file.url, (blob) => {
          if (blob) {
            const a = $.el('a', {
              href: URL.createObjectURL(blob),
              download: `${folderName}/${seqName}`,
              hidden: true
            });
            $.add(d.body, a);
            a.click();
            setTimeout(() => {
              URL.revokeObjectURL(a.href);
              $.rm(a);
              DownloadAll.isDownloading = false;
              DownloadAll.processQueue();
            }, 500); // 500ms stagger
          } else {
            const _notice = new Notice('warning', `Could not download ${file.url}`, 5);
            DownloadAll.isDownloading = false;
            DownloadAll.processQueue();
          }
        });
        return; // Break the synchronous loop since we are waiting on async
      }
    }
    
    // We only reach here if GM_download processed everything synchronously
    DownloadAll.isDownloading = false;
  }
};

export default DownloadAll;
