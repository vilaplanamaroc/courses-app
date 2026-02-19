// ====== CONFIG ======
const CATEGORIES = [
  { key: "viandes", icon: "🥩", title: "Viandes", items: ["Poulet","Viande hachée","Steak","Kefta","Agneau","Dinde","Poisson","Sardines","Autre…"] },
  { key: "legumes", icon: "🥬", title: "Légumes", items: ["Tomates","Oignons","Pommes de terre","Carottes","Courgettes","Poivrons","Aubergines","Salade","Autre…"] },
  { key: "fruits",  icon: "🍎", title: "Fruits", items: ["Pommes","Bananes","Oranges","Fraises","Avocats","Raisins","Pastèque","Autre…"] },
  { key: "epicerie",icon: "🧂", title: "Épicerie", items: ["Huile","Sucre","Sel","Farine","Riz","Pâtes","Thé","Café","Autre…"] },
  { key: "laitiers",icon: "🥛", title: "Laitiers", items: ["Lait","Yaourt","Fromage","Beurre","Crème","Autre…"] },
  { key: "boulangerie",icon:"🥖", title: "Boulangerie", items: ["Pain","Batbout","Msemen","Harcha","Brioche","Autre…"] }
];

// ====== HELPERS ======
const $ = (id) => document.getElementById(id);

function todayISO(){
  const d = new Date();
  const pad = (n) => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function setBackground(mode){
  const app = document.querySelector(".app");
  const header = $("headerImg");
  if(mode === "course"){
    app.style.backgroundImage = `url("bg-course.jpg")`;
    header.src = "header-course.png";
  }else{
    app.style.backgroundImage = `url("bg-achat.jpg")`;
    header.src = "header-achat.png";
  }
}

function escapeText(s){
  return (s || "").toString().replace(/\s+/g," ").trim();
}

function makeSelectOptions(items){
  return items.map(v => `<option value="${v}">${v}</option>`).join("");
}

// ====== UI BUILD ======
function buildCourse(){
  const root = $("courseCategories");
  root.innerHTML = "";

  CATEGORIES.forEach(cat => {
    const wrap = document.createElement("div");
    wrap.className = "category";
    wrap.innerHTML = `
      <div class="category-title">${cat.icon} ${cat.title}</div>
      <div class="card glass">
        <div class="rows" id="course_rows_${cat.key}"></div>
        <div class="row-actions">
          <button class="btn-mini" type="button" data-add="${cat.key}">+ Ajouter</button>
        </div>
        <div class="small">Astuce : choisis “Autre…” pour écrire un article libre.</div>
      </div>
    `;
    root.appendChild(wrap);

    // 1ère ligne par défaut
    addCourseRow(cat.key);
  });

  root.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", () => addCourseRow(btn.dataset.add));
  });
}

function buildAchat(){
  const root = $("achatCategories");
  root.innerHTML = "";

  CATEGORIES.forEach(cat => {
    const wrap = document.createElement("div");
    wrap.className = "category";
    wrap.innerHTML = `
      <div class="category-title">${cat.icon} ${cat.title}</div>
      <div class="card glass">
        <div class="rows" id="achat_rows_${cat.key}"></div>
        <div class="row-actions">
          <button class="btn-mini" type="button" data-add-achat="${cat.key}">+ Ajouter</button>
        </div>
        <div class="small">Coche si acheté, prix optionnel (DH).</div>
      </div>
    `;
    root.appendChild(wrap);

    addAchatRow(cat.key);
  });

  root.querySelectorAll("[data-add-achat]").forEach(btn=>{
    btn.addEventListener("click", () => addAchatRow(btn.dataset.addAchat));
  });
}

