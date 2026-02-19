/* =========================
   CONFIG IMAGES (NOMS)
   =========================
   Dans ton repo GitHub, mets ces fichiers (dans la racine) :
   - bg.jpg       (fond général si tu veux l’utiliser plus tard)
   - course.jpg   (image en haut onglet Course à faire)
   - achat.jpg    (image en haut onglet Achat)
   Tu peux garder seulement course.jpg et achat.jpg si tu veux.
*/

const IMAGES = {
  todoHero: "course.jpg",
  buyHero: "achat.jpg"
};

/* =========================
   LISTES (MODIFIABLES)
   ========================= */
const CATEGORIES = [
  { key:"viandes",  icon:"🥩", title:"Viandes", items:["Poulet","Viande hachée","Steak","Kefta","Agneau","Dinde","Poisson","Sardines","Autre..."] },
  { key:"legumes",  icon:"🥬", title:"Légumes", items:["Tomates","Oignons","Pommes de terre","Carottes","Courgettes","Poivrons","Aubergines","Salade","Autre..."] },
  { key:"fruits",   icon:"🍎", title:"Fruits", items:["Pommes","Bananes","Oranges","Fraises","Raisins","Avocat","Pastèque","Autre..."] },
  { key:"epicerie", icon:"🧂", title:"Épicerie", items:["Huile","Farine","Sucre","Sel","Pâtes","Riz","Lentilles","Conserves","Autre..."] },
  { key:"laitier",  icon:"🥛", title:"Laitier", items:["Lait","Yaourt","Fromage","Beurre","Crème","Autre..."] },
  { key:"boul",     icon:"🥖", title:"Boulangerie", items:["Pain","Msemen","Harcha","Croissants","Autre..."] },
  { key:"menage",   icon:"🧼", title:"Ménage", items:["Eau de javel","Liquide vaisselle","Lessive","Papier toilette","Sacs poubelle","Autre..."] }
];

const LS_KEY = "COURSES_APP_V1";

/* =========================
   STATE
   ========================= */
let state = loadState();

/* =========================
   INIT
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  // tabs
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // set hero
  setHero("todo");

  // date defaults
  const today = new Date().toISOString().slice(0,10);
  if (!state.todo.date) state.todo.date = today;
  if (!state.buy.date)  state.buy.date  = today;

  // fill top fields
  $("#todo_name").value = state.todo.name || "";
  $("#todo_date").value = state.todo.date || "";
  $("#buy_date").value  = state.buy.date  || "";
  $("#buy_received").value = state.buy.received || "";

  // listeners for top fields
  $("#todo_name").addEventListener("input", e => { state.todo.name = e.target.value; saveState(); });
  $("#todo_date").addEventListener("change", e => { state.todo.date = e.target.value; saveState(); });

  $("#buy_date").addEventListener("change", e => { state.buy.date = e.target.value; saveState(); });
  $("#buy_received").addEventListener("input", e => { state.buy.received = e.target.value; saveState(); });

  $("#btnTodoCopy").addEventListener("click", () => copyText(buildTodoText()));
  $("#btnTodoWhats").addEventListener("click", () => sendWhatsApp(buildTodoText()));

  $("#btnBuyCopy").addEventListener("click", () => copyText(buildBuyText()));
  $("#btnBuyWhats").addEventListener("click", () => sendWhatsApp(buildBuyText()));
  $("#btnBuyClear").addEventListener("click", () => {
    if (!confirm("Réinitialiser l’onglet Achat ?")) return;
    state.buy.linesByCat = {};
    state.buy.received = "";
    $("#buy_received").value = "";
    saveState();
    renderBuy();
    updateTotal();
    setStatus("buyStatus", "Réinitialisé.");
  });

  // render
  renderTodo();
  renderBuy();
  updateTotal();
});

/* =========================
   TABS
   ========================= */
function switchTab(tab) {
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tabpane").forEach(p => p.classList.remove("active"));
  document.querySelector(`#tab-${tab}`).classList.add("active");
  setHero(tab);
}

function setHero(tab){
  const img = $("#heroImg");
  img.src = tab === "buy" ? IMAGES.buyHero : IMAGES.todoHero;
}

/* =========================
   RENDER TODO
   ========================= */
