import Redirect from "../Archive/Redirect";
import $ from "../platform/$";
import ReportPage from './Report/ArchiveReport.html';
import CSS from "../css/CSS";
import Captcha from "../Posting/Captcha";
import { Conf, d, doc, g } from "../globals/globals";

interface ReportType {
  postID?: number;
  init(): void;
  ready(): void;
  fit(selector: string): void;
  archive(): void;
  archiveSubmit(urls: [string, string][], reason: string, cb: (results: [string, any][]) => void): void;
  archiveResults(results: [string, any][]): void;
}

const Report: ReportType = {
  init() {
    let match;
    if (!(match = location.search.match(/\bno=(\d+)/))) { return; }
    Captcha.replace.init();
    this.postID = +match[1];
    $.ready(this.ready);
  },

  ready() {
    $.addStyle(CSS.report);

    if (Conf['Archive Report']) { Report.archive(); }

    new MutationObserver(function() {
      Report.fit('iframe[src^="https://www.google.com/recaptcha/api2/frame"]');
      Report.fit('body');
    }).observe(d.body, {
      childList:  true,
      attributes: true,
      subtree:    true
    });
    Report.fit('body');
  },

  fit(selector) {
    let el;
    if (!((el = $(selector, doc) as HTMLElement) && (getComputedStyle(el).visibility !== 'hidden'))) { return; }
    const dy = (el.getBoundingClientRect().bottom - doc.clientHeight) + 8;
    if (dy > 0) { window.resizeBy(0, dy); }
  },

  archive() {
    let match, urls: [string, string][];
    if (!(urls = Redirect.report(g.BOARD!.ID)).length) { return; }

    const form    = $('form') as HTMLFormElement;
    const types   = $.id('reportTypes');
    const message = $('h3');

    const fieldset = $.el('fieldset', {
      id: 'archive-report',
      hidden: true
    }) as HTMLFieldSetElement;
    $.extend(fieldset, { innerHTML: ReportPage });
    const enabled = $('#archive-report-enabled', fieldset) as HTMLInputElement;
    const reason  = $('#archive-report-reason',  fieldset) as HTMLTextAreaElement;
    const submit  = $('#archive-report-submit',  fieldset) as HTMLButtonElement;

    $.on(enabled, 'change', function(this: HTMLInputElement) {
      reason.disabled = !this.checked;
    });

    if (form && types) {
      fieldset.hidden = !($('[value="31"]', types) as HTMLInputElement).checked;
      $.on(types, 'change', function(e: any) {
        fieldset.hidden = (e.target.value !== '31');
        Report.fit('body');
      });
      $.after(types, fieldset);
      Report.fit('body');
      $.one(form, 'submit', function(this: HTMLFormElement, e: Event) {
        if (!fieldset.hidden && enabled.checked) {
          e.preventDefault();
          Report.archiveSubmit(urls, reason.value, results => {
            this.action = '#archiveresults=' + encodeURIComponent(JSON.stringify(results));
            this.submit();
          });
        }
      });
    } else if (message) {
      fieldset.hidden = /Report submitted!/.test(message.textContent || '');
      $.on(enabled, 'change', function(this: HTMLInputElement) {
        submit.hidden = !this.checked;
      });
      $.after(message, fieldset);
      $.on(submit, 'click', () => Report.archiveSubmit(urls, reason.value, Report.archiveResults));
    }

    if (match = location.hash.match(/^#archiveresults=(.*)$/)) {
      try {
        Report.archiveResults(JSON.parse(decodeURIComponent(match[1])));
      } catch (error) {}
    }
  },

  archiveSubmit(urls, reason, cb) {
    const form = $.formData({
      board:  g.BOARD!.ID,
      num:    Report.postID,
      reason
    });
    const results: [string, any][] = [];
    for (const [name, url] of urls) {
      (function(name, url) {
        $.ajax(url, {
          onloadend(this: XMLHttpRequest) {
            results.push([name, this.response || {error: ''}]);
            if (results.length === urls.length) {
              cb(results);
            }
          },
          form
        });
      })(name, url);
    }
  },

  archiveResults(results) {
    const fieldset = $.id('archive-report');
    for (const [name, response] of results) {
      const line = $.el('h3', {className: 'archive-report-response'}) as HTMLHeadingElement;
      if (response && 'success' in response) {
        $.addClass(line, 'archive-report-success');
        line.textContent = `${name}: ${response.success}`;
      } else {
        $.addClass(line, 'archive-report-error');
        line.textContent = `${name}: ${response.error || 'Error reporting post.'}`;
      }
      if (fieldset) {
        $.before(fieldset, line);
      } else {
        $.add(d.body, line);
      }
    }
  }
};

export default Report;
