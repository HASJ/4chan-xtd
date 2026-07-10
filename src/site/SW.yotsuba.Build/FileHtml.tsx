import h, { EscapedHtml, isEscaped } from "../../globals/jsx";

function renderFBoardFile(file, ID, fileURL): EscapedHtml {
  return (
    <div class="fileInfo" data-md5={file.MD5}><span class="fileText" id={`fT${ID}`}>
      {'File: '}
      <a data-width={file.width} data-height={file.height} href={fileURL} target="_blank">{file.name}</a>
      -({file.size}, {file.dimensions}{file.tag ? ', ' + file.tag : ''})
    </span></div>
  );
}

function renderFileText(file, ID, fileURL, shortFilename): EscapedHtml {
  const titleAttr = (file.name === shortFilename || file.isSpoiler) ? null : file.name;
  const label = file.isSpoiler ? 'Spoiler Image' : shortFilename;
  return (
    <div class="fileText" id={`fT${ID}`} title={file.isSpoiler ? file.name : null}>
      {'File: '}
      <a title={titleAttr} href={fileURL} target="_blank">{label}</a>
      {` (${file.size}, ${file.dimensions || "PDF"})`}
    </div>
  );
}

function renderFileThumb(file, fileURL, fileThumb): EscapedHtml {
  const dimStyle = file.isSpoiler ?
    'height: 100px; width: 100px;' :
    `height: ${file.theight}px; width: ${file.twidth}px;`;
  return (
    <a
      class={`fileThumb${file.isSpoiler ? ' imgspoiler' : ''}`}
      href={fileURL} target="_blank"
      data-m={file.hasDownscale ? '' : null}
    >
      <img
        src={fileThumb}
        alt={file.size}
        data-md5={file.MD5}
        style={dimStyle}
        loading="lazy"
      />
    </a>
  );
}

export default function generateFileHtml({o, fileInfo, assets}): EscapedHtml {
  const {file, ID, boardID} = o;
  const {fileURL, shortFilename, fileThumb} = fileInfo;
  const {staticPath, gifIcon} = assets;

  if (file) {
    const fileContent: (EscapedHtml | string)[] = boardID === "f" ?
      [renderFBoardFile(file, ID, fileURL)] :
      [renderFileText(file, ID, fileURL, shortFilename), renderFileThumb(file, fileURL, fileThumb)];
    return <div class="file" id={`f${ID}`}>{...fileContent}</div>;
  }
  if (o.fileDeleted) {
    return <div class="file" id={`f${ID}`}>
      <span class="fileThumb">
        <img src={`${staticPath}filedeleted-res${gifIcon}`} alt="File deleted." class="fileDeletedRes retina" />
      </span>
    </div>;
  }
  return { innerHTML: '', [isEscaped]: true };
}
