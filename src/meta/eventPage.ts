import PageContextFunctions from "../PageContext/pageContext";

// This requestId workaround isn't needed in manifest V3, since returning true in the event listener works.
// But we keep it for manifest V2.
let requestID = 0;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  const id = requestID;
  requestID++;
  handlers[request.type](request, sender).then((data: any) => {
    chrome.tabs.sendMessage(sender.tab!.id!, { id, data });
  });
  sendResponse(id);
});

type HandlerFn = (request: any, sender: chrome.runtime.MessageSender) => Promise<any>;

const handlers: Record<string, HandlerFn> = {
  permission(request) {
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

  async ajax(request) {
    try {
      const res = await fetch(request.url, { headers: request.headers || {} });
      if (!res.ok) {
        return { error: true };
      }
      let response: any;
      if (request.responseType === 'arraybuffer') {
        const buf = await res.arrayBuffer();
        // convert ArrayBuffer to array of numbers for message serialization
        response = Array.from(new Uint8Array(buf));
      } else if (request.responseType === 'json') {
        response = await res.json();
      } else {
        response = await res.text();
      }
      const responseHeaderString = Array.from(res.headers, h => `${h[0]}: ${h[1]}\r\n`).join('');
      return { status: res.status, statusText: res.statusText, response, responseHeaderString };
    } catch (e) {
      return { error: true };
    }
  },

  async runInPageContext(request, sender) {
    const results = await chrome.scripting.executeScript({
      func: (PageContextFunctions as any)[request.fn],
      args: request.data ? [request.data] : [],
      target: { tabId: sender.tab!.id! },
      world: 'MAIN',
    });
    return results[0].result;
  }
};