function addCourseRow(catKey){
  const cat = CATEGORIES.find(c=>c.key===catKey);
  const rows = $(`course_rows_${catKey}`);
  const rowId = `${catKey}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const div = document.createElement("div");
  div.className = "item-row";
  div.dataset.rowid = rowId;

  div.innerHTML = `
    <div class="row-left">
      <select class="courseSelect">
        <option value="">Choisir…</option>
        ${makeSelectOptions(cat.items)}
      </select>
      <input class="courseOther hidden" type="text" placeholder="Autre (écrire ici)"/>
    </div>
    <div class="row-left">
      <input class="courseQty" type="text" placeholder="Quantité (libre)"/>
      <button class="btn-mini" type="button" title="Supprimer">🗑️</button>
    </div>
  `;

  const sel = div.querySelector(".courseSelect");
  const other = div.querySelector(".courseOther");
  const del = div.querySelector("button");

  sel.addEventListener("change", ()=>{
    if(sel.value === "Autre…"){
      other.classList.remove("hidden");
      other.focus();
    }else{
      other.classList.add("hidden");
      other.value = "";
    }
    updateCourseSummary();
  });

  div.querySelector(".courseQty").addEventListener("input", updateCourseSummary);
  other.addEventListener("input", updateCourseSummary);

  del.addEventListener("click", ()=>{
    div.remove();
    updateCourseSummary();
  });

  rows.appendChild(div);
  updateCourseSummary();
}

function addAchatRow(catKey){
  const cat = CATEGORIES.find(c=>c.key===catKey);
  const rows = $(`achat_rows_${catKey}`);
  const rowId = `${catKey}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const div = document.createElement("div");
  div.className = "achat-row";
  div.dataset.rowid = rowId;

  div.innerHTML = `
    <input class="achatDone" type="checkbox" />
    <div class="row-left">
      <select class="achatSelect">
        <option value="">Choisir…</option>
        ${makeSelectOptions(cat.items)}
      </select>
      <input class="achatOther hidden" type="text" placeholder="Autre (écrire ici)"/>
    </div>
    <div class="row-left">
      <input class="achatPrice" type="text" inputmode="decimal" placeholder="Prix DH (optionnel)"/>
      <button class="btn-mini" type="button" title="Supprimer">🗑️</button>
    </div>
  `;

  const sel = div.querySelector(".achatSelect");
  const other = div.querySelector(".achatOther");
  const done = div.querySelector(".achatDone");
  const price = div.querySelector(".achatPrice");
  const del = div.querySelector("button");

  sel.addEventListener("change", ()=>{
    if(sel.value === "Autre…"){
      other.classList.remove("hidden");
      other.focus();
    }else{
      other.classList.add("hidden");
      other.value = "";
    }
    updateAchatSummary();
  });

  other.addEventListener("input", updateAchatSummary);
  done.addEventListener("change", updateAchatSummary);
  price.addEventListener("input", updateAchatSummary);

  del.addEventListener("click", ()=>{
    div.remove();
    updateAchatSummary();
  });

  rows.appendChild(div);
  updateAchatSummary();
}

// ====== SUMMARY ======
function updateCourseSummary(){
  const name = escapeText($("courseName").value);
  const date = $("courseDate").value || "";
  const lines = [];

  if(name || date){
    lines.push(`COURSES${date ? " • " + date : ""}${name ? " • " + name : ""}`);
    lines.push("—");
  }

  CATEGORIES.forEach(cat=>{
    const rows = document.querySelectorAll(`#course_rows_${cat.key} .item-row`);
    const items = [];

    rows.forEach(r=>{
      const sel = r.querySelector(".courseSelect").value;
      const qty = escapeText(r.querySelector(".courseQty").value);
      const oth = escapeText(r.querySelector(".courseOther").value);

      let label = "";
      if(sel === "Autre…") label = oth;
      else label = sel;

      label = escapeText(label);

      if(label){
        items.push(`${label}${qty ? " : " + qty : ""}`);
      }
    });

    if(items.length){
      lines.push(`${cat.icon} ${cat.title}`);
      items.forEach(i=>lines.push(`- ${i}`));
      lines.push("");
    }
  });

  $("courseSummary").value = lines.join("\n").trim();
}

