// Màn mở khoá của bản web (pages_sync.py thay các <script> editor bằng file này). Code editor + art nằm trong app.bin đã mã hoá
// (pages_mahoa.js); người mở link chọn file wop2-editor.key → giải mã ngay trong trình duyệt (WebCrypto AES-GCM + gunzip) rồi chạy.
// Khoá nhớ trong localStorage của máy đó (bỏ nhớ: mở link kèm ?quenkhoa). window.WOP2_DEC(url) để wop2_app.js giải seqdata/data.bin.
(()=>{const me=document.currentScript,APP=me.dataset.app||"app.bin";window.WOP2_SEQ=me.dataset.seq||"seqdata/data.bin";
const LS="wop2ed_key";const lsGet=()=>{try{return localStorage.getItem(LS)}catch(e){return null}},lsSet=v=>{try{v==null?localStorage.removeItem(LS):localStorage.setItem(LS,v)}catch(e){}};
if(/[?&]quenkhoa\b/.test(location.search))lsSet(null);
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
let KEY=null;const appBuf=fetch(APP).then(r=>{if(!r.ok)throw new Error("không tải được "+APP+" ("+r.status+")");return r.arrayBuffer()});
async function open(key,buf){const u=new Uint8Array(buf);if(String.fromCharCode(...u.subarray(0,4))!=="W2E1")throw new Error("file mã hoá sai định dạng");
  const z=await crypto.subtle.decrypt({name:"AES-GCM",iv:u.subarray(4,16)},key,u.subarray(16));
  return await new Response(new Blob([z]).stream().pipeThrough(new DecompressionStream("gzip"))).text()}
window.WOP2_DEC=async url=>{if(!KEY)throw new Error("chưa mở khoá");const r=await fetch(url);if(!r.ok)throw new Error("không tải được "+url);return open(KEY,await r.arrayBuffer())};
async function tryKey(b64key){const raw=b64(b64key);if(raw.length!==32)throw new Error("khoá phải 32 byte");
  const key=await crypto.subtle.importKey("raw",raw,"AES-GCM",false,["decrypt"]);
  let txt;try{txt=await open(key,await appBuf)}catch(e){if(e.name==="OperationError")throw new Error("sai khoá");throw e}
  KEY=key;return JSON.parse(txt)}
function boot(files){for(const [name,code] of files){const s=document.createElement("script");s.textContent=code+"\n//# sourceURL="+name;document.body.appendChild(s)}
  const o=document.getElementById("w2lock");if(o)o.remove()}
// ---- giao diện ----
function ui(){const o=document.createElement("div");o.id="w2lock";o.innerHTML=`<style>
#w2lock{position:fixed;inset:0;z-index:99999;background:var(--bg,#12141a);display:flex;align-items:center;justify-content:center;padding:16px;font:600 14px/1.45 "Segoe UI",system-ui,sans-serif;color:var(--txt,#e9ecf3)}
#w2lock .c{width:min(420px,100%);background:var(--panel,#181b23);border:1px solid var(--line,#2c323f);border-radius:12px;padding:22px;box-shadow:0 10px 40px #0008}
#w2lock h1{font-size:18px;margin:0 0 4px}#w2lock p{margin:0 0 14px;color:var(--dim,#a3abbb);font-weight:500}
#w2lock .d{border:2px dashed var(--line,#2c323f);border-radius:10px;padding:18px;text-align:center;cursor:pointer;color:var(--dim,#a3abbb)}
#w2lock .d.on,#w2lock .d:hover{border-color:var(--ac,#f59e0b);color:var(--txt,#e9ecf3)}
#w2lock .e{min-height:20px;margin-top:10px;color:#f87171}#w2lock .e.ok{color:#4ade80}</style>
<div class="c"><h1>🔒 WOP 2 Level Editor</h1><p>Bản nội bộ đã mã hoá. Chọn file khoá <b>wop2-editor.key</b> để mở (xin file từ người quản lý editor). Chỉ cần chọn 1 lần — trình duyệt này sẽ tự nhớ.</p>
<div class="d" tabindex="0">📂 Bấm để chọn file khoá — hoặc kéo thả file vào đây</div>
<input type="file" accept=".key,.txt" hidden>
<div class="e"></div></div>`;
  document.body.appendChild(o);const d=o.querySelector(".d"),inp=o.querySelector("input[type=file]"),err=o.querySelector(".e");
  const msg=(t,ok)=>{err.textContent=t;err.classList.toggle("ok",!!ok)};
  async function use(f){if(!f)return;msg("⏳ Đang giải mã…",true);
    try{const m=/WOP2KEY1:([A-Za-z0-9+/=]+)/.exec(await f.text());if(!m)throw new Error("không phải file khoá WOP 2");
      const files=await tryKey(m[1]);lsSet(m[1]);boot(files)}catch(e){msg("❌ "+e.message)}}
  d.onclick=()=>inp.click();d.onkeydown=e=>{if(e.key==="Enter"||e.key===" ")inp.click()};inp.onchange=()=>use(inp.files[0]);
  o.ondragover=e=>{e.preventDefault();d.classList.add("on")};o.ondragleave=()=>d.classList.remove("on");
  o.ondrop=e=>{e.preventDefault();d.classList.remove("on");use(e.dataTransfer.files[0])};
  appBuf.catch(e=>msg("❌ "+e.message));return o}
const saved=lsGet();
if(saved){const o=ui();o.querySelector(".e").textContent="⏳ Đang mở bằng khoá đã nhớ…";o.querySelector(".e").classList.add("ok");
  tryKey(saved).then(boot).catch(e=>{lsSet(null);o.querySelector(".e").classList.remove("ok");o.querySelector(".e").textContent="❌ Khoá đã nhớ không dùng được ("+e.message+") — chọn lại file khoá"})}
else ui()})();
