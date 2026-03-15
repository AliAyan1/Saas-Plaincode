(function () {
  var script = document.currentScript;
  if (!script) {
    var scripts = document.querySelectorAll('script[src*="widget.js"][data-bot-id]');
    script = scripts.length ? scripts[scripts.length - 1] : null;
  }
  if (!script) return;
  var botId = script.getAttribute("data-bot-id");
  var base = (script.src || "").replace(/\/widget\.js.*$/, "").replace(/\/$/, "");
  if (!botId || !base) return;

  var conversationId = null;
  var open = false;
  var root = null;
  var panel = null;
  var btn = null;
  var lastSupportReplyShown = null;
  var supportReplyPollTimer = null;

  var styles =
    ".ecom-widget-btn{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(249,115,22,0.4);z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:0;}.ecom-widget-btn:hover{opacity:0.95;}.ecom-widget-btn svg{display:block;flex-shrink:0;}.ecom-widget-panel{position:fixed;bottom:86px;right:20px;width:380px;max-width:calc(100vw - 40px);height:420px;max-height:70vh;background:#1e293b;border:1px solid #334155;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,0.4);display:flex;flex-direction:column;z-index:2147483645;font-family:system-ui,-apple-system,sans-serif;}.ecom-widget-panel.hidden{display:none;}.ecom-widget-messages{flex:1;overflow-y:auto;padding:12px;}.ecom-widget-msg{margin-bottom:10px;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.4;}.ecom-widget-msg.user{background:#334155;color:#f1f5f9;margin-left:24px;}.ecom-widget-msg.assistant{background:#0f172a;color:#e2e8f0;margin-right:24px;}.ecom-widget-form{display:flex;gap:8px;padding:12px;border-top:1px solid #334155;}.ecom-widget-input{flex:1;padding:10px 14px;border:1px solid #475569;border-radius:10px;background:#0f172a;color:#f1f5f9;font-size:14px;outline:none;}.ecom-widget-input:focus{border-color:#f97316;}.ecom-widget-send{padding:10px 16px;border:none;border-radius:10px;background:#f97316;color:#fff;font-weight:600;cursor:pointer;font-size:14px;}.ecom-widget-send:hover{opacity:0.9;}.ecom-widget-send:disabled{opacity:0.5;cursor:not-allowed;}";

  function inject() {
    var styleEl = document.createElement("style");
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    root = document.createElement("div");
    root.id = "ecom-support-widget";

    btn = document.createElement("button");
    btn.className = "ecom-widget-btn";
    btn.setAttribute("aria-label", "Open chat");
    btn.innerHTML =
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    btn.onclick = function () {
      open = !open;
      if (panel) panel.classList.toggle("hidden", !open);
      if (open && conversationId) startSupportReplyPoll();
      else if (!open) stopSupportReplyPoll();
    };

    panel = document.createElement("div");
    panel.className = "ecom-widget-panel hidden";
    var messagesDiv = document.createElement("div");
    messagesDiv.className = "ecom-widget-messages";
    var form = document.createElement("form");
    form.className = "ecom-widget-form";
    var input = document.createElement("input");
    input.className = "ecom-widget-input";
    input.placeholder = "Type your question…";
    input.type = "text";
    var send = document.createElement("button");
    send.className = "ecom-widget-send";
    send.type = "submit";
    send.textContent = "Send";

    form.appendChild(input);
    form.appendChild(send);
    panel.appendChild(messagesDiv);
    panel.appendChild(form);
    root.appendChild(btn);
    root.appendChild(panel);
    document.body.appendChild(root);

    function addMsg(role, text) {
      var p = document.createElement("p");
      p.className = "ecom-widget-msg " + role;
      p.textContent = text;
      messagesDiv.appendChild(p);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function pollSupportReply() {
      if (!conversationId || !open) return;
      fetch(base + "/api/forwarded/by-conversation?conversationId=" + encodeURIComponent(conversationId), { method: "GET", mode: "cors" })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.replyText && data.replyText !== lastSupportReplyShown) {
            lastSupportReplyShown = data.replyText;
            addMsg("assistant", "Support: " + data.replyText);
          }
        })
        .catch(function () {});
    }

    function startSupportReplyPoll() {
      if (supportReplyPollTimer) return;
      pollSupportReply();
      supportReplyPollTimer = setInterval(pollSupportReply, 15000);
    }
    function stopSupportReplyPoll() {
      if (supportReplyPollTimer) {
        clearInterval(supportReplyPollTimer);
        supportReplyPollTimer = null;
      }
    }

    form.onsubmit = function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      input.value = "";
      addMsg("user", q);
      send.disabled = true;
      addMsg("assistant", "…");

      var body = { question: q, chatbotId: botId };
      if (conversationId) body.conversationId = conversationId;

      var chatUrl = base + "/api/chat";
      fetch(chatUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(function (res) {
          var cid = res.headers.get("X-Conversation-Id");
          if (cid) {
            conversationId = cid;
            if (open) startSupportReplyPoll();
          }
          if (!res.ok) {
            return res.json().catch(function () { return {}; }).then(function (data) {
              var last = messagesDiv.querySelector(".ecom-widget-msg.assistant:last-child");
              if (last) {
                if (res.status === 402 && data.limitReached) {
                  last.textContent = "This chatbot has reached its conversation limit. The store owner can upgrade to Pro at plainbot.io to continue.";
                } else {
                  last.textContent = data.error || "Sorry, something went wrong. Try again.";
                }
              }
              send.disabled = false;
            });
          }
          if (!res.body) {
            var last = messagesDiv.querySelector(".ecom-widget-msg.assistant:last-child");
            if (last) last.textContent = "Sorry, no response. Try again.";
            send.disabled = false;
            return;
          }
          var decoder = new TextDecoder();
          var last = messagesDiv.querySelector(".ecom-widget-msg.assistant:last-child");
          if (last) last.textContent = "";
          var reader = res.body.getReader();
          function read() {
            reader.read().then(function (r) {
              if (r.done) {
                send.disabled = false;
                return;
              }
              if (last) last.textContent += decoder.decode(r.value, { stream: true });
              messagesDiv.scrollTop = messagesDiv.scrollHeight;
              read();
            });
          }
          read();
        })
        .catch(function (err) {
          var last = messagesDiv.querySelector(".ecom-widget-msg.assistant:last-child");
          if (last) last.textContent = "Network error. Check your connection or try again.";
          send.disabled = false;
        });
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})();
