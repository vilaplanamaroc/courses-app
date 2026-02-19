/* =========================
   COURSES APP (2 onglets)
   - Course: lignes illimitées par catégorie (Ajouter)
   - Achat: lignes illimitées + prix optionnel + total auto
   - Historique achats: localStorage
   - Icône PWA: via icon-512.png (iPhone OK)
========================= */

const STORAGE_KEY = "courses_achat_history_v1";

const DATA = [
  {
    id: "viandes",
    title: "Viandes",
    emoji: "🥩",
    items: ["Poulet","Dinde","Viande hachée","Steak","Kefta","Agneau","Poisson","Sardines","Merguez","Autre…"]
  },
  {
    id: "legumes",
    title: "Légumes",
    emoji: "🥬",
    items: ["Tomates","Oignons","Pommes de terre","Carottes","Courgettes","Poivrons","Aubergines","Concombres","Ail","Citron","Autre…"]
  },
  {
    id: "fruits",
    title: "Fruits",
    emoji: "🍎",
    items: ["Pommes","Bananes","Oranges","Fraises","Raisins","Avocats","Pastèque","Melon","Autre…"]
  },
  {
    id: "epicerie",
    title: "Épicerie",
    emoji: "🧂",
    items: ["Huile","Sucre","Sel","Farine","Riz","Pâtes","Lentilles","Pois chiches","Café","Thé","Épices","Autre…"]
  },
  {
    id: "produits_laitiers",
    title: "Produits laitiers",
    emoji: "🥛",
    items: ["Lait","Yaourt","Fromage","Beurre","Crème","Autre…"]
  },
  {
    id: "boulangerie",
    title: "Boulangerie",
    emoji: "🥖",
    items: ["Pain","Msemmen","Harcha","Croissants","Brioche","Autre…"]
  },
  {
    id: "maison",
    title: "Maison",
    emoji: "🧻",
    items: ["Papier toilette","Mouchoirs","Lessive","Liquide vaisselle","Sacs poubelle","Éponge","Autre…"]
  }
];

function $(id){ return document.getElementById(id); }

function todayISO(){
  const d = new Date();
  const pad = (n)=> String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function normalizeName(s){
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g," ")
    .replace(/[’']/g,"'");
}

function setTab(tab){
  const isCourse = (tab === "course");
  $("tabCourse").classList.toggle("active", isCourse);
  $("tabAchat").classList.toggle("active", !isCourse);
  $("screenCourse").classList.toggle("hidden", !isCourse);
  $("screenAchat").classList.toggle("hidden", isCourse);
  $("app").classList.toggle("achat", !isCourse);
}

/* ======================
   UI BUILD
====================== */

function buildCourseUI(){
  const host = $("courseCategories");
  host.innerHTML = "";

  DATA.forEach(cat=>{
    const section = document.createElement("div");
    section.innerHTML = `
      <div class="section-title">
        <span class="emoji">${cat.emoji}</span>
        <span>${cat.title}</span>
      </div>
      <div class="card glass">
        <div class="rows" id="course_rows_${cat.id}"></div>
        <div class="actions" style="margin-top:10px;">
          <button class="btn mini" type="button" data-add-course="${cat.id}">+ Ajouter</button>
        </div>
        <div class="small">Astuce: “Autre…” te permet d’écrire l’article manuellement.</div>
      </div>
    `;
    host.appendChild(section);

    // 1ère ligne par défaut
    addCourseRow(cat.id);
  });

  host.querySelectorAll("[data-add-course]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      addCourseRow(btn.getAttribute("data-add-course"));
      updateCourseSummary();
    });
  });
}

