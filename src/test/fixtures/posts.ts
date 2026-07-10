export const yotsubaPost = () => ({
  no: 101,
  resto: 100,
  sub: 'Fixture subject',
  email: '',
  name: 'Fixture anon',
  trip: null,
  since4pass: null,
  id: 'ABC123',
  country: 'US',
  board_flag: null,
  country_name: 'United States',
  flag_name: null,
  time: 1_700_000_000,
  now: '11/14/23(Tue)22:13:20',
  com: '<span class="quote">&gt;fixture quote</span><br>reply',
  sticky: 0,
  closed: 0,
  archived: 0,
  replies: 2,
  images: 1,
  filedeleted: 0,
  ext: '.jpg',
  filename: 'fixture-image',
  tim: 1_700_000_000_001,
  h: 600,
  w: 800,
  md5: 'fixture-md5',
  fsize: 1024,
  tn_h: 75,
  tn_w: 100,
  spoiler: 0,
  tag: null,
  m_img: 0,
});

export const tinyboardPost = () => ({
  ...yotsubaPost(),
  no: 201,
  resto: 200,
  com: '&gt;tinyboard fixture<br>reply',
  extra_files: [],
});

export const yotsubaThread = () => ({
  posts: [
    {
      ...yotsubaPost(),
      no: 100,
      resto: 0,
      sub: 'Fixture OP',
      com: 'OP >>101',
      replies: 1,
      images: 1,
    },
    yotsubaPost(),
  ],
});

export const tinyboardThread = () => ({
  posts: [
    {
      ...tinyboardPost(),
      no: 200,
      resto: 0,
      com: 'Tinyboard OP >>201',
    },
    tinyboardPost(),
  ],
});

export const archivePost = () => ({
  num: '301',
  thread_num: '300',
  capcode: '',
  email: '',
  name: 'Archive fixture',
  trip: null,
  title: 'Archived subject',
  comment: '>archived quote\n>>302',
  poster_hash: 'ARCHIVE',
  poster_country: 'US',
  poster_country_name: 'United States',
  timestamp: 1_700_000_100,
  fourchan_date: '11/14/23(Tue)22:15:00',
  deleted: '1',
  media: undefined,
  board: { shortname: 'g' },
});

export const threadFixture = () => {
  const thread = document.createElement('section');
  thread.innerHTML = '<article class="post"><a class="quotelink">&gt;&gt;2</a></article>';
  return thread;
};
