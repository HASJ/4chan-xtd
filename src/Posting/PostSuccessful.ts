import DataBoard from "../classes/DataBoard";
import { Conf, d, g } from "../globals/globals";
import $ from "../platform/$";

const PostSuccessful = {
  init() {
    if (!Conf['Remember Your Posts']) { return; }
    $.ready(PostSuccessful.ready);
  },

  ready() {
    if (d.title !== 'Post successful!') { return; }

    const h1 = $('h1');
    if (!h1 || !h1.nextSibling) { return; }
    const textContent = h1.nextSibling.textContent;
    if (!textContent) { return; }
    const match = textContent.match(/thread:(\d+),no:(\d+)/);
    if (!match) { return; }
    const postID = +match[2];
    const threadID = +match[1] || postID;

    const db = new DataBoard('yourPosts');
    db.set({
      boardID: g.BOARD.ID,
      threadID,
      postID,
      val: true
    });
  }
};
export default PostSuccessful;