function buildAchatUI(){
  const host = $("achatCategories");
  host.innerHTML = "";

  DATA.forEach(cat=>{
    const section = document.createElement("div");
    section.innerHTML = `
      <div class="section-title">
        <span class="emoji">${cat.emoji}</span>
        <span>${cat.title}</span>
      </div>
      <div class="card glass">
        <div class="rows" id="achat_rows_${cat.id}"></div>
        <div class="actions" style="margin-top:10px;">
          <button class="btn mini" type="button" data-add-achat="${cat.id}">+ Ajouter</button>
        </div>
        <div class="small">Coche si acheté. Prix optionnel.</div>
      </div>
    `;
    host.appendChild(section);

    // 1ère ligne par défaut
    addAchatRow(cat.id);
  });

  host.querySelectorAll("[data-add-achat]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      addAchatRow(btn.getAttribute("data-add-achat"));
      updateAchatSummary();
    });
  });
}

/* ======================
   ROWS (COURSE)
====================== */

function courseSelectHTML(catId){
  const cat = DATA.find(x=>x.id === catId);
  const opts = cat.items.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  return `
    <select class="c_item" data-cat="${catId}">
      <option value="" selected>Choisir…</option>
      ${opts}
    </select>
  `;
}

function addCourseRow(catId){
  const rows = $(`course_rows_${catId}`);
  const line = document.createElement("div");
  line.className = "rowline";

  line.innerHTML = `
    <div class="left">
      ${courseSelectHTML(catId)}
      <input class="c_custom hidden_custom" type="text" placeholder="Autre (nom article)..." />
    </div>
    <div class="right">
      <input class="c_qty" type="text" placeholder="Quantité (ex: 2 / 1kg / 1/2 ...)" />
    </div>
  `;

  rows.appendChild(line);

  const sel = line.querySelector(".c_item");
  const custom = line.querySelector(".c_custom");

  sel.addEventListener("change", ()=>{
    const v = sel.value;
    if(v && normalizeName(v).startsWith("autre")){
      custom.classList.remove("hidden_custom");
      custom.focus();
    }else{
      custom.classList.add("hidden_custom");
      custom.value = "";
    }
    updateCourseSummary();
  });

  line.querySelector(".c_qty").addEventListener("input", updateCourseSummary);
  custom.addEventListener("input", updateCourseSummary);
}

function getCourseLines(){
  const lines = [];
  DATA.forEach(cat=>{
    const rows = document.querySelectorAll(`#course_rows_${cat.id} .rowline`);
    rows.forEach(r=>{
      const item = r.querySelector(".c_item").value;
      const custom = r.querySelector(".c_custom").value;
      const qty = r.querySelector(".c_qty").value;

      const name = (normalizeName(item).startsWith("autre") ? custom : item);
      const finalName = (name || "").trim();
      const finalQty = (qty || "").trim();

      if(finalName || finalQty){
        lines.push({cat: cat.title, emoji: cat.emoji, name: finalName || "—", qty: finalQty || ""});
      }
    });
  });
  return lines;
}