function parseDH(v){
  const s = (v||"").toString().replace(",", ".").replace(/[^\d.]/g,"").trim();
  if(!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function updateAchatSummary(){
  const date = $("achatDate").value || "";
  const received = $("pasteList").value.trim();
  const bought = [];
  const missing = [];
  let total = 0;

  CATEGORIES.forEach(cat=>{
    const rows = document.querySelectorAll(`#achat_rows_${cat.key} .achat-row`);
    rows.forEach(r=>{
      const sel = r.querySelector(".achatSelect").value;
      const oth = escapeText(r.querySelector(".achatOther").value);
      const done = r.querySelector(".achatDone").checked;
      const price = parseDH(r.querySelector(".achatPrice").value);

      let label = "";
      if(sel === "Autre…") label = oth;
      else label = sel;
      label = escapeText(label);

      if(!label) return;

      if(done){
        bought.push({cat, label, price});
        total += price;
      }else{
        missing.push({cat, label});
      }
    });
  });

  $("achatTotal").textContent = Math.round(total * 100) / 100;

  const lines = [];
  lines.push(`ACHAT${date ? " • " + date : ""}`);
  lines.push("—");

  if(received){
    lines.push("Liste reçue (copiée) :");
    lines.push(received);
    lines.push("");
  }

  lines.push("✅ Acheté :");
  if(!bought.length) lines.push("- (vide)");
  else bought.forEach(x=>{
    lines.push(`- ${x.cat.icon} ${x.label}${x.price ? " : " + x.price + " DH" : ""}`);
  });

  lines.push("");
  lines.push("⏳ Manquant / non coché :");
  if(!missing.length) lines.push("- (rien)");
  else missing.forEach(x=>{
    lines.push(`- ${x.cat.icon} ${x.label}`);
  });

  lines.push("");
  lines.push(`TOTAL : ${Math.round(total * 100) / 100} DH`);

  $("achatSummary").value = lines.join("\n");
}

// ====== ACTIONS ======
async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    return true;
  }catch(e){
    return false;
  }
}

function whatsappSend(text){
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

function downloadPDF(text, filename){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:"pt", format:"a4" });
  const margin = 40;
  const maxWidth = 515;
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.setFont("courier", "normal");
  doc.setFontSize(11);
  doc.text(lines, margin, margin);
  doc.save(filename);
}

// ====== TABS ======
function showMode(mode){
  const isCourse = mode === "course";
  $("screenCourse").classList.toggle("hidden", !isCourse);
  $("screenAchat").classList.toggle("hidden", isCourse);
  $("tabCourse").classList.toggle("active", isCourse);
  $("tabAchat").classList.toggle("active", !isCourse);
  setBackground(mode);
}

// ====== INIT ======
(function init(){
  // dates par défaut
  $("courseDate").value = todayISO();
  $("achatDate").value = todayISO();

  buildCourse();
  buildAchat();

  // listeners
  $("courseName").addEventListener("input", updateCourseSummary);
  $("courseDate").addEventListener("change", updateCourseSummary);

  $("achatDate").addEventListener("change", updateAchatSummary);
  $("pasteList").addEventListener("input", updateAchatSummary);

  $("tabCourse").addEventListener("click", ()=> showMode("course"));
  $("tabAchat").addEventListener("click", ()=> showMode("achat"));

  $("btnCourseCopy").addEventListener("click", async ()=>{
    updateCourseSummary();
    await copyText($("courseSummary").value);
  });
  $("btnCourseWhats").addEventListener("click", ()=>{
    updateCourseSummary();
    whatsappSend($("courseSummary").value);
  });

  $("btnAchatCopy").addEventListener("click", async ()=>{
    updateAchatSummary();
    await copyText($("achatSummary").value);
  });
  $("btnAchatWhats").addEventListener("click", ()=>{
    updateAchatSummary();
    whatsappSend($("achatSummary").value);
  });
  $("btnAchatPdf").addEventListener("click", ()=>{
    updateAchatSummary();
    const d = $("achatDate").value || todayISO();
    downloadPDF($("achatSummary").value, `achat_${d}.pdf`);
  });

  // première vue
  showMode("course");
  updateCourseSummary();
  updateAchatSummary();
})();
