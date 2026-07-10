import { g } from "../../globals/globals";
import h, { EscapedHtml } from "../../globals/jsx";

function buildNameHtml(info, capcodeInfo): (EscapedHtml | string)[] {
  const {tripcode, pass, capcode} = info;
  const {capcodeLC, capcodePlural} = capcodeInfo;
  const nameHtml: (EscapedHtml | string)[] = [<span key="name" class={`name${capcode ? ' capcode' : ''}`}>{info.name}</span>];
  if (tripcode) { nameHtml.push(' ', <span key="tripcode" class="postertrip">{tripcode}</span>); }
  if (pass) { nameHtml.push(' ', <span key="pass" title={`Pass user since ${pass}`} class="n-pu"></span>); }
  if (capcode) {
    nameHtml.push(
      ' ',
      <strong key="capcode" class={`capcode hand id_${capcodeLC}`} title={`Highlight posts by ${capcodePlural}`}>## {capcode}</strong>
    );
  }
  return nameHtml;
}

function buildNameBlockContent(o, info, capcodeInfo, assets): (EscapedHtml | string)[] {
  const {email, uniqueID, capcode, flagCode, flagCodeTroll, flag} = info;
  const {capcodeLC, capcodeDescription} = capcodeInfo;
  const {staticPath, gifIcon} = assets;
  const nameHtml = buildNameHtml(info, capcodeInfo);

  const nameBlockContent: (EscapedHtml | string)[] = email ?
    [' ', <a key="email" href={`mailto:${email}`} aria-label={info.name} class="useremail">{...nameHtml}</a>] :
    nameHtml;

  if (!(o.boardID === "f" && !o.isReply || capcodeDescription)) { nameBlockContent.push(' '); }

  if (capcodeDescription) {
    nameBlockContent.push(
      <img
        key="identity"
        src={`${staticPath}${capcodeLC}icon${gifIcon}`}
        alt={`${capcode} Icon`}
        title={`This user is ${capcodeDescription}.`}
        class="identityIcon retina"
      />
    );
  }
  if (uniqueID && !capcode) {
    nameBlockContent.push(
      <span key="uniqueID" class={`posteruid id_${uniqueID}`}>
        (ID: <span class="hand" title="Highlight posts by this ID">{uniqueID}</span>)
      </span>
    );
  }
  if (flagCode) { nameBlockContent.push(' ', <span key="flag" title={flag} class={`flag flag-${flagCode.toLowerCase()}`} />); }
  if (flagCodeTroll) { nameBlockContent.push(' ', <span key="troll" title={flag} class={`bfl bfl-${flagCodeTroll.toLowerCase()}`} />); }

  return nameBlockContent;
}

function buildStickyIcon(boardID, src): EscapedHtml {
  return boardID === "f" ?
    <img key="sticky" src={src} alt="Sticky" title="Sticky" style="height: 18px; width: 18px;" /> :
    <img key="sticky" src={src} alt="Sticky" title="Sticky" class="stickyIcon retina" />;
}

function buildClosedIcon(boardID, src): EscapedHtml {
  return boardID === "f" ?
    <img key="closed" src={src} alt="Closed" title="Closed" style="height: 18px; width: 18px;" /> :
    <img key="closed" src={src} alt="Closed" title="Closed" class="closedIcon retina" />;
}

function buildPostNumContent(o, links, assets): (EscapedHtml | string)[] {
  const {boardID, threadID, ID} = o;
  const {postLink, quoteLink} = links;
  const {staticPath, gifIcon} = assets;

  const postNumContent: (EscapedHtml | string)[] = [
    <a key="post" href={postLink} title="Link to this post">No.</a>,
    <a key="quote" href={quoteLink} title="Reply to this post">{ID}</a>,
  ];

  if (o.isSticky) {
    postNumContent.push(' ', buildStickyIcon(boardID, `${staticPath}sticky${gifIcon}`));
  }
  if (o.isClosed && !o.isArchived) {
    postNumContent.push(' ', buildClosedIcon(boardID, `${staticPath}closed${gifIcon}`));
  }
  if (o.isArchived) {
    postNumContent.push(
      ' ',
      <img key="archived" src={`${staticPath}archived${gifIcon}`} alt="Archived" title="Archived" class="archivedIcon retina" />
    );
  }
  if (!o.isReply && g.VIEW === "index") {
    postNumContent.push(
      '   ', //   is nbsp
      <span key="reply"><a href={`/${boardID}/thread/${threadID}`} class="replylink" aria-label="Reply to this thread">Reply</a></span>,
    );
  }
  return postNumContent;
}

export default function generatePostInfoHtml({o, capcodeInfo, assets, links}): EscapedHtml {
  const {ID, boardID} = o;
  const {subject} = o.info;
  const capcodeClass = o.info.capcode ? ` capcode${o.info.capcode}` : '';

  const nameBlockContent = buildNameBlockContent(o, o.info, capcodeInfo, assets);
  const postNumContent = buildPostNumContent(o, links, assets);

  return <div class="postInfo desktop" id={`pi${ID}`}>
    <input type="checkbox" name={ID} value="delete" />
    {' '}
    {...((!o.isReply || boardID === "f" || subject) ? [<span key="subject" class="subject">{subject}</span>, ' '] : [])}
    <span class={`nameBlock${capcodeClass}`}>
      {...nameBlockContent}
    </span>
    {' '}
    <span class="dateTime" data-utc={o.info.dateUTC}>{o.info.dateText}</span>
    {' '}
    <span class={`postNum${!(boardID === " f" && !o.isReply) ? ' desktop' : ''}`} >
      {...postNumContent}
    </span>
  </div>;
}