function updateCourseSummary(){
  const nom = ($("c_nom").value || "").trim();
  const date = $("c_date").value || todayISO();
  const note = ($("c_note").value || "").trim();

  const lines = getCourseLines();

  const grouped = new Map();
  lines.forEach(x=>{
    const key = `${x.emoji} ${x.cat}`;
    if(!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(`- ${x.name}${x.qty ? " : " + x.qty : ""}`);
  });

  let txt = `COURSE À FAIRE\n`;
  if(nom) txt += `Pour: ${nom}\n`;
  txt += `Date: ${formatFR(date)}\n\n`;

  if(grouped.size === 0){
    txt += `(aucun article)\n`;
  }else{
    grouped.forEach((arr, k)=>{
      txt += `${k}\n${arr.join("\n")}\n\n`;
    });
  }

  if(note) txt += `Remarque: ${note}\n`;

  $("courseSummary").value = txt.trim();
}

/* ======================
   ROWS (ACHAT)
====================== */

function achatSelectHTML(catId){
  const cat = DATA.find(x=>x.id === catId);
  const opts = cat.items.map(v=>`<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  return `
    <select class="a_item" data-cat="${catId}">
      <option value="" selected>Choisir…</option>
      ${opts}
    </select>
  `;
}

function addAchatRow(catId){
  const rows = $(`achat_rows_${catId}`);
  const line = document.createElement("div");
  line.className = "rowline";

  line.innerHTML = `
    <div class="left">
      <div class="stack2">
        <label class="small" style="display:flex;gap:8px;align-items:center;margin:0;">
          <input class="a_check" type="checkbox" style="width:auto;transform:scale(1.15);"/>
          <span>Acheté</span>
        </label>
        <div></div>
      </div>
      ${achatSelectHTML(catId)}
      <input class="a_custom hidden_custom" type="text" placeholder="Autre (nom article)..." />
    </div>
    <div class="right">
      <input class="a_price" type="text" inputmode="decimal" placeholder="Prix DH (optionnel)" />
    </div>
  `;

  rows.appendChild(line);

  const sel = line.querySelector(".a_item");
  const custom = line.querySelector(".a_custom");
  const check = line.querySelector(".a_check");
  const price = line.querySelector(".a_price");

  sel.addEventListener("change", ()=>{
    const v = sel.value;
    if(v && normalizeName(v).startsWith("autre")){
      custom.classList.remove("hidden_custom");
      custom.focus();
    }else{
      custom.classList.add("hidden_custom");
      custom.value = "";
    }
    updateAchatSummary();
  });

  custom.addEventListener("input", updateAchatSummary);
  check.addEventListener("change", updateAchatSummary);
  price.addEventListener("input", updateAchatSummary);
}

function getAchatLines(){
  const lines = [];
  DATA.forEach(cat=>{
    const rows = document.querySelectorAll(`#achat_rows_${cat.id} .rowline`);
    rows.forEach(r=>{
      const checked = r.querySelector(".a_check").checked;
      const item = r.querySelector(".a_item").value;
      const custom = r.querySelector(".a_custom").value;
      const priceRaw = r.querySelector(".a_price").value;

      const name = (normalizeName(item).startsWith("autre") ? custom : item);
      const finalName = (name || "").trim();

      const price = parseMoney(priceRaw);

      if(finalName || priceRaw || checked){
        lines.push({
          cat: cat.title,
          emoji: cat.emoji,
          name: finalName || "—",
          checked,
          price
        });
      }
    });
  });
  return lines;
}

function updateAchatSummary(){
  const date = $("a_date").value || todayISO();
  const lines = getAchatLines();

  const bought = lines.filter(x=>x.checked && x.name && x.name !== "—");
  const total = bought.reduce((s,x)=> s + (x.price || 0), 0);
  $("achatTotal").textContent = formatMoney(total);

  // Liste demandée (texte collé)
  const requested = parseRequestedList($("listeRecue").value);

  // Calcul "manquant"
  const boughtSet = new Set(bought.map(x=> normalizeName(x.name)));
  const missing = requested.filter(r=> !boughtSet.has(normalizeName(r.name)));

  // Texte
  let txt = `ACHAT\nDate: ${formatFR(date)}\n\n`;

  txt += `ACHETÉ:\n`;
  if(bought.length === 0){
    txt += `- (rien coché)\n`;
  }else{
    bought.forEach(x=>{
      txt += `- ${x.name}${x.price ? " : " + formatMoney(x.price) + " DH" : ""}\n`;
    });
  }

  txt += `\nTOTAL: ${formatMoney(total)} DH\n\n`;

  txt += `DEMANDÉ (liste reçue):\n`;
  if(requested.length === 0){
    txt += `- (vide)\n`;
  }else{
    requested.forEach(r=>{
      txt += `- ${r.name}${r.qty ? " : " + r.qty : ""}\n`;
    });
  }

  txt += `\nMANQUANT:\n`;
  if(missing.length === 0){
    txt += `- (rien)\n`;
  }else{
    missing.forEach(r=>{
      txt += `- ${r.name}${r.qty ? " : " + r.qty : ""}\n`;
    });
  }

  $("achatSummary").value = txt.trim();
  renderHistory();
}

