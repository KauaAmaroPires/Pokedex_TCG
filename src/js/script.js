const coinsDisplay = document.querySelector(".valueCoinTable");
const pokedexContainer = document.querySelector(".index");
const searchInput = document.querySelector(".searchArea");
const counterDisplay = document.querySelector(".indexFrameDown div");
const codeInput = document.querySelector(".typeCodeArea");
const codeRewardText = document.querySelector(".codeTextIcon");
const timerStockDisplay = document.getElementById("timerStock");

const miticalCard = document.querySelector(".miticalCard");
const supremeCard = document.querySelector(".supremeCard");
const miticalCountDisplay = document.getElementById("miticalCount");
const supremeCountDisplay = document.getElementById("supremeCount");

const RESTOCK_COST = 100000;
const PACK_PRICES = { mitical: 1000, supreme: 10000 };
const MAX_CARDS = 10;

const api = "https://pokeapi.co/api/v2/pokemon/";
const maxId = 1025;

let save = JSON.parse(localStorage.getItem("pokedexSave")) || {
	coin: 10000,
	pokemons: [],
	stock: "",
	cards: [MAX_CARDS, MAX_CARDS]
};

const pokedexMap = new Map();

const codes = {
	"FirstCodeDev": 1000000,
	"teste": 1000000
};

document.querySelectorAll(".bar1 a").forEach(link => {
	link.addEventListener("click", e => {
		e.preventDefault();
		const targetId = link.getAttribute("href").substring(1);
		const target = document.querySelector(`.${targetId}`);
		if (target) target.scrollIntoView({ behavior: "smooth" });
	});
});

