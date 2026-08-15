import $ from '../../platform/$';
import Icon from '../../Icons/icon';
import { processLinks } from '../LinkifyActions';
import h, { type EscapedHtml, hFragment } from '../../globals/jsx';
import Time from '../../Miscellaneous/Time';
import CrossOrigin from '../../platform/CrossOrigin';
import { Conf } from '../../globals/globals';

function renderMedia(tweet): EscapedHtml[] {
  const mediaList = tweet.media?.all ?? [
    ...(tweet.media?.photos ?? []),
    ...(tweet.media?.videos ?? []),
  ];
  return mediaList.map(media => {
    switch (media.type) {
      case 'photo':
      case 'image':
        return <div class="fxt-media">
          <a href={media.url} target="_blank" referrerpolicy="no-referrer">
            <img referrerpolicy="no-referrer" src={media.url} alt={media.altText || media.alt_text || ''} width={media.width} height={media.height} />
          </a>
        </div>;
      case 'video':
      case 'gif':
      case 'animated_gif': {
        const isGif = media.type === 'gif' || media.type === 'animated_gif';
        const videoAttributes = isGif
          ? 'autoplay loop muted playsinline preload="auto"'
          : 'controls preload="metadata"';
        const posterAttr = media.thumbnail_url ? ` poster="${media.thumbnail_url.replace(/"/g, '&quot;')}"` : '';
        const srcEsc = media.url.replace(/"/g, '&quot;');
        const typeEsc = (media.format || 'video/mp4').replace(/"/g, '&quot;');
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000;display:flex;align-items:center;justify-content:center;}video{width:100%;height:100%;object-fit:contain;}</style></head><body><video ${videoAttributes}${posterAttr} src="${srcEsc}"><source src="${srcEsc}" type="${typeEsc}"></video></body></html>`;
        const blobUrl = (typeof URL !== 'undefined' && URL.createObjectURL)
          ? URL.createObjectURL(new Blob([html], { type: 'text/html' }))
          : `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

        return <div class="fxt-media fxt-media_video">
          <iframe
            class="fxt-video-frame"
            src={blobUrl}
            title={media.altText || media.alt_text || (isGif ? 'Twitter GIF' : 'Twitter video')}
            allow="autoplay; fullscreen"
            allowfullscreen="true"
            style="border: none; width: 100%; height: 100%;"
          />
        </div>;
      }
      default:
        console.warn(`FxTwitter media type ${media.type} not recognized`);
        return null;
    }
  }).filter(Boolean) as EscapedHtml[] || [];
}

function renderDate(tweet): string {
  return Time.format(new Date(tweet.created_at));
}

export default function EmbedFxTwitter(a: HTMLAnchorElement): HTMLElement {
  const el = $.el('div', { innerHTML: '<blockquote class="twitter-tweet">Loading&hellip;</blockquote>' });
  const shouldTranslate = Conf.fxtLang ? `/${Conf.fxtLang}` : '';
  const maxReplies = +Conf.fxtMaxReplies;

  CrossOrigin.cachePromise(`${Conf.fxtUrl}/${a.dataset.uid}${shouldTranslate}`).then(async req => {
    if (req.status === 404) {
      el.textContent = '404: tweet not found';
      return;
    }

    const { tweet } = req.response;

    // console.log(tweet);

    function renderPoll(tweet): EscapedHtml {
      let maxPercentage = 0;
      let maxChoiceIndex = -1;
      tweet.poll.choices.forEach((choice, index) => {
        if (choice.percentage > maxPercentage) {
          maxPercentage = choice.percentage;
          maxChoiceIndex = index;
        }
      });

      return <div class="fxt-poll">
        {...tweet.poll.choices.map((choice, index) =>
          <div key={choice.label} class={`fxt-choice ${index === maxChoiceIndex ? 'highlight' : ''}`}>
            <span class="fxt-choice_label">{choice.label}</span>
            <span class="fxt-choice_percentage">{choice.percentage}%</span>
            <div class="fxt-bar" style={`width: ${choice.percentage}%`} />
          </div>
        )}
        <div class="total-votes">{tweet.poll.total_votes.toLocaleString()} votes</div>
      </div>;
    }

    function renderTranslation(tweet): EscapedHtml | '' {
      if (!tweet?.translation?.target_lang || tweet?.translation?.source_lang === tweet?.translation?.target_lang) {
        return '';
      }
      return <>
        <hr />
        <p>Translated from {tweet.translation.source_lang_en}</p>
        <p lang={tweet.translation.target_lang}>{...renderText(tweet.translation.text)}</p>
      </>
    }

    function renderMeta(tweet): EscapedHtml {
      const avatarUrl = tweet.author?.avatar_url || tweet.author?.avatar_url_https || tweet.author?.avatar || tweet.author?.profile_image_url_https;
      const profileUrl = tweet.author?.url || (tweet.author?.screen_name ? `https://x.com/${tweet.author.screen_name}` : '#');
      return <div class="fxt-meta">
        <a class="fxt-meta_profile" href={profileUrl} title={tweet.author?.description} target="_blank"
          referrerpolicy="no-referrer">
          <div class="fxt-meta_avatar">
            {avatarUrl ? <img referrerpolicy="no-referrer" src={avatarUrl} alt={tweet.author?.name || ''} /> : ''}
          </div>
          <div class="fxt-meta_author">
            <span class="fxt-meta_author_username">{tweet.author?.name || ''}</span>
            <span class="fxt-meta_author_account">@{tweet.author?.screen_name || ''}</span>
          </div>
        </a>
        <a href={tweet.url} title="Open tweet in a new tab" target="_blank" referrerpolicy="no-referrer">
          {Icon.raw('link')}
        </a>
      </div>;
    }

    function renderText(inputText: string): (EscapedHtml | string)[] {
      const result: (EscapedHtml | string)[] = [];
      let endLast = 0;

      for (const match of inputText.matchAll(/[@#]\w+/g)) {
        result.push(
          inputText.slice(endLast, match.index),
          <a href={`https://x.com/${match[0].startsWith('#') ? 'hashtag/' : ''}${match[0].slice(1)}`} target="_blank"
            referrerpolicy="no-referrer">
            {match[0]}
          </a>
        );
        endLast = match.index + match[0].length;
      }
      result.push(inputText.slice(endLast));
      return result;
    }

    function renderCommunityNote(note) {
      const content: (string | EscapedHtml)[] = [];
      let i = 0;
      if (note.entities) {
        for (const entity of note.entities) {
          if (entity.ref.url) {
            if (i < entity.fromIndex) content.push(...renderText(note.text.slice(i, entity.fromIndex)));
            content.push(<a href={entity.ref.url} target="_blank" referrerpolicy="no-referrer">
              {note.text.slice(entity.fromIndex, entity.toIndex)}
            </a>)
            i = entity.toIndex;
          }
        }
      }
      if (i < note.text.length - 1) content.push(...renderText(note.text.slice(i)));

      return <div class="fxt-community_note">
        <div class="fxt-community_note-header">Community Note</div>
        <div class="fxt-community_note-text">{...content}</div>
      </div>;
    }

    async function renderQuote(quote): Promise<EscapedHtml> {
      return <div class="fxt-quote_container">
        {await renderTweet(quote, 'quote')}
      </div>
    }

    async function renderReplies(tweet) {
      const replies: EscapedHtml[] = [];
      let depth = 0;
      while (tweet.replying_to && tweet.replying_to_status && depth < maxReplies) {
        const replyUrl = `${Conf.fxtUrl}/${tweet.replying_to}/status/${tweet.replying_to_status}`;
        try {
          const replyData = await CrossOrigin.cachePromise(replyUrl);
          tweet = replyData.response.tweet;
          const replyHTML = await renderTweet(tweet, 'reply');
          replies.unshift(replyHTML);
          depth++;
        } catch (error) {
          console.error(`Error fetching/rendering reply tweet: ${(error as Error).message}`);
          console.log(tweet);
          const url = `${Conf.fxtUrl}/${tweet.replying_to}/status/${tweet.replying_to_status}`
          return <div class="fxt-reply_container">
            <article class="fxt-card fxt-tweet-reply">
              <div class="fxt-content warning">
                Failed trying to load <a href={url} target="_blank" referrerpolicy="no-referrer">{url}</a>
                <br />This tweet has probably been deleted or removed.
                <br />This also breaks the reply chain, so you may want to view the original tweet.
              </div>
            </article>
          </div>;
        }
      }

      return <div class="fxt-reply_container">{...replies}</div>;
    }

    async function renderTweet(tweet, type: 'quote' | 'reply' | 'original'): Promise<EscapedHtml> {
      const media = renderMedia(tweet);
      let mediaCountClass = '';
      if (media.length === 3) {
        mediaCountClass = 'fxt-media_contains_3';
      } else if (media.length > 1) {
        mediaCountClass = 'fxt-media-multiple';
      }
      const quote = (tweet?.quote) ? await renderQuote(tweet.quote) : ''

      const poll = (tweet?.poll) ? renderPoll(tweet) : '';
      const created_at = renderDate(tweet);

      const translation = (shouldTranslate) ? renderTranslation(tweet) : '';
      const note = tweet.community_note ? renderCommunityNote(tweet.community_note) : ''

      return <article class={`fxt-card fxt-tweet-${type}`}>
        {renderMeta(tweet)}
        <div class="fxt-content">
          <div class="fxt-text" lang={tweet.lang}>
            {...renderText(tweet.text)}
            {translation}
          </div>
          {(media.length || poll) &&
            <div class={`fxt-media_container ${mediaCountClass}`}>
              {poll}
              {...media}
            </div>
          }
          {note}
          {quote}
        </div>
        <div class="fxt-stats">
          <div class="fxt-stats_time">{created_at}</div>
          <div class="fxt-stats_meta">
            <span class="fxt-likes">
              {Icon.raw("comment")}
              {(tweet.replies ?? 0).toLocaleString()}
            </span>
            <span class="fxt-reposts">
              {Icon.raw("shuffle")}
              {(tweet.retweets ?? 0).toLocaleString()}
            </span>
            <span class="fxt-replies">
              {Icon.raw("heart")}
              {(tweet.likes ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </article>;
    }

    async function renderFullTweet(tweet) {
      const mainTweetHTML = await renderTweet(tweet, 'original');
      const repliesHTML = tweet.replying_to ? await renderReplies(tweet) : '';
      return <>{repliesHTML}{mainTweetHTML}</>;
    }

    const rendered = await renderFullTweet(tweet);
    el.innerHTML = rendered.innerHTML;
    for (const textEl of el.getElementsByClassName('fxt-text')) {
      processLinks(textEl);
    }

    el.style.resize = null;
    el.classList.add('fxt-card_container');
    el.style.height = null;
    el.style.width = null;
    el.style.overflow = null;
  });
  return el;
}