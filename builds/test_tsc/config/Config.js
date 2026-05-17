"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var user_css_1 = require("./user.css");
var banners_json_1 = require("./banners.json");
var package_json_1 = require("../../package.json");
var Config = {
    main: {
        'Miscellaneous': (_a = {
                'JSON Index': [
                    true,
                    'Replace the original board index with one supporting searching, sorting, infinite scrolling, and a catalog mode.'
                ]
            },
            _a["Use ".concat(package_json_1.default.name, " Catalog")] = [
                true,
                "Link to ".concat(package_json_1.default.name, "'s catalog instead of the native 4chan one."),
                1
            ],
            _a['Index Refresh Notifications'] = [
                false,
                'Show a notice at the top of the page when the index is refreshed.',
                1
            ],
            _a['Follow Cursor'] = [
                true,
                'Image Hover and Quote Preview move with the mouse cursor.'
            ],
            _a['Open Threads in New Tab'] = [
                false,
                "Make links to threads in the index / ".concat(package_json_1.default.name, " catalog open in a new tab.")
            ],
            _a['External Catalog'] = [
                false,
                'Link to external catalog instead of the internal one.'
            ],
            _a['Catalog Links'] = [
                false,
                'Add toggle link in header menu to turn Navigation links into links to each board\'s catalog.'
            ],
            _a['Announcement Hiding'] = [
                true,
                'Add button to hide 4chan announcements.'
            ],
            _a['Desktop Notifications'] = [
                true,
                "Enables desktop notifications across various ".concat(package_json_1.default.name, " features.")
            ],
            _a['404 Redirect'] = [
                true,
                'Redirect dead threads and images to the archives.'
            ],
            _a['Archive Report'] = [
                true,
                'Enable reporting posts to supported archives.'
            ],
            _a['Exempt Archives from Encryption'] = [
                false,
                'Permit loading content from, and warningless redirects to, HTTP-only archives from HTTPS pages.'
            ],
            _a['Keybinds'] = [
                true,
                'Bind actions to keyboard shortcuts.'
            ],
            _a['Time Formatting'] = [
                true,
                'Localize and format timestamps. Has more options on the "Advanced" tab.'
            ],
            _a['Comment Expansion'] = [
                true,
                'Expand comments that are too long to display on the index. Not applicable with JSON Index.'
            ],
            _a['File Info Formatting'] = [
                true,
                'Reformat the file information.'
            ],
            _a['Thread Expansion'] = [
                true,
                'Add buttons to expand threads.'
            ],
            _a['Index Navigation'] = [
                false,
                'Add buttons to navigate between threads.'
            ],
            _a['Reply Navigation'] = [
                false,
                'Add buttons to navigate to top / bottom of thread.'
            ],
            _a['Unique ID and Capcode Navigation'] = [
                false,
                'Add buttons to navigate to posts having the same unique ID or capcode.'
            ],
            _a['Custom Board Titles'] = [
                true,
                'Allow editing of the board title and subtitle by ctrl/\u2318+clicking them.'
            ],
            _a['Persistent Custom Board Titles'] = [
                false,
                'Force custom board titles to be persistent, even if the board titles are updated.',
                1
            ],
            _a['Show Updated Notifications'] = [
                true,
                "Show notifications when ".concat(package_json_1.default.name, " is successfully updated.")
            ],
            _a['Color User IDs'] = [
                true,
                'Assign unique colors to user IDs on boards that use them'
            ],
            _a['Count Posts by ID'] = [
                true,
                'Display number of posts in the thread when hovering over an ID.'
            ],
            _a['Remove Spoilers'] = [
                false,
                'Remove all spoilers in text.'
            ],
            _a['Reveal Spoilers'] = [
                false,
                'Indicate spoilers if Remove Spoilers is enabled, or make the text appear hovered if Remove Spoiler is disabled.'
            ],
            _a['Normalize URL'] = [
                true,
                'Rewrite the URL of the current page, removing slugs and excess slashes, and changing /res/ to /thread/.'
            ],
            _a['Disable Autoplaying Sounds'] = [
                false,
                'Prevent sounds on the page from autoplaying.'
            ],
            _a['Disable Native Extension'] = [
                true,
                "".concat(package_json_1.default.name, " is NOT designed to work with the native extension.")
            ],
            _a['Enable Native Flash Embedding'] = [
                true,
                'Activate the native extension\'s Flash embedding if the native extension is disabled.'
            ],
            _a['Export History'] = [
                true,
                'Export last read, your posts, etc. when exporting the setting'
            ],
            _a['Ask to Export History'] = [
                true,
                'Ask if history should be exported when settings are exported.'
            ],
            _a['Scroll Markers'] = [
                true,
                'Mark your posts and replies to them on the scroll bar. Relies on the "Highlight Posts Quoting You" and ' +
                    '"Highlight Own Posts" settings'
            ],
            _a),
        'Linkification': {
            'Linkify': [
                true,
                'Convert text into links where applicable.'
            ],
            'Link Title': [
                true,
                'Replace the link of a supported site with its actual title.',
                1
            ],
            'Link Title in the catalog': [
                false,
                'Replace the link of a supported site with its actual title in the catalog too. ' +
                    'Speed up performance for boards that have many embeds (e.g /vt/) if turned off',
                2
            ],
            'Cover Preview': [
                true,
                'Show preview of supported links on hover.',
                1
            ],
            'Embedding': [
                true,
                'Embed supported services. Note: Some services don\'t work on HTTPS.',
                1
            ],
            'Auto-embed': [
                false,
                'Auto-embed Linkify Embeds.',
                2
            ],
            'Floating Embeds': [
                false,
                'Embed content in a frame that remains in place when the page is scrolled.',
                2
            ],
        },
        'Filtering': {
            'Anonymize': [
                false,
                'Make everyone Anonymous.'
            ],
            'Filter': [
                true,
                'Self-moderation placebo.'
            ],
            'Filtered Backlinks': [
                false,
                'When enabled, shows backlinks to filtered posts with a line-through decoration. Otherwise, hides the backlinks.',
                1
            ],
            'Filter in Native Catalog': [
                true,
                'Apply 4chan X filters in native catalog.',
                1
            ],
            'MD5 Quick Filter Notifications': [
                true,
                'Show notification when quick filtering MD5s using the button or keybind.',
                1
            ],
            'MD5 Quick Filter in the Catalog': [
                true,
                'Quick filter by MD5 when clicking a thumbnail in the catalog and holding Shift. Disabling falls back on just hiding the thread.',
                1
            ],
            'MD5 Quick Filter in Threads': [
                true,
                'Quick filter by MD5 when clicking a thumbnail in a thread while holding shift.',
                1
            ],
            'Recursive Hiding': [
                true,
                'Hide replies of hidden posts, recursively.'
            ],
            'Thread Hiding Buttons': [
                true,
                'Add buttons to hide entire threads.'
            ],
            'Reply Hiding Buttons': [
                true,
                'Add buttons to hide single replies.'
            ],
            'Stubs': [
                true,
                'Show stubs of hidden threads / replies.'
            ],
            'Filter Reason': [
                true,
                'Show the reason the post was hidden in the stub. If disabled, you can hover over the stub to see the reason.'
            ],
        },
        'Images and Videos': {
            'Image Expansion': [
                true,
                'Expand images / videos.'
            ],
            'Image Hover': [
                true,
                'Show full image / video on mouseover.'
            ],
            'Download All Media': [
                true,
                'Add a button to the header to download all media in a thread.'
            ],
            'Image Hover in Catalog': [
                true,
                "Show full image / video on mouseover in ".concat(package_json_1.default.name, " catalog.")
            ],
            'Gallery': [
                true,
                'Adds a simple and cute image gallery. Has more options in the gallery menu.'
            ],
            'Fullscreen Gallery': [
                false,
                'Open gallery in fullscreen mode.',
                1
            ],
            'PDF in Gallery': [
                false,
                'Show PDF files in gallery.',
                1
            ],
            'Sauce': [
                true,
                'Add sauce links to images.'
            ],
            'WEBM Metadata': [
                true,
                'Add link to fetch title metadata from webm videos.'
            ],
            'Reveal Spoiler Thumbnails': [
                false,
                'Replace spoiler thumbnails with the original image.'
            ],
            'Replace GIF': [
                false,
                'Replace gif thumbnails with the actual image.'
            ],
            'Replace JPG': [
                false,
                'Replace jpg thumbnails with the actual image.'
            ],
            'Replace PNG': [
                false,
                'Replace png thumbnails with the actual image.'
            ],
            'Replace WEBM': [
                false,
                'Replace webm, mp4, and ogv thumbnails with the actual video. Probably will degrade browser performance ;)'
            ],
            'Image Prefetching': [
                true,
                'Add a shortcut icon to the header to turn on image preloading.'
            ],
            'Fappe Tyme': [
                true,
                'Hide posts without images when header menu item is checked. *hint* *hint*'
            ],
            'Werk Tyme': [
                true,
                'Hide all post images when header menu item is checked.'
            ],
            'Autoplay': [
                true,
                'Videos begin playing immediately when opened.'
            ],
            'Restart when Opened': [
                false,
                'Restart GIFs and WebMs when you hover over or expand them.'
            ],
            'Show Controls': [
                true,
                'Show controls on videos expanded inline.'
            ],
            'Click Passthrough': [
                false,
                'Clicks on videos trigger your browser\'s default behavior. Videos can be contracted with button / dragging to the left.',
                1
            ],
            'Allow Sound': [
                true,
                'Open videos with the sound unmuted.'
            ],
            'Mouse Wheel Volume': [
                true,
                'Adjust volume of videos with the mouse wheel over the thumbnail/filename/gallery.'
            ],
            'Loop in New Tab': [
                true,
                'Loop videos opened in their own tabs.'
            ],
            'Volume in New Tab': [
                true,
                "Apply ".concat(package_json_1.default.name, " mute and volume settings to videos opened in their own tabs.")
            ],
            'Enable sound posts': [
                true,
                'Enable loading audio from [sound=] file names. This audio is fetched from third parties.'
            ],
        },
        'Menu': {
            'Menu': [
                true,
                'Add a drop-down menu to posts.'
            ],
            'Report Link': [
                true,
                'Add a report link to the menu.',
                1
            ],
            'Copy Text Link': [
                true,
                'Add a link to copy the post\'s text.',
                1
            ],
            'Thread Hiding Link': [
                true,
                'Add a link to hide entire threads.',
                1
            ],
            'Reply Hiding Link': [
                true,
                'Add a link to hide single replies.',
                1
            ],
            'Delete Link': [
                true,
                'Add post and image deletion links to the menu.',
                1
            ],
            'Archive Link': [
                true,
                'Add an archive link to the menu.',
                1
            ],
            'Edit Link': [
                true,
                'Add a link to edit the image in Tegaki, /i/\'s painting program. Requires Quick Reply.',
                1
            ],
            'Download Link': [
                false,
                'Add a download with original filename link to the menu.',
                1
            ]
        },
        'Monitoring': {
            'Thread Updater': [
                true,
                'Fetch and insert new replies. Has more options in the header menu and the "Advanced" tab.'
            ],
            'Unread Count': [
                true,
                'Show the unread posts count in the tab title.'
            ],
            'Quoted Title': [
                false,
                'Change the page title to reflect you\'ve been quoted.',
                1
            ],
            'Hide Unread Count at (0)': [
                false,
                'Hide the unread posts count in the tab title when it reaches 0.',
                1
            ],
            'Unread Favicon': [
                true,
                'Show a different favicon when there are unread posts.'
            ],
            'Unread Line': [
                true,
                'Show a line to distinguish read posts from unread ones.'
            ],
            'Remember Last Read Post': [
                true,
                'Remember how far you\'ve read after you close the thread.'
            ],
            'Scroll to Last Read Post': [
                true,
                'Scroll back to the last read post when reopening a thread.',
                1
            ],
            'Unread Line in Index': [
                false,
                'Show a line between read and unread posts in threads in the index.',
                1
            ],
            'Remove Thread Excerpt': [
                false,
                'Replace the excerpt of the thread in the tab title with the board title.'
            ],
            'Thread Stats': [
                true,
                'Display reply and image count.'
            ],
            'IP Count in Stats': [
                true,
                'Display the unique IP count in the thread stats.',
                1
            ],
            'Page Count in Stats': [
                true,
                'Display the page count in the thread stats.',
                1
            ],
            'Purge Position': [
                false,
                'Update stats more often and add purge position when a thread is close to getting purged, for anons who manage general threads.',
                2
            ],
            'Updater and Stats in Header': [
                true,
                'Places the thread updater and thread stats in the header instead of floating them.'
            ],
            'Thread Watcher': [
                true,
                'Bookmark threads. Has more options in the thread watcher menu.'
            ],
            'Fixed Thread Watcher': [
                true,
                'Makes the thread watcher scroll with the page.',
                1
            ],
            'Persistent Thread Watcher': [
                false,
                'The thread watcher will be visible when the page is loaded.',
                1
            ],
            'Mark New IPs': [
                false,
                'Label each post from a new IP with the thread\'s current IP count.'
            ],
            'Reply Pruning': [
                true,
                'Add option in header menu to hide old replies in long threads. Activated by default in stickies.'
            ],
            'Prune All Threads': [
                false,
                'Activate Reply Pruning by default in all threads.',
                1
            ]
        },
        'Posting and Captchas': {
            'Quick Reply': [
                true,
                'All-in-one form to reply, create threads, automate dumping and more.'
            ],
            'Persistent QR': [
                false,
                'The Quick reply won\'t disappear after posting.',
                1
            ],
            'Auto Hide QR': [
                true,
                'Automatically hide the quick reply when posting.',
                2
            ],
            'Open Post in New Tab': [
                true,
                'Open new threads in a new tab, and open replies in a new tab if you\'re not already in the thread.',
                1
            ],
            'Remember QR Size': [
                false,
                'Remember the size of the Quick reply.',
                1
            ],
            'Remember Spoiler': [
                false,
                'Remember the spoiler state, instead of resetting after posting.',
                1
            ],
            'Randomize Filename': [
                false,
                'Set the filename to a random timestamp within the past year. Disabled on /f/.',
                1
            ],
            'Show New Thread Option in Threads': [
                true,
                'Show the option to post a new / different thread from inside a thread.',
                1
            ],
            'Show Upload Progress': [
                true,
                'Track progress of file uploads as percentage in submit button.',
                1
            ],
            'Cooldown': [
                true,
                'Indicate the remaining time before posting again.',
                1
            ],
            'Posting Success Notifications': [
                true,
                'Show notifications on successful post creation or file uploading.',
                1
            ],
            'Auto-load captcha': [
                false,
                'Automatically load the captcha in the QR even if your post is empty.',
                1
            ],
            'Post on Captcha Completion': [
                false,
                'Submit the post immediately when the captcha is completed.',
                1
            ],
            'Avoid OffscreenCanvas': [
                false,
                'Do not use OffscreenCanvas when converting images, workaround for ' +
                    '<a href="https://github.com/TuxedoTako/4chan-xt/issues/132">this LibreWolf bug</a>',
                1
            ],
            'Force Noscript Captcha': [
                false,
                'Use the non-Javascript fallback captcha even if Javascript is enabled.'
            ],
            'Pass Link': [
                false,
                'Add a 4chan Pass login link to the bottom of the page.'
            ]
        },
        'Quote Links': {
            'Quote Backlinks': [
                true,
                'Add quote backlinks.'
            ],
            'OP Backlinks': [
                true,
                'Add backlinks to the OP.',
                1
            ],
            'Bottom Backlinks': [
                false,
                'Place backlinks at the bottom of posts.',
                1
            ],
            'Quote Inlining': [
                true,
                'Inline quoted post on click.'
            ],
            'Inline Cross-thread Quotes Only': [
                false,
                'Don\'t inline quote links when the posts are visible in the thread.',
                1
            ],
            'Quote Hash Navigation': [
                false,
                'Include an extra link after quotes for autoscrolling to quoted posts.',
                1
            ],
            'Forward Hiding': [
                true,
                'Hide original posts of inlined backlinks.',
                1
            ],
            'Quote Previewing': [
                true,
                'Show quoted post on hover.'
            ],
            'Quote Highlighting': [
                true,
                'Highlight the previewed post.',
                1
            ],
            'Resurrect Quotes': [
                true,
                'Link dead quotes to the archives, and support inlining/previewing of archive links like quote links.'
            ],
            'Remember Your Posts': [
                true,
                'Remember your posting history.'
            ],
            'Mark Quotes of You': [
                true,
                'Add \'(You)\' to quotes linking to your posts.',
                1
            ],
            'Highlight Posts Quoting You': [
                true,
                'Highlights any posts that contain a quote to your post.',
                1
            ],
            'Highlight Own Posts': [
                true,
                'Highlights own posts.',
                1
            ],
            'Mark OP Quotes': [
                true,
                'Add \'(OP)\' to OP quotes.'
            ],
            'Mark Cross-thread Quotes': [
                true,
                'Add \'(Cross-thread)\' to cross-threads quotes.'
            ],
            'Quote Threading': [
                true,
                'Add option in header menu to thread conversations.'
            ]
        }
    },
    imageExpansion: {
        'Fit width': [
            true,
            ''
        ],
        'Fit height': [
            false,
            ''
        ],
        'Scroll into view': [
            true,
            'Scroll down when expanding images to bring the full image into view.'
        ],
        'Expand spoilers': [
            true,
            'Expand all images along with spoilers.'
        ],
        'Expand videos': [
            true,
            'Expand all images also expands videos.'
        ],
        'Expand from here': [
            false,
            'Expand all images only from current position to thread end.'
        ],
        'Expand thread only': [
            false,
            'In index, expand all images only within the current thread.'
        ],
        'Advance on contract': [
            false,
            'Advance to next post when contracting an expanded image.'
        ]
    },
    gallery: {
        'Hide Thumbnails': [
            false
        ],
        'Fit Width': [
            true
        ],
        'Fit Height': [
            true
        ],
        'Stretch to Fit': [
            false
        ],
        'Scroll to Post': [
            true
        ],
        'Slide Delay': [
            6.0
        ]
    },
    'Default Volume': 1.0,
    threadWatcher: {
        'Current Board': [
            false,
            'Only show watched threads from the current board.'
        ],
        'Auto Update Thread Watcher': [
            true,
            'Periodically check status of watched threads.'
        ],
        'Auto Watch': [
            true,
            'Automatically watch threads you start.'
        ],
        'Auto Watch Reply': [
            true,
            'Automatically watch threads you reply to.'
        ],
        'Auto Prune': [
            false,
            'Automatically remove dead threads.'
        ],
        'Show Page': [
            true,
            'Show what page watched threads are on.'
        ],
        'Show Unread Count': [
            true,
            'Show number of unread posts in watched threads.'
        ],
        'Show Site Prefix': [
            true,
            'When multiple sites are shown in the thread watcher, add a prefix to board names to distinguish them.'
        ],
        'Require OP Quote Link': [
            false,
            'For purposes of thread watcher highlighting, only consider posts with a quote link to the OP as replies to the OP.'
        ]
    },
    filter: {
        general: '',
        postID: "# Highlight dubs on [s4s]:\n#/(\\d)\\1$/;highlight;top:no;boards:s4s",
        name: "# Filter any namefags:\n#/^(?!Anonymous$)/",
        uniqueID: "# Filter a specific ID:\n#/Txhvk1Tl/",
        tripcode: "# Filter any tripfag\n#/^!/",
        capcode: "# Set a custom class for mods:\n#/Mod$/;highlight:mod;op:yes\n# Set a custom class for admins:\n#/Admin$/;highlight:admin;op:yes",
        pass: "# Filter anyone using since4pass:\n#/./",
        email: '',
        subject: "# Filter Generals on /v/:\n#/general/i;boards:v;op:only",
        comment: "# Filter Stallman copypasta on /g/:\n#/what you're refer+ing to as linux/i;boards:g\n# Filter posts with 20 or more quote links:\n#/(?:>>\\d(?:(?!>>\\d)[^])*){20}/\n# Filter posts like T H I S / H / I / S:\n#/^>?\\s?\\w\\s?(\\w)\\s?(\\w)\\s?(\\w).*$[\\s>]+\\1[\\s>]+\\2[\\s>]+\\3/im",
        flag: '',
        filename: '',
        dimensions: "# Highlight potential wallpapers:\n#/1920x1080/;op:yes;highlight;top:no;boards:w,wg",
        filesize: '',
        MD5: ''
    },
    sauces: "# Known filename formats:\nhttps://www.pixiv.net/member_illust.php?mode=medium&illust_id=%$1;regexp:/^(\\d+)_p\\d+/\njavascript:void(open(\"https://www.deviantart.com/\"+%$1.replace(/_/g,\"-\")+\"/art/\"+parseInt(%$2,36)));regexp:/^\\w+_by_(\\w+)[_-]d([\\da-z]{6})\\b/\nhttps://imgur.com/%$1;regexp:/^(?![a-zA-Z][a-z]{6})(?![A-Z]{7})(?!\\d{7})([\\da-zA-Z]{7})(?: \\(\\d+\\))?\\.\\w+$/\nhttps://flickr.com/photo.gne?id=%$1;regexp:/^(\\d+)_[\\da-f]{10}(?:_\\w)*\\b/\nhttps://www.facebook.com/photo.php?fbid=%$1;regexp:/^\\d+_(\\d+)_\\d+_[no]\\b/\n\n# Reverse image search:\nhttps://www.google.com/searchbyimage?sbisrc=4chanx&image_url=%IMG&safe=off\nhttps://yandex.com/images/search?rpt=imageview&url=%IMG\n#//tineye.com/search?url=%IMG\n#//www.bing.com/images/search?q=imgurl:%IMG&view=detailv2&iss=sbi#enterInsights\n#https://lens.google.com/uploadbyurl?url=%IMG;text:lens\n\n# Specialized reverse image search:\n//iqdb.org/?url=%IMG\nhttps://trace.moe/?auto&url=%IMG;text:wait\n#//3d.iqdb.org/?url=%IMG\n#//saucenao.com/search.php?url=%IMG\n\n# \"View Same\" in archives:\nhttp://eye.swfchan.com/search/?q=%name;types:swf\n#https://desuarchive.org/_/search/image/%sMD5/\n#https://archive.4plebs.org/_/search/image/%sMD5/\n#https://boards.fireden.net/_/search/image/%sMD5/\n#https://foolz.fireden.net/_/search/image/%sMD5/\n\n# Other tools:\n#http://exif.regex.info/exif.cgi?imgurl=%URL\n#//imgops.com/start?url=%URL;types:gif,jpg,png\n#//www.gif-explode.com/%URL;types:gif",
    FappeT: {
        werk: false
    },
    'Custom CSS': true,
    Index: {
        'Index Mode': 'paged',
        'Previous Index Mode': 'paged',
        'Index Size': 'small',
        'Show Replies': [true, 'Show replies in the index, and also in the catalog if "Catalog hover expand" is checked.'],
        'Catalog Hover Expand': [false, 'Expand the comment and show more details when you hover over a thread in the catalog.'],
        'Catalog Hover Toggle': [true, 'Turn "Catalog hover expand" on and off by clicking in the catalog.'],
        'Pin Watched Threads': [false, 'Move watched threads to the start of the index.'],
        'Anchor Hidden Threads': [true, 'Move hidden threads to the end of the index.'],
        'Refreshed Navigation': [false, 'Refresh index when navigating through pages.']
    },
    Header: {
        'Fixed Header': true,
        'Header auto-hide': false,
        'Header auto-hide on scroll': false,
        'Bottom Header': false,
        'Centered links': false,
        'Header catalog links': false,
        'Bottom Board List': true,
        'Shortcut Icons': true,
        'Custom Board Navigation': true
    },
    archives: {
        archiveLists: 'https://4chenz.github.io/archives.json/archives.json',
        lastarchivecheck: 0,
        archiveAutoUpdate: true
    },
    externalCatalogURLs: "//catalog.neet.tv/%board/;boards:4chan.org:3,a,adv,an,asp,biz,c,cgl,ck,cm,co,diy,f,fa,fit,g,gd,his,i,int,jp,k,lgbt,lit,m,mlp,mu,n,news,o,out,p,po,pol,s4s,sci,sp,tg,toy,trv,tv,v,vg,vip,vp,vr,w,wg,wsg,wsr,x",
    boardnav: "[ toggle-all ]\n[current-index-text:\"Index\"\ncurrent-catalog-text:\"Catalog\"\ncurrent-expired-text:\"Expired\"\ncurrent-archive-text:\"Archive\"]\n[external-text:\"FAQ\",\"".concat(package_json_1.default.faq, "\"]"),
    QR: {
        'QR.personas': "#options:\"sage\";boards:jp;always",
        sjisPreview: false
    },
    jsWhitelist: '',
    captchaLanguage: '',
    time: '%m/%d/%y(%a)%H:%M:%S',
    timeLocale: '',
    RelativeTime: 'Hover',
    backlink: '>>%id',
    pastedname: 'file',
    fileInfo: '%l %d (%p%s, %r%g)',
    favicon: 'ferongr',
    usercss: user_css_1.default,
    hotkeys: {
        // QR & Options
        'Toggle board list': [
            'Ctrl+b',
            'Toggle the full board list.'
        ],
        'Toggle header': [
            'Shift+h',
            'Toggle the auto-hide option of the header.'
        ],
        'Open empty QR': [
            'q',
            'Open QR without post number inserted.'
        ],
        'Open QR': [
            'Shift+q',
            'Open QR with post number inserted.'
        ],
        'Open settings': [
            'Alt+o',
            'Open Settings.'
        ],
        'Close': [
            'Esc',
            'Close dialogs or notifications.'
        ],
        'Spoiler tags': [
            'Ctrl+s',
            'Insert spoiler tags.'
        ],
        'Code tags': [
            'Alt+c',
            'Insert code tags.'
        ],
        'Eqn tags': [
            'Alt+e',
            'Insert eqn tags.'
        ],
        'Math tags': [
            'Alt+m',
            'Insert math tags.'
        ],
        'SJIS tags': [
            'Alt+a',
            'Insert SJIS tags.'
        ],
        'Toggle sage': [
            'Alt+s',
            'Toggle sage in options field.'
        ],
        'Toggle Cooldown': [
            'Alt+Comma',
            'Toggle custom cooldown timer.'
        ],
        'Post from URL': [
            'Alt+l',
            'Post from URL.'
        ],
        'Add new post': [
            'Alt+n',
            'Add new post to the QR dump list.'
        ],
        'Submit QR': [
            'Ctrl+Enter',
            'Submit post.'
        ],
        // Thread related
        'Watch': [
            'w',
            'Watch thread.'
        ],
        'Update': [
            'r',
            'Update the thread / refresh the index.'
        ],
        'Update thread watcher': [
            'Shift+r',
            'Manually refresh thread watcher.'
        ],
        'Toggle thread watcher': [
            't',
            'Toggle visibility of thread watcher.'
        ],
        'Toggle threading': [
            'Shift+t',
            'Toggle threading.'
        ],
        'Mark thread read': [
            'Ctrl+0',
            'Mark thread read from index (requires "Unread Line in Index").'
        ],
        // Images
        'Expand image': [
            'Shift+e',
            'Expand selected image.'
        ],
        'Expand images': [
            'e',
            'Expand all images.'
        ],
        'Open Gallery': [
            'g',
            'Opens the gallery.'
        ],
        'Next Gallery Image': [
            'Right',
            'Go to the next image in gallery mode.'
        ],
        'Previous Gallery Image': [
            'Left',
            'Go to the previous image in gallery mode.'
        ],
        'Advance Gallery': [
            'Enter',
            'Go to next image or, if Autoplay is off, play video.'
        ],
        'Pause': [
            'p',
            'Pause/play videos in the gallery.'
        ],
        'Slideshow': [
            'Ctrl+Right',
            'Toggle the gallery slideshow mode.'
        ],
        'Rotate image clockwise': [
            'Shift+Right',
            'Rotate image clockwise in gallery.'
        ],
        'Rotate image anticlockwise': [
            'Shift+Left',
            'Rotate image anticlockwise in gallery.'
        ],
        'Download Gallery Image': [
            'Shift+j',
            'Download current image in gallery.'
        ],
        'fappeTyme': [
            'f',
            'Toggle Fappe Tyme.'
        ],
        'werkTyme': [
            'Shift+w',
            'Toggle Werk Tyme.'
        ],
        // Board Navigation
        'Front page': [
            '1',
            'Jump to front page.'
        ],
        'Open front page': [
            'Shift+1',
            'Open front page in a new tab.'
        ],
        'Next page': [
            'Ctrl+Right',
            'Jump to the next page.'
        ],
        'Previous page': [
            'Ctrl+Left',
            'Jump to the previous page.'
        ],
        'Paged mode': [
            'Alt+1',
            'Open the index in paged mode.'
        ],
        'Infinite scrolling mode': [
            'Alt+2',
            'Open the index in infinite scrolling mode.'
        ],
        'All pages mode': [
            'Alt+3',
            'Open the index in all threads mode.'
        ],
        'Open catalog': [
            'Shift+c',
            'Open the catalog of the current board.'
        ],
        'Search form': [
            'Ctrl+Alt+s',
            'Focus the search field on the board index.'
        ],
        'Cycle sort type': [
            'Alt+x',
            'Cycle through index sort types.'
        ],
        // Thread Navigation
        'Next thread': [
            'Ctrl+Down',
            'See next thread.'
        ],
        'Previous thread': [
            'Ctrl+Up',
            'See previous thread.'
        ],
        'Expand thread': [
            'Ctrl+e',
            'Expand thread.'
        ],
        'Open thread': [
            'o',
            'Open thread in current tab.'
        ],
        'Open thread tab': [
            'Shift+o',
            'Open thread in new tab.'
        ],
        // Reply Navigation
        'Next reply': [
            'j',
            'Select next reply.'
        ],
        'Previous reply': [
            'k',
            'Select previous reply.'
        ],
        'Deselect reply': [
            'Shift+d',
            'Deselect reply.'
        ],
        'Hide': [
            'x',
            'Hide thread.'
        ],
        'Quick Filter MD5': [
            '5',
            'Add the MD5 of the selected image to the filter list.'
        ],
        'Previous Post Quoting You': [
            'Alt+Up',
            'Scroll to the previous post that quotes you.'
        ],
        'Next Post Quoting You': [
            'Alt+Down',
            'Scroll to the next post that quotes you.'
        ]
    },
    updater: {
        checkbox: {
            'Beep': [
                false,
                'Beep on new post to completely read thread.'
            ],
            'Beep Quoting You': [
                false,
                'Beep on new post quoting you.'
            ],
            'Auto Scroll': [
                false,
                'Scroll updated posts into view. Only enabled at bottom of page.'
            ],
            'Bottom Scroll': [
                false,
                'Always scroll to the bottom, not the first new post. Useful for event threads.'
            ],
            'Scroll BG': [
                false,
                'Auto-scroll background tabs.'
            ],
            'Auto Update': [
                true,
                'Automatically fetch new posts.'
            ],
            'Optional Increase': [
                false,
                'Increase the intervals between updates on threads without new posts.'
            ]
        },
        'Interval': 5
    },
    customCooldown: 0,
    customCooldownEnabled: true,
    'Thread Quotes': false,
    'Max Replies': 1000,
    'Autohiding Scrollbar': false,
    position: {
        'embedding.position': 'top: 50px; right: 0px;',
        'thread-stats.position': 'bottom: 0px; right: 0px;',
        'updater.position': 'bottom: 0px; left: 0px;',
        'thread-watcher.position': 'top: 50px; left: 0px;',
        'qr.position': 'top: 50px; right: 0px;'
    },
    fourchanImageHost: 'i.4cdn.org',
    hiddenPSAList: [{}],
    knownBanners: banners_json_1.default.join(','),
    passMessageClosed: false,
    'PSAseen': [[]],
    XEmbedder: 'fxt',
    fxtLang: '',
    fxtUrl: 'https://api.fxtwitter.com',
    fxtMaxReplies: 5,
    beepSource: '',
    beepVolume: 1,
};
exports.default = Config;