function getTodayDateStr() {
	const d = new Date();
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

function saveData() {
  	localStorage.setItem("pokedexSave", JSON.stringify(save));
};

function saveMessage(msg) {
  	console.log("[System] - " + msg);
};

function delay(ms) {
  	return new Promise(res => setTimeout(res, ms));
};

function updateCoins() {
  	coinsDisplay.textContent = save.coin.toLocaleString("pt-BR");
};

function updateCardCounts() {
	miticalCountDisplay.textContent = `${save.cards[0]}/${MAX_CARDS}`;
	supremeCountDisplay.textContent = `${save.cards[1]}/${MAX_CARDS}`;
};

function nextMidnightTimestamp() {
	const next = new Date();
	next.setHours(24, 0, 0, 0);
	return next.getTime();
};

function timeUntilMidnight() {
	const diff = nextMidnightTimestamp() - new Date().getTime();
	const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
	const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
	const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");
	return `${h}:${m}:${s}`;
};

function updateTimer() {
  	timerStockDisplay.textContent = timeUntilMidnight();
};

function checkMidnightRestock() {
	const today = getTodayDateStr();
	if (save.stock !== today) {
		save.stock = today;
		save.cards = [MAX_CARDS, MAX_CARDS];
		updateCardCounts();
		saveData();
		saveMessage("✨ Estoque reabastecido automaticamente!");
	};
};

checkMidnightRestock();
updateCoins();
updateCardCounts();
saveData();
updateTimer();

setInterval(updateTimer, 1000);
setInterval(checkMidnightRestock, 60000);

miticalCard.addEventListener("click", () => openPack("mitical"));
supremeCard.addEventListener("click", () => openPack("supreme"));

async function openPack(type) {
	const price = PACK_PRICES[type];
	const cardIndex = type === "mitical" ? 0 : 1;

	if (save.cards[cardIndex] <= 0) {
		alert(`🏪 O estoque de pacotes ${type.toUpperCase()} acabou!`);
		const confirmBuy = confirm(`🏪 Deseja forçar reestoque por ${RESTOCK_COST.toLocaleString("pt-BR")} moedas?`);
		if (confirmBuy) {
			if (save.coin < RESTOCK_COST) {
				alert("❌ Você não tem moedas suficientes!");
				return;
			};
			save.coin -= RESTOCK_COST;
			save.cards = [MAX_CARDS, MAX_CARDS];
			save.stock = getTodayDateStr();
			updateCoins();
			updateCardCounts();
			saveData();
			alert("🌀 Reestoque realizado com sucesso!");
		};
		return;
	};

	if (save.coin < price) {
		alert("❌ Você não tem moedas suficientes!");
		return;
	};

	save.coin -= price;
	save.cards[cardIndex]--;
	updateCoins();
	updateCardCounts();
	saveData();

	const overlay = document.createElement("div");
	overlay.classList.add("pack-opening");
	overlay.innerHTML = `<div class="opening-text">⏳ Abrindo pacote...</div>`;
	document.body.appendChild(overlay);

	await delay(1000);

	const pokemons = await getRandomPokemons(5, type);
	overlay.innerHTML = "";

	let i = 0;
	showNextCard();

	function showNextCard() {
		if (i >= pokemons.length) {
			document.body.removeChild(overlay);
			pokemons.forEach(addToPokedex);
			saveData();
			return;
		};

		const p = pokemons[i];
		let name = p.name.toUpperCase();
		let shiny = name.includes("[SHINY]");
		overlay.innerHTML = `
		<div class="card-drop">
			<img src="${p.sprites?.front_default}" alt="${p.name}" />
			<div class="${shiny ? "nameShiny" : "name"}">${shiny ? `✨ ${name} ✨` : name}</div>
			<div class="type">${p.types.map(t => t.type.name).join(", ")}</div>
			<p class="click-next">✨ Clique para próxima carta</p>
		</div>`;
		
		overlay.onclick = () => {
			i++;
			showNextCard();
		};
	};
}

function summonShiny(type) {
	const chance = {
		teste: 0.5, // 50%
		mitical: 0.0025, // 0.25%
		supreme: 0.005 // 0.50%
	};
  	return Math.random() < chance[type];
};

async function getRandomPokemons(qtd, type) {
	// type = "teste"; // Aplicar 50% de drop
	const promises = [];
	for (let i = 0; i < qtd; i++) {
		const id = Math.floor(Math.random() * maxId) + 1;
		const res = await fetch(`${api}${id}`).then(r => r.json());
		if (summonShiny(type)) {
			res.name = `[SHINY] ${res.name}`;
			res.id = res.id += 0.5;
			res.sprites.front_default = res.sprites.front_shiny;
		};
		promises.push(res);
	};
	return Promise.all(promises);
};

function addToPokedex(pokemon) {
	if (pokedexMap.has(pokemon.id)) return;
	pokedexMap.set(pokemon.id, pokemon);
	if (!save.pokemons.includes(pokemon.id)) {
		save.pokemons.push(pokemon.id);
	};
	renderPokedex();
	saveData();
};

function isShiny(n) {
	return n % 1 === 0.5;
};

async function loadSavedPokemons() {
	if (!save.pokemons.length) return;
	const promises = save.pokemons.map(async (x) => {
		let shiny = isShiny(x);
		let id = Math.floor(x);
		let res = await fetch(`${api}${id}`).then(r => r.json());
		if (shiny) {
			res.name = `[SHINY] ${res.name}`;
			res.id = res.id += 0.5;
			res.sprites.front_default = res.sprites.front_shiny;
		};
		return res;
	});
	const result = await Promise.all(promises);
	result.forEach(p => pokedexMap.set(p.id, p));
	renderPokedex();
};
loadSavedPokemons();

function renderPokedex(filter = "") {
	pokedexContainer.innerHTML = "";
	const filterLower = filter.toLowerCase();

	const sorted = [...pokedexMap.entries()]
		.sort((a, b) => a[0] - b[0])
		.filter(([_, p]) => p.name.toLowerCase().includes(filterLower));

	if (sorted.length === 0) {
		const emptyMsg = document.createElement("div");
		emptyMsg.textContent = "🔍 Nenhum Pokémon encontrado";
		emptyMsg.style.textAlign = "center";
		emptyMsg.style.fontSize = "1.2rem";
		emptyMsg.style.fontWeight = "bold";
		emptyMsg.style.opacity = "0.8";
		emptyMsg.style.marginTop = "30px";
		pokedexContainer.appendChild(emptyMsg);
	} else {
		sorted.forEach(([id, p]) => {
			const div = document.createElement("div");
			div.className = "personagens";
			div.innerHTML = `
				<div class="poke-wrapper">
				<img class="poke-wrapper-img" src="${p.sprites?.front_default}" alt="${p.name}">
				<div class="name">${p.name}</div>
				</div>`;
			pokedexContainer.appendChild(div);
		});
	};

	counterDisplay.textContent = `${pokedexMap.size}/${maxId * 2}`;
}

searchInput.addEventListener("input", e => {
	const value = e.target.value.trim();
	renderPokedex(value);
});

codeInput.addEventListener("keypress", e => {
	if (e.key === "Enter") {
		const code = codeInput.value.trim();
		if (codes[code]) {
			save.coin += codes[code];
			updateCoins();
			saveData();
			codeRewardText.textContent = `+${codes[code].toLocaleString("pt-BR")} 💰`;
			codeInput.value = "";
		} else {
			codeRewardText.textContent = "Código inválido! ❌";
		};
	};
});