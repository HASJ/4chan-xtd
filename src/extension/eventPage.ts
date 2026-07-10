import PageContextFunctions from "../PageContext/pageContext.js";

// This requestId workaround isn't needed in manifest V3, since returning true in the event listener works.
// But we keep it for manifest V2.
let requestID = 0;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const id = requestID;
  requestID++;
  const handler = (handlers as any)[request.type];
  if (handler) {
    handler(request, sender).then((data: any) => {
      if (sender.tab?.id !== undefined) {
        chrome.tabs.sendMessage(sender.tab.id, { id, data });
      }
    });
  }
  sendResponse(id);
});

const handlers = {
  permission(request: any) {
    return new Promise(resolve => {
      const origins = request.origins || ['*://*/'];
      chrome.permissions.contains({origins}, function(result) {
        if (result) {
          resolve(result);
        } else {
          chrome.permissions.request({origins}, function(result) {
            resolve(chrome.runtime.lastError ? false : result);
          });
        }
      });
    });
  },

  async ajax(request: any) {
    try {
      const res = await fetch(request.url, { headers: request.headers || {} });
      if (!res.ok) {
        return { error: true };
      }
      let response;
      if (request.responseType === 'arraybuffer') {
        response = await res.arrayBuffer();
      } else if (request.responseType === 'json') {
        response = await res.json();
      } else {
        response = await res.text();
      }
      let responseHeaderString = '';
      res.headers.forEach((value, key) => {
        responseHeaderString += `${key}: ${value}\r\n`;
      });
      return { status: res.status, statusText: res.statusText, response, responseHeaderString };
    } catch (error) {
      console.warn('Fetch failed', error);
      return { error: true };
    }
  },

  async runInPageContext(request: any, sender: any) {
    const fn = (PageContextFunctions as any)[request.fn];
    if (typeof fn !== 'function' || !Object.prototype.hasOwnProperty.call(PageContextFunctions, request.fn)) {
      throw new Error("Invalid page context function requested");
    }
    if (sender.tab?.id === undefined) {
      throw new Error("Missing tab ID");
    }
    const results = await chrome.scripting.executeScript({
      func: fn,
      args: request.data ? [request.data] : [],
      target: { tabId: sender.tab.id },
      world: 'MAIN',
    });
    return results[0].result;
  }
};