function renderTodo(){
  const root = $("#todoCategories");
  root.innerHTML = "";

  CATEGORIES.forEach(cat => {
    const box = document.createElement("div");
    box.className = "cat";
    box.innerHTML = `<h3>${cat.icon} ${cat.title}</h3><div class="lines" id="todo_${cat.key}"></div>`;

    const btnRow = document.createElement("div");
    btnRow.className = "badgeRow";
    const addBtn = document.createElement("button");
    addBtn.className = "btn small";
    addBtn.textContent = "+ Ajouter";
    addBtn.addEventListener("click", () => {
      addTodoLine(cat.key);
      renderTodo(); // refresh
    });
    btnRow.appendChild(addBtn);
    box.appendChild(btnRow);

    root.appendChild(box);

    // lines
    const lines = getTodoLines(cat.key);
    const linesWrap = box.querySelector(`#todo_${cat.key}`);
    linesWrap.innerHTML = "";
    lines.forEach((ln, idx) => {
      linesWrap.appendChild(makeTodoLine(cat, idx, ln));
    });
  });
}

function makeTodoLine(cat, idx, ln){
  const row = document.createElement("div");
  row.className = "line";

  const left = document.createElement("div");
  left.className = "selectWrap";

  // select
  const sel = document.createElement("select");
  cat.items.forEach(it => {
    const op = document.createElement("option");
    op.value = it;
    op.textContent = it;
    sel.appendChild(op);
  });
  sel.value = ln.item || cat.items[0];

  // custom item input
  const custom = document.createElement("input");
  custom.type = "text";
  custom.placeholder = "Autre (écrire ici)";
  custom.style.display = (sel.value === "Autre...") ? "block" : "none";
  custom.value = ln.custom || "";

  sel.addEventListener("change", () => {
    ln.item = sel.value;
    if (sel.value === "Autre...") {
      custom.style.display = "block";
      custom.focus();
    } else {
      custom.style.display = "none";
      ln.custom = "";
      custom.value = "";
    }
    saveState();
  });

  custom.addEventListener("input", () => {
    ln.custom = custom.value;
    saveState();
  });

  left.appendChild(sel);
  left.appendChild(custom);

  // right: quantity + delete
  const right = document.createElement("div");
  right.className = "right";

  const qty = document.createElement("input");
  qty.type = "text";
  qty.placeholder = "Quantité (ex: 2kg / 1 / 1/2)";
  qty.value = ln.qty || "";
  qty.addEventListener("input", () => { ln.qty = qty.value; saveState(); });

  const del = document.createElement("button");
  del.className = "btn ghost small";
  del.textContent = "Supprimer";
  del.addEventListener("click", () => {
    removeTodoLine(cat.key, idx);
    renderTodo();
  });

  right.appendChild(qty);
  right.appendChild(del);

  row.appendChild(left);
  row.appendChild(right);
  return row;
}

/* =========================
   RENDER BUY
   ========================= */
function renderBuy(){
  const root = $("#buyCategories");
  root.innerHTML = "";

  CATEGORIES.forEach(cat => {
    const box = document.createElement("div");
    box.className = "cat";
    box.innerHTML = `<h3>${cat.icon} ${cat.title}</h3><div class="lines" id="buy_${cat.key}"></div>`;

    const btnRow = document.createElement("div");
    btnRow.className = "badgeRow";
    const addBtn = document.createElement("button");
    addBtn.className = "btn small";
    addBtn.textContent = "+ Ajouter";
    addBtn.addEventListener("click", () => {
      addBuyLine(cat.key);
      renderBuy();
      updateTotal();
    });
    btnRow.appendChild(addBtn);
    box.appendChild(btnRow);

    root.appendChild(box);

    // lines
    const lines = getBuyLines(cat.key);
    const wrap = box.querySelector(`#buy_${cat.key}`);
    wrap.innerHTML = "";
    lines.forEach((ln, idx) => {
      wrap.appendChild(makeBuyLine(cat, idx, ln));
    });
  });
}

