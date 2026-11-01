
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
      throw new Error("Could not load JSON files.");
    }

    characters = await characterResponse.json();
    mods = await modResponse.json();

    if (!Array.isArray(characters) || !Array.isArray(mods)) {
      throw new Error("The JSON files must contain arrays.");
    }

    characters.sort((a, b) =>
      Number(a.characterId) - Number(b.characterId)
    );

    renderCharacters();

  } catch (error) {
    console.error(error);

    characterList.textContent =
      "ERROR: COULD NOT LOAD CHARACTER OR MOD DATA.";
  }
}

function getModsForCharacter(characterId) {
  return mods.filter(mod =>
    Number(mod.characterId) === Number(characterId)
  );
}

function createImage(path, name, className) {
  const image = document.createElement("img");

  image.src = path;
  image.alt = name;
  image.className = className;
  image.loading = "lazy";

  image.addEventListener("error", () => {
    image.style.visibility = "hidden";
  });

  return image;
}

function renderCharacters() {
  characterList.replaceChildren();

  const searchTerm = searchInput.value.trim().toLowerCase();

  const charactersWithMods = characters.filter(character =>
    getModsForCharacter(character.characterId).length > 0
  ).length;

  const percentage = characters.length
    ? Math.round((charactersWithMods / characters.length) * 100)
    : 0;

  completionCount.textContent =
    `${charactersWithMods} / ${characters.length} WITH SKINS`;

  completionPercent.textContent = `${percentage}%`;

  let displayed = 0;

  for (const character of characters) {
    const characterMods = getModsForCharacter(character.characterId);

    // Hide characters without mods when Show All is disabled.
    if (!showAllToggle.checked && characterMods.length === 0) {
      continue;
    }

    // Search character names and mod names.
    const searchableText = [
      character.name,
      character.id,
      ...characterMods.map(mod => mod.name),
      ...characterMods.map(mod => mod.id)
    ].join(" ").toLowerCase();

    if (
      searchTerm &&
      !searchableText.includes(searchTerm)
    ) {
      continue;
    }

    displayed++;

    const row = document.createElement("article");
    row.className = "character-row";

    // Character information and original icon.
    const info = document.createElement("div");
    info.className = "character-info";

    const originalIcon = createImage(
      CHARACTER_ICON_PATH + character.icon,
      character.name,
      "character-icon"
    );

    const characterName = document.createElement("span");
    characterName.className = "character-name";
    characterName.textContent = character.name;

    info.append(originalIcon, characterName);

    // Mod icons.
    const skinList = document.createElement("div");
    skinList.className = "skin-list";

    if (characterMods.length === 0) {
      const noSkins = document.createElement("span");
      noSkins.className = "no-skins";
      noSkins.textContent = "NO SKINS YET";

      skinList.append(noSkins);
    }

    for (const mod of characterMods) {
      const link = document.createElement("a");

      link.className = "skin-link";
      link.dataset.name = mod.name;
      link.title = mod.name;
      link.setAttribute("aria-label", `Open ${mod.name} download page`);

      const validURL = /^https?:\/\//i.test(mod.download || "");

      if (validURL) {
        link.href = mod.download;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.setAttribute("aria-disabled", "true");
        link.title = `${mod.name} (download link unavailable)`;
      }

      const modIcon = createImage(
        MOD_ICON_PATH + mod.icon,
        mod.name,
        ""
      );

      link.append(modIcon);
      skinList.append(link);
    }

    row.append(info, skinList);
    characterList.append(row);
  }

  visibleCount.textContent =
    `${displayed} CHARACTER${displayed === 1 ? "" : "S"}`;

  if (displayed === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent =
      "NO CHARACTERS OR SKINS MATCH YOUR SEARCH.";

    characterList.append(emptyMessage);
  }
}

// Update the list when searching.
searchInput.addEventListener("input", renderCharacters);

// Update the list when Show All is toggled.
showAllToggle.addEventListener("change", renderCharacters);

// Load the JSON files when the page starts.
loadData();