/* ======================
   PARSE "LISTE REÇUE"
====================== */

function parseRequestedList(text){
  const lines = (text || "")
    .split(/\r?\n/)
    .map(s=>s.trim())
    .filter(Boolean);

  const out = [];
  lines.forEach(l=>{
    // Accept "Produit : quantité" ou "- Produit : quantité"
    l = l.replace(/^[\-•\*]\s*/,"");
    const parts = l.split(":");
    if(parts.length >= 2){
      const name = parts[0].trim();
      const qty = parts.slice(1).join(":").trim();
      if(name) out.push({name, qty});
    }else{
      // si pas de ":" on garde le nom
      out.push({name:l, qty:""});
    }
  });
  return out;
}

function autoFillFromRequested(){
  const requested = parseRequestedList($("listeRecue").value);
  if(requested.length === 0) return;

  // On remplit les premières lignes disponibles par catégorie, et on ajoute si besoin
  requested.forEach(req=>{
    const n = normalizeName(req.name);

    // trouver la catégorie la plus probable
    let bestCat = null;
    let bestScore = -1;
    DATA.forEach(cat=>{
      cat.items.forEach(it=>{
        const itn = normalizeName(it.replace("…",""));
        if(itn && n && (n === itn || n.includes(itn) || itn.includes(n))){
          bestCat = cat.id;
          bestScore = 10;
        }
      });
    });

    // si pas trouvé, on met dans épicerie par défaut
    if(!bestCat) bestCat = "epicerie";

    const rows = document.querySelectorAll(`#achat_rows_${bestCat} .rowline`);
    let targetRow = null;

    // trouver une ligne vide
    rows.forEach(r=>{
      if(targetRow) return;
      const item = r.querySelector(".a_item").value;
      const custom = r.querySelector(".a_custom").value;
      const name = normalizeName(item).startsWith("autre") ? custom : item;
      const checked = r.querySelector(".a_check").checked;
      const price = r.querySelector(".a_price").value;
      if(!item && !name && !checked && !price) targetRow = r;
    });

    // si aucune ligne vide -> ajouter une ligne
    if(!targetRow){
      addAchatRow(bestCat);
      targetRow = document.querySelector(`#achat_rows_${bestCat} .rowline:last-child`);
    }

    // on met en "Autre…" + nom
    const sel = targetRow.querySelector(".a_item");
    sel.value = "Autre…";
    sel.dispatchEvent(new Event("change"));

    const custom = targetRow.querySelector(".a_custom");
    custom.value = req.name;

    // on ne coche pas automatiquement
  });

  updateAchatSummary();
}

/* ======================
   HISTORY (ACHAT)
====================== */

