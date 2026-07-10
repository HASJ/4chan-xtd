# 4chan XTd

4chan XTd is a script that adds various features to anonymous imageboards. It was originally developed for 4chan but has no affiliation with it.

4chan XTd was originally forked from [4chan X](https://github.com/ccd0/4chan-x). It is named XT both as a continuation of eXTended, and a T for TypeScript, the language it's written in.

## Features

New features since the fork include:

- Fetching the thread from an external archive and inserting deleted posts
- Basic audio posts support
- Automatically converting unsupported image files to png
- Automatically JPG'ing image files above the size limit
- Automatically removing audio tracks when uploading video files to boards that do not support it
- Download all media in thread button in the header
- Having both relative time and a timestamp on a post at the same time
- Counting poster ID's as a replacement of the deleted IP counter
- Hiding all posts from a poster ID in a thread
- A button to un-randomize a filename in the quick reply
- Showing the reason a post was filtered in the stub
- Marking replies to your post on the scroll bar
- Stacked new captcha challenge with keyboard number keys support
- Captcha dark theme support in the Quick Reply dialog

4chan X was previously developed by [ccd0](https://github.com/ccd0/4chan-x), [aeosynth](https://github.com/aeosynth/4chan-x), [Mayhem](https://github.com/MayhemYDG/4chan-x), [ihavenoface](https://github.com/ihavenoface/4chan-x), [Zixaphir](https://github.com/zixaphir/appchan-x), [Seaweed](https://github.com/seaweedchan/4chan-x), and [Spittie](https://github.com/Spittie/4chan-x), with contributions from many others.

4chan XT was previosly developed by [TuxedoTako](https://github.com/TuxedoTako/4chan-xt).

## Please note
**Uninstalling**: 4chan XTd disables the native extension, so if you uninstall 4chan XTd, you'll need to re-enable it. To do this, click the `[Settings]` link in the top right corner, uncheck "`Disable the native extension`" in the panel that appears, and click the "`Save Settings`" button. If you don't see a "`Save Settings`" button, it may be being hidden by your ad blocker.

**Private browsing**: By default, 4chan XTd remembers your last read post in a thread and which posts were made by you, even if you are in private browsing / incognito mode. If you want to turn this off, uncheck the `Remember Last Read Post` and `Remember Your Posts` options in the settings panel. You can clear all 4chan browsing history saved by 4chan XTd by resetting your settings. This fork also includes an option to export settings without exporting your history.

Use of the "Link Title" feature to fetch titles of Youtube links is subject to Youtube's [Terms of Service](https://www.youtube.com/t/terms) and [Privacy Policy](http://www.google.com/policies/privacy). For more details on what information is sent to Youtube and other sites, and how to turn it off if you don't want the feature, see upstream 4chan X's [privacy documentation](https://github.com/ccd0/4chan-x/wiki/Privacy).

## Install

To run an user script, you need an user script manager like Violentmonkey ([Chrome](https://chromewebstore.google.com/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag), [Firefox](https://addons.mozilla.org/firefox/addon/violentmonkey/), [Edge](https://microsoftedge.microsoft.com/addons/detail/eeagobfjdenkkddmbclomhiblgggliao)), or Tampermonkey ([Chrome](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/), [Edge](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd), [Safari](https://apps.apple.com/app/tampermonkey/id6738342400)).

This fork is distributed through [GitHub releases](https://github.com/HASJ/4chan-xtd/releases) and [Greasy Fork](https://greasyfork.org/scripts/489508-4chan-xtd). There are known issues with updating user scripts through GitHub: [#34](https://github.com/HASJ/4chan-xtd/issues/34) [violentmonkey#1673](https://github.com/violentmonkey/violentmonkey/issues/1673), but Greasy Fork doesn't allow the minified version. Automatic updates are supported for the user script version, but not the Chrome extension.

## Development

Want to build from source or contribute? See [CONTRIBUTING.md](CONTRIBUTING.md) for build commands, and [ARCHITECTURE.md](docs/ARCHITECTURE.md) for a deep dive into the codebase's structure.

Run `npm test` for the deterministic Vitest/jsdom suite, or `npm run test:coverage` for an informational V8 report. Browser smoke tests use synthetic local pages: run `npm run test:browser:install` once, then `npm run test:browser`. The contributor verification checklist and fixture guidance are in [docs/TESTING.md](docs/TESTING.md).

## Troubleshooting
If you encounter a bug, try the steps [here](CONTRIBUTING.md#reporting-bugs), then report it to the [issue tracker](https://github.com/HASJ/4chan-xtd/issues?q=is%3Aopen+sort%3Aupdated-desc). If the bug seems to be caused by a script update, you can install an old version from the [GitHub releases](https://github.com/HASJ/4chan-xtd/releases) or from [Greasy Fork](https://greasyfork.org/scripts/489508-4chan-xtd/versions).

## More information
- [Changelog](CHANGELOG.md)
- [Frequently Asked Questions for this fork](https://github.com/HASJ/4chan-xtd/wiki/Frequently-Asked-Questions)
- [Frequently Asked Questions for upstream, most should still apply](https://github.com/ccd0/4chan-x/wiki/Frequently-Asked-Questions)
- [Report Bugs](https://github.com/HASJ/4chan-xtd/issues?q=is%3Aopen+sort%3Aupdated-desc)
- [Contributing](CONTRIBUTING.md)
- [Testing](docs/TESTING.md)
