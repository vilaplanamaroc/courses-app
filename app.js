const categories = {
"🥩 Viandes": ["Poulet","Viande hachée","Steak","Kefta","Agneau","Autre"],
"🥬 Légumes": ["Tomates","Oignons","Pommes de terre","Carottes","Courgettes","Autre"],
"🍎 Fruits": ["Pommes","Bananes","Oranges","Fraises","Avocats","Autre"],
"🥛 Produits laitiers": ["Lait","Yaourt","Fromage","Beurre","Autre"],
"🍞 Boulangerie": ["Pain","Croissant","Baguette","Autre"],
"🛒 Épicerie": ["Huile","Sucre","Farine","Riz","Pâtes","Autre"],
"🧴 Ménager": ["Lessive","Savon","Eau de javel","Autre"]
};

const courseList = document.getElementById("courseList");
const achatList = document.getElementById("achatList");

function buildCourse() {
for (let cat in categories){
let div = document.createElement("div");
div.className="category";
div.innerHTML=`<h3>${cat}</h3>`;

categories[cat].forEach(item=>{
div.innerHTML+=`
<div class="item">
<select>
<option>${item}</option>
</select>
<input placeholder="Quantité">
</div>`;
});
courseList.appendChild(div);
}
}

function buildAchat(){
for (let cat in categories){
let div = document.createElement("div");
div.className="category";
div.innerHTML=`<h3>${cat}</h3>`;

categories[cat].forEach(item=>{
div.innerHTML+=`
<div class="item">
<input type="checkbox">
<label>${item}</label>
<input type="number" placeholder="Prix DH" class="priceInput">
</div>`;
});
achatList.appendChild(div);
}
}

buildCourse();
buildAchat();

document.getElementById("generateList").onclick = ()=>{
let text="Liste de courses :\n\n";
document.querySelectorAll("#courseSection .item").forEach(row=>{
let select=row.querySelector("select").value;
let qty=row.querySelector("input").value;
if(qty) text+=select+" : "+qty+"\n";
});
window.open("https://wa.me/?text="+encodeURIComponent(text));
};

document.querySelectorAll(".priceInput").forEach(input=>{
input.addEventListener("input",calculateTotal);
});

function calculateTotal(){
let total=0;
document.querySelectorAll(".priceInput").forEach(input=>{
let val=parseFloat(input.value);
if(!isNaN(val)) total+=val;
});
document.getElementById("totalAmount").innerText=total;
}

document.getElementById("tabCourse").onclick=()=>{
document.getElementById("courseSection").classList.add("active");
document.getElementById("achatSection").classList.remove("active");
document.getElementById("tabCourse").classList.add("active");
document.getElementById("tabAchat").classList.remove("active");
};

document.getElementById("tabAchat").onclick=()=>{
document.getElementById("achatSection").classList.add("active");
document.getElementById("courseSection").classList.remove("active");
document.getElementById("tabAchat").classList.add("active");
document.getElementById("tabCourse").classList.remove("active");
};

document.getElementById("finaliserAchat").onclick=()=>{
let total=document.getElementById("totalAmount").innerText;
alert("Total payé : "+total+" DH");
};