function saveAchatToHistory(){
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  const entry = {
    date: $("a_date").value || todayISO(),
    total: $("achatTotal").textContent,
    summary: $("achatSummary").value,
    createdAt: Date.now()
  };

  history.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory(){
  const container = $("achatHistory");
  if(!container) return;

  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  container.innerHTML = "";

  if(history.length === 0){
    container.innerHTML = `<div class="small">Aucun historique</div>`;
    return;
  }

  history.slice(0, 30).forEach((item, idx)=>{
    const div = document.createElement("div");
    div.className = "hrow";
    div.innerHTML = `
      <div class="meta">
        <strong>${escapeHtml(formatFR(item.date))}</strong>
        <span>Total: ${escapeHtml(item.total)} DH</span>
      </div>
      <div class="hactions">
        <button class="btn mini" type="button" data-hview="${idx}">Voir</button>
        <button class="btn mini danger" type="button" data-hdel="${idx}">Supprimer</button>
      </div>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll("[data-hview]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const idx = Number(b.getAttribute("data-hview"));
      viewHistory(idx);
    });
  });

  container.querySelectorAll("[data-hdel]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const idx = Number(b.getAttribute("data-hdel"));
      deleteHistory(idx);
    });
  });
}

function viewHistory(index){
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const item = history[index];
  if(item){
    $("a_date").value = item.date || todayISO();
    $("achatSummary").value = item.summary || "";
    // total affiché déjà dans summary, on laisse auto recalcul selon cases (ici history = texte)
  }
}

function deleteHistory(index){
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  history.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
}

/* ======================
   WHATSAPP + CLIPBOARD + PDF
====================== */

function copyToClipboard(text){
  navigator.clipboard.writeText(text || "").catch(()=>{});
}

function openWhatsApp(text){
  const msg = encodeURIComponent(text || "");
  const url = `https://wa.me/?text=${msg}`;
  window.open(url, "_blank");
}

// PDF simple (sans librairie) -> impression en PDF
function downloadPDF(text, filename){
  const w = window.open("", "_blank");
  if(!w) return;

  const safe = (text || "").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  w.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        <style>
          body{ font-family: Arial, sans-serif; padding:24px; }
          pre{ white-space: pre-wrap; font-size: 13px; line-height: 1.35; }
        </style>
      </head>
      <body>
        <h2>${filename}</h2>
        <pre>${safe}</pre>
        <script>
          setTimeout(()=>{ window.print(); }, 400);
        </script>
      </body>
    </html>
  `);
  w.document.close();
}

/* ======================
   HELPERS
====================== */

function parseMoney(raw){
  if(!raw) return 0;
  // accepte "12", "12.5", "12,5", "12 dh"
  const cleaned = raw.toString().toLowerCase().replace(/dh/g,"").replace(/\s/g,"").replace(",",".");
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

function formatMoney(n){
  const v = Math.round((n || 0) * 100) / 100;
  return v.toString().replace(".00","").replace(".", ",");
}

function formatFR(iso){
  // iso yyyy-mm-dd
  if(!iso || !iso.includes("-")) return iso || "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function escapeHtml(s){
  return (s||"").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

/* ======================
   INIT
====================== */

function init(){
  // defaults dates
  $("c_date").value = todayISO();
  $("a_date").value = todayISO();

  // build UIs
  buildCourseUI();
  buildAchatUI();

  // tabs
  $("tabCourse").addEventListener("click", ()=> setTab("course"));
  $("tabAchat").addEventListener("click", ()=> setTab("achat"));

  // course events
  $("c_nom").addEventListener("input", updateCourseSummary);
  $("c_date").addEventListener("change", updateCourseSummary);
  $("c_note").addEventListener("input", updateCourseSummary);

  $("btnCourseCopy").addEventListener("click", ()=>{
    updateCourseSummary();
    copyToClipboard($("courseSummary").value);
  });
  $("btnCourseWA").addEventListener("click", ()=>{
    updateCourseSummary();
    openWhatsApp($("courseSummary").value);
  });

  // achat events
  $("a_date").addEventListener("change", updateAchatSummary);
  $("listeRecue").addEventListener("input", ()=>{ /* pas auto */ });

  $("btnParse").addEventListener("click", autoFillFromRequested);

  $("btnAchatCopy").addEventListener("click", ()=>{
    updateAchatSummary();
    copyToClipboard($("achatSummary").value);
  });

  $("btnAchatPDF").addEventListener("click", ()=>{
    updateAchatSummary();
    saveAchatToHistory();
    const date = $("a_date").value || todayISO();
    downloadPDF($("achatSummary").value, `Achat_${date}`);
  });

  // initial summaries
  updateCourseSummary();
  updateAchatSummary();
  renderHistory();
}

document.addEventListener("DOMContentLoaded", init);

/* CSS helper class toggle */
document.addEventListener("DOMContentLoaded", ()=>{
  // add hidden_custom style by class (kept here for simplicity)
  const style = document.createElement("style");
  style.textContent = `.hidden_custom{ display:none; }`;
  document.head.appendChild(style);
});