function makeBuyLine(cat, idx, ln){
  const row = document.createElement("div");
  row.className = "buyLine";

  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = !!ln.done;
  chk.addEventListener("change", () => { ln.done = chk.checked; saveState(); });

  const left = document.createElement("div");
  left.className = "selectWrap";

  const sel = document.createElement("select");
  cat.items.forEach(it => {
    const op = document.createElement("option");
    op.value = it;
    op.textContent = it;
    sel.appendChild(op);
  });
  sel.value = ln.item || cat.items[0];

  const custom = document.createElement("input");
  custom.type = "text";
  custom.placeholder = "Autre (écrire ici)";
  custom.style.display = (sel.value === "Autre...") ? "block" : "none";
  custom.value = ln.custom || "";

  sel.addEventListener("change", () => {
    ln.item = sel.value;
    if (sel.value === "Autre...") {
      custom.style.display = "block";
      custom.focus();
    } else {
      custom.style.display = "none";
      ln.custom = "";
      custom.value = "";
    }
    saveState();
  });

  custom.addEventListener("input", () => {
    ln.custom = custom.value;
    saveState();
  });

  left.appendChild(sel);
  left.appendChild(custom);

  const right = document.createElement("div");
  right.className = "right";

  const price = document.createElement("input");
  price.type = "number";
  price.placeholder = "Prix DH (optionnel)";
  price.value = (ln.price ?? "");
  price.addEventListener("input", () => {
    const v = price.value.trim();
    ln.price = v === "" ? "" : Number(v);
    saveState();
    updateTotal();
  });

  const del = document.createElement("button");
  del.className = "btn ghost small";
  del.textContent = "Supprimer";
  del.addEventListener("click", () => {
    removeBuyLine(cat.key, idx);
    renderBuy();
    updateTotal();
  });

  right.appendChild(price);
  right.appendChild(del);

  row.appendChild(chk);
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

/* =========================
   BUILD TEXT (WhatsApp)
   ========================= */
function buildTodoText(){
  const name = (state.todo.name || "").trim();
  const date = state.todo.date || "";
  const head = [
    "🧾 LISTE DE COURSES",
    name ? `Demandeur : ${name}` : null,
    date ? `Date : ${formatDateFR(date)}` : null,
    "--------------------"
  ].filter(Boolean).join("\n");

  const lines = [];
  CATEGORIES.forEach(cat => {
    const arr = getTodoLines(cat.key)
      .map(ln => {
        const item = finalItem(ln);
        const qty = (ln.qty || "").trim();
        if (!item) return null;
        if (!qty) return `• ${item}`;
        return `• ${item} : ${qty}`;
      })
      .filter(Boolean);

    if (arr.length){
      lines.push(`\n${cat.icon} ${cat.title}`);
      lines.push(...arr);
    }
  });

  if (!lines.length) lines.push("\n(Aucun article)");
  return head + "\n" + lines.join("\n");
}

function buildBuyText(){
  const date = state.buy.date || "";
  const received = (state.buy.received || "").trim();

  const head = [
    "🛒 ACHAT",
    date ? `Date : ${formatDateFR(date)}` : null,
    "--------------------"
  ].filter(Boolean).join("\n");

  const bought = [];
  CATEGORIES.forEach(cat => {
    const arr = getBuyLines(cat.key)
      .filter(ln => !!ln.done)
      .map(ln => {
        const item = finalItem(ln);
        if (!item) return null;
        const p = (ln.price === "" || ln.price == null) ? "" : ` — ${ln.price} DH`;
        return `• ${item}${p}`;
      })
      .filter(Boolean);

    if (arr.length){
      bought.push(`\n${cat.icon} ${cat.title}`);
      bought.push(...arr);
    }
  });

  const total = computeTotal();
  const totalLine = `\nTotal estimé : ${total} DH`;

  // "Demandé vs acheté" (simple, basé sur texte collé)
  let missingBlock = "";
  if (received){
    const demanded = parseReceivedList(received);
    const purchasedSet = new Set(getAllPurchasedNames());
    const missing = demanded.filter(x => !purchasedSet.has(x.name.toLowerCase()));
    if (missing.length){
      missingBlock = "\n\n📌 Restant (d’après la liste reçue)\n" + missing.map(x => `• ${x.raw}`).join("\n");
    }
  }

  if (!bought.length) bought.push("\n(Aucun article coché)");

  return head + "\n" + bought.join("\n") + totalLine + missingBlock;
}

/* =========================
   WhatsApp + Copy
   ========================= */
function sendWhatsApp(text){
  const url = "https://wa.me/?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    setStatus(activeTab() === "buy" ? "buyStatus" : "todoStatus", "Copié.");
  }catch(e){
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    setStatus(activeTab() === "buy" ? "buyStatus" : "todoStatus", "Copié.");
  }
}

