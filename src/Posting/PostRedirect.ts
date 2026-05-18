import { d } from "../globals/globals";
import $ from "../platform/$";

interface QRPostSuccessfulEvent extends CustomEvent {
  detail: {
    redirect?: string;
  };
}

const PostRedirect = {
  event: null as QRPostSuccessfulEvent | null,
  delays: 0,

  init() {
    $.on(d, 'QRPostSuccessful', (e: Event) => {
      const customEvent = e as QRPostSuccessfulEvent;
      if (!customEvent.detail.redirect) { return; }
      PostRedirect.event = customEvent;
      PostRedirect.delays = 0;
      $.queueTask(() => {
        if ((customEvent === PostRedirect.event) && (PostRedirect.delays === 0)) {
          location.href = customEvent.detail.redirect!;
        }
      });
    });
  },

  delay(): (() => void) | null {
    if (!PostRedirect.event) { return null; }
    const e = PostRedirect.event;
    PostRedirect.delays++;
    return () => {
      if (e !== PostRedirect.event) { return; }
      PostRedirect.delays--;
      if (PostRedirect.delays === 0) {
        location.href = e.detail.redirect!;
      }
    };
  }
};
export default PostRedirect;
