# 4chan XTd Product Guidelines

## Design Philosophy
4chan XTd should feel like a natural extension of the imageboards it supports. The UI should be unobtrusive, efficient, and respect the visual language of traditional board software while providing modern enhancements.

## User Experience (UX)
- **Consistency:** Use consistent patterns for menus, dialogs, and buttons. Follow the established look and feel of the imageboard theme (Yotsuba, Tomorrow, etc.).
- **Performance:** Every interaction must be near-instant. Optimize DOM manipulations and avoid blocking the main thread.
- **Accessibility:** Provide robust keyboard shortcuts for all major actions. Ensure high contrast and readability across different board themes.
- **Customizability:** Allow users to toggle and tune almost every feature. Settings should be logically grouped and easy to search.

## Visual Language
- **Minimalism:** Avoid clutter. Hide advanced options behind "Settings" or context menus unless they are essential for daily use.
- **Feedback:** Provide clear visual feedback for user actions (e.g., success notices, error indicators).
- **Theming:** Support both native imageboard themes and custom user-provided CSS.

## Communication & Content
- **Clarity:** Use clear, unambiguous labels for settings and features.
- **Documentation:** Provide inline help or tooltips for complex features. Maintain an up-to-date FAQ and changelog.
- **Error Handling:** Gracefully handle network failures and API errors. Provide actionable error messages to the user.

## Technical Standards
- **TypeScript First:** All new code and refactors must use TypeScript for improved type safety and maintainability.
- **Privacy:** Never collect or transmit user data. Respect private browsing modes and minimize external requests.
- **Platform Agnostic:** Ensure the codebase supports both Userscript and CRX targets with minimal platform-specific code.