function setStatus(id, msg){
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  setTimeout(() => { el.textContent = ""; }, 2200);
}

function activeTab(){
  return document.querySelector(".tab.active")?.dataset?.tab || "todo";
}

/* =========================
   TOTAL
   ========================= */
function computeTotal(){
  let sum = 0;
  CATEGORIES.forEach(cat => {
    getBuyLines(cat.key).forEach(ln => {
      const v = ln.price;
      if (typeof v === "number" && !Number.isNaN(v)) sum += v;
    });
  });
  return Math.round(sum * 100) / 100;
}

function updateTotal(){
  const total = computeTotal();
  $("#buy_total").textContent = String(total);
}

function getAllPurchasedNames(){
  const list = [];
  CATEGORIES.forEach(cat => {
    getBuyLines(cat.key).forEach(ln => {
      if (!ln.done) return;
      const item = finalItem(ln);
      if (item) list.push(item.toLowerCase());
    });
  });
  return list;
}

/* =========================
   RECEIVED LIST PARSER (simple)
   ========================= */
function parseReceivedList(txt){
  const lines = txt.split("\n").map(l => l.trim()).filter(Boolean);
  const out = [];
  for (const l of lines){
    // accepte formats: "• Lait : 3L" ou "Lait : 3L" ou "Lait"
    const clean = l.replace(/^[-•]\s*/,"");
    const parts = clean.split(":").map(x => x.trim());
    const name = (parts[0] || "").trim();
    if (!name) continue;
    out.push({ name, raw: clean });
  }
  return out;
}

/* =========================
   LINES CRUD (TODO)
   ========================= */
function getTodoLines(catKey){
  if (!state.todo.linesByCat[catKey]) state.todo.linesByCat[catKey] = [];
  // si vide, on met 1 ligne au départ
  if (state.todo.linesByCat[catKey].length === 0) {
    state.todo.linesByCat[catKey].push(makeEmptyLine());
    saveState();
  }
  return state.todo.linesByCat[catKey];
}

function addTodoLine(catKey){
  if (!state.todo.linesByCat[catKey]) state.todo.linesByCat[catKey] = [];
  state.todo.linesByCat[catKey].push(makeEmptyLine());
  saveState();
}

function removeTodoLine(catKey, idx){
  const arr = getTodoLines(catKey);
  arr.splice(idx, 1);
  if (arr.length === 0) arr.push(makeEmptyLine());
  saveState();
}

/* =========================
   LINES CRUD (BUY)
   ========================= */
function getBuyLines(catKey){
  if (!state.buy.linesByCat[catKey]) state.buy.linesByCat[catKey] = [];
  if (state.buy.linesByCat[catKey].length === 0) {
    state.buy.linesByCat[catKey].push(makeEmptyBuyLine());
    saveState();
  }
  return state.buy.linesByCat[catKey];
}

function addBuyLine(catKey){
  if (!state.buy.linesByCat[catKey]) state.buy.linesByCat[catKey] = [];
  state.buy.linesByCat[catKey].push(makeEmptyBuyLine());
  saveState();
}

function removeBuyLine(catKey, idx){
  const arr = getBuyLines(catKey);
  arr.splice(idx, 1);
  if (arr.length === 0) arr.push(makeEmptyBuyLine());
  saveState();
}

/* =========================
   HELPERS
   ========================= */
function makeEmptyLine(){
  return { item:"", custom:"", qty:"" };
}
function makeEmptyBuyLine(){
  return { item:"", custom:"", done:false, price:"" };
}

function finalItem(ln){
  const it = (ln.item || "").trim();
  if (!it) return "";
  if (it === "Autre..."){
    return (ln.custom || "").trim();
  }
  return it;
}

function formatDateFR(iso){
  // iso = YYYY-MM-DD
  try{
    const [y,m,d] = iso.split("-").map(Number);
    const dt = new Date(y, m-1, d);
    return dt.toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });
  }catch(e){
    return iso;
  }
}

function $(q){ return document.querySelector(q); }

/* =========================
   STORAGE
   ========================= */
function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  }catch(e){}
  return {
    todo: { name:"", date:"", linesByCat:{} },
    buy:  { date:"", received:"", linesByCat:{} }
  };
}

function saveState(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }catch(e){}
}
