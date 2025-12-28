// DevTools拡張 - パネル作成
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.devtools.panels.create(
    'URL Rewrite',
    'icons/icon16.png',
    'panel.html'
);
