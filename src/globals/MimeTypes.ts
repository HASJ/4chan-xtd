export const mimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/vnd.adobe.flash.movie',
  'application/x-shockwave-flash',
  'video/webm',
  'video/mp4'
];

export const validExtension = /\.(jpe?g|png|gif|pdf|swf|webm|mp4)$/i;

export const typeFromExtension: Record<string, string> = {
  'jpg':  'image/jpeg',
  'jpeg': 'image/jpeg',
  'png':  'image/png',
  'gif':  'image/gif',
  'pdf':  'application/pdf',
  'swf':  'application/vnd.adobe.flash.movie',
  'webm': 'video/webm',
  'mp4': 'video/mp4'
};

export const extensionFromType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/vnd.adobe.flash.movie': 'swf',
  'application/x-shockwave-flash': 'swf',
  'video/webm': 'webm',
  'video/mp4': 'mp4'
};
