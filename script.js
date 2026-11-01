const CHARACTER_PATH = "data/characters.json";
const MOD_PATH = "data/mods.json";

const CHARACTER_ICON_PATH = "assets/characters/";
const MOD_ICON_PATH = "assets/mods/";

const characterList = document.getElementById("character-list");
const searchInput = document.getElementById("search");
const showAllToggle = document.getElementById("show-all");
const completionCount = document.getElementById("completion-count");
const completionPercent = document.getElementById("completion-percent");
const visibleCount = document.getElementById("visible-count");

let characters = [];
let mods = [];

async function loadData() {
  try {
    const [characterResponse, modResponse] = await Promise.all([
      fetch(CHARACTER_PATH),
      fetch(MOD_PATH)
    ]);

    if (!characterResponse.ok || !modResponse.ok) {
      throw new Error("Could not load the character or mod data.");
    }

    characters = await characterResponse.json();
    mods = await modResponse.json();

    characters.sort((a, b) => a.characterId - b.characterId);

    renderCharacters();
  } catch (error) {
    console.error(error);

    characterList.innerHTML =
      '<p class="loading-message">ERROR LOADING CHARACTER DATA.</p>';
  }
}

function getModsForCharacter(characterId) {
  return mods.filter(mod => mod.characterId === characterId);
}

function createTile(imagePath, name, isMod = false, download = "") {
  const tile = document.createElement(isMod ? "a" : "div");

  tile.className = isMod ? "skin-link" : "skin-link character-tile";

  if (isMod && download) {
    tile.href = download;
    tile.target = "_blank";
    tile.rel = "noopener noreferrer";
  }

  tile.dataset.name = name;

  const image = document.createElement("img");
  image.src = imagePath;
  image.alt = name;
  image.loading = "lazy";

  image.onerror = () => {
    image.style.display = "none";
    tile.classList.add("missing-icon");
    tile.textContent = "?";
  };

  tile.appendChild(image);

  return tile;
}

function renderCharacters() {
  characterList.innerHTML = "";

  const search = searchInput.value.trim().toLowerCase();
  const showAll = showAllToggle.checked;

  let completedCharacters = 0;
  let displayedCharacters = 0;

  characters.forEach(character => {
    const characterMods = getModsForCharacter(character.characterId);

    if (characterMods.length > 0) {
      completedCharacters++;
    }

    if (!showAll && characterMods.length === 0) {
      return;
    }

    const searchableText = [
      character.name,
      ...characterMods.map(mod => mod.name)
    ].join(" ").toLowerCase();

    if (search && !searchableText.includes(search)) {
      return;
    }

    displayedCharacters++;

    const row = document.createElement("article");
    row.className = "character-row";

    const info = document.createElement("div");
    info.className = "character-info";

    const name = document.createElement("span");
    name.className = "character-name";
    name.textContent = `${character.characterId + 1}: ${character.name}`;

    info.appendChild(name);

    const skinList = document.createElement("div");
    skinList.className = "skin-list";

    // Original character icon always occupies the first tile.
    skinList.appendChild(
      createTile(
        CHARACTER_ICON_PATH + character.icon,
        character.name
      )
    );

    // Mod icons follow the original character icon.
    characterMods.forEach(mod => {
      skinList.appendChild(
        createTile(
          MOD_ICON_PATH + mod.icon,
          mod.name,
          true,
          mod.download
        )
      );
    });

    row.appendChild(info);
    row.appendChild(skinList);

    // Seven tiles per row, including the original character icon.
    const totalTiles = 1 + characterMods.length;
    const tileRows = Math.ceil(totalTiles / 7);

    row.style.height = `${16 + 48 * tileRows}px`;

    characterList.appendChild(row);
  });

  completionCount.textContent = completedCharacters;
  completionPercent.textContent =
    `${Math.round((completedCharacters / characters.length) * 100)}%`;

  visibleCount.textContent = displayedCharacters;

  if (displayedCharacters === 0) {
    characterList.innerHTML =
      '<p class="loading-message">NO CHARACTERS FOUND.</p>';
  }
}

searchInput.addEventListener("input", renderCharacters);
showAllToggle.addEventListener("change", renderCharacters);

loadData();