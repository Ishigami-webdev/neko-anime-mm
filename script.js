// ========= Data (edit anytime) =========
// NOTE: "rating" here uses AniList Average/Mean score where available.
// Sources: AniList pages for each title. (You can change to MAL later if you want.)
const ANIME = [
  {
    id: "45days",
    title: "45 Days Until They Become a Couple",
    aka: "Student Council President × Delinquent (BL)",
    seasons: "Web Series",
    year: "—",
    episodes: "—",
    rating: "N/A",
    genres: ["BL", "Romance", "School", "Comedy"],
    desc:
      "A soft high-school BL story: serious student council vibes + a delinquent boy, and the slow burn journey into becoming a couple.",
    poster: "images/45days.jpg",
    watchUrl: "#",      // <-- put your watch link here
    downloadUrl: "#",   // <-- optional direct download link (or keep #)
  },

  {
    id: "campfire",
    title: "Campfire Cooking in Another World with My Absurd Skill",
    seasons: "Season 1–2",
    year: "2023–2025",
    episodes: "12 + (S2 ongoing/released depending)",
    rating: "76%", // AniList Avg S1 ~76%  :contentReference[oaicite:0]{index=0}
    genres: ["Adventure", "Comedy", "Fantasy", "Isekai", "Slice of Life"],
    desc:
      "A chill isekai where modern cooking becomes an OP skill. Cozy vibes, strong familiars, and food that breaks the fantasy world’s logic.",
    poster: "images/campfire.jpg",
    watchUrl: "#",
    downloadUrl: "#",
  },

  {
    id: "rent",
    title: "Rent-a-Girlfriend",
    seasons: "Season 1–4",
    year: "2020–2025",
    episodes: "12 x seasons (varies)",
    rating: "65%", // AniList Avg for S1 entry :contentReference[oaicite:1]{index=1}
    genres: ["Comedy", "Romance", "Drama"],
    desc:
      "A chaotic rom-com where one rental date spirals into lies, feelings, and nonstop relationship drama.",
    poster: "images/rent.jpg",
    watchUrl: "#",
    downloadUrl: "#",
  },

  {
    id: "twisted",
    title: "Disney Twisted-Wonderland: THE ANIMATION",
    seasons: "Season 1: Episode of Heartslabyul",
    year: "2025",
    episodes: "8",
    rating: "66%", // AniList Avg :contentReference[oaicite:2]{index=2}
    genres: ["Fantasy", "Drama", "Mystery"],
    desc:
      "A student gets pulled into Twisted Wonderland and ends up dealing with magical school chaos inspired by iconic villains.",
    poster: "images/twisted.jpg",
    watchUrl: "#",
    downloadUrl: "#",
  },

  {
    id: "yano",
    title: "Yano-kun’s Ordinary Days",
    seasons: "Season 1",
    year: "2025",
    episodes: "12",
    rating: "70%", // AniList Avg :contentReference[oaicite:3]{index=3}
    genres: ["Romance", "Comedy", "Slice of Life"],
    desc:
      "A cute rom-com slice-of-life about an accident-prone guy and the girl who can’t stop worrying about him.",
    poster: "images/yano.jpg",
    watchUrl: "#",
    downloadUrl: "#",
  },

  {
    id: "cat",
    title: "Reborn as a Cat (为喵人生 / Wei Miao Rensheng)",
    seasons: "ONA",
    year: "2025",
    episodes: "36",
    rating: "74%", // AniList Mean :contentReference[oaicite:4]{index=4}
    genres: ["Romance", "Workplace", "Comedy", "Drama"],
    desc:
      "A workplace romance twist: a woman ends up as a cat and gets taken in by her boss… and things get weirdly wholesome.",
    poster: "images/cat.jpg",
    watchUrl: "#",
    downloadUrl: "#",
  },
];

// ========= Helpers =========
const $ = (id) => document.getElementById(id);

function uniq(arr) {
  return [...new Set(arr)];
}

function byTitleAsc(a, b) {
  return a.title.localeCompare(b.title);
}

function getReviewKey(animeId) {
  return `neko_review_${animeId}`;
}

// ========= Elements =========
const grid = $("grid");
const count = $("count");
const search = $("search");
const genreSelect = $("genre");
const chipsWrap = $("chips");

// Modal
const modalBackdrop = $("modalBackdrop");
const closeModalBtn = $("closeModal");
const modalPoster = $("modalPoster");
const modalTitle = $("modalTitle");
const modalMeta = $("modalMeta");
const modalDesc = $("modalDesc");
const modalTags = $("modalTags");

// Review + buttons
const reviewInput = $("reviewInput");
const saveReviewBtn = $("saveReviewBtn");
const downloadBtn = $("downloadBtn");
const watchBtn = $("watchBtn");
const reviewSaved = $("reviewSaved");

// State
let activeGenre = "all";
let activeChip = "all";
let currentAnime = null;

// ========= Build genres =========
function buildGenreDropdown() {
  const allGenres = uniq(ANIME.flatMap((a) => a.genres)).sort();
  genreSelect.innerHTML = `<option value="all">All genres</option>`;
  allGenres.forEach((g) => {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = g;
    genreSelect.appendChild(opt);
  });
}

function buildChips() {
  const base = ["all", "Top Rated", "Romance", "Comedy", "Fantasy", "BL"];
  chipsWrap.innerHTML = "";
  base.forEach((label) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (label === "all" ? " active" : "");
    chip.type = "button";
    chip.dataset.chip = label;
    chip.textContent = label === "all" ? "All" : label;
    chipsWrap.appendChild(chip);
  });

  chipsWrap.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;

    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");

    activeChip = chip.dataset.chip;
    render();
  });
}

// ========= Filtering =========
function filterAnime(list) {
  const q = (search.value || "").trim().toLowerCase();

  return list.filter((a) => {
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      (a.aka && a.aka.toLowerCase().includes(q));

    const matchesGenre =
      activeGenre === "all" || a.genres.includes(activeGenre);

    const matchesChip = (() => {
      if (activeChip === "all") return true;
      if (activeChip === "Top Rated") {
        const r = parseInt((a.rating || "").replace("%", ""), 10);
        return Number.isFinite(r) && r >= 72;
      }
      // chip acts like genre shortcut
      return a.genres.includes(activeChip);
    })();

    return matchesSearch && matchesGenre && matchesChip;
  });
}

// ========= Card rendering =========
function createCard(anime) {
  const card = document.createElement("div");
  card.className = "card";
  card.tabIndex = 0;

  const banner = document.createElement("div");
  banner.className = "banner";
  banner.style.backgroundImage = `url('${anime.poster}')`;

  const body = document.createElement("div");
  body.className = "card-body";

  const h = document.createElement("h4");
  h.className = "title";
  h.textContent = anime.title;

  const small = document.createElement("p");
  small.className = "small";
  small.textContent = `${anime.seasons} • Rating: ${anime.rating}`;

  const pills = document.createElement("div");
  pills.className = "pills";
  anime.genres.slice(0, 3).forEach((g) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = g;
    pills.appendChild(pill);
  });

  body.appendChild(h);
  body.appendChild(small);
  body.appendChild(pills);

  card.appendChild(banner);
  card.appendChild(body);

  const open = () => openModal(anime);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") open();
  });

  return card;
}

function render() {
  const filtered = filterAnime([...ANIME].sort(byTitleAsc));

  grid.innerHTML = "";
  filtered.forEach((a) => grid.appendChild(createCard(a)));

  count.textContent = `${filtered.length} / ${ANIME.length}`;
}

// ========= Modal =========
function openModal(anime) {
  currentAnime = anime;

  modalPoster.style.backgroundImage = `url('${anime.poster}')`;
  modalTitle.textContent = anime.title;

  const parts = [
    anime.seasons,
    anime.year ? `Year: ${anime.year}` : null,
    anime.episodes ? `Episodes: ${anime.episodes}` : null,
    anime.rating ? `Rating: ${anime.rating}` : null,
  ].filter(Boolean);

  modalMeta.textContent = parts.join(" • ");
  modalDesc.textContent = anime.desc || "";

  modalTags.innerHTML = "";
  anime.genres.forEach((g) => {
    const tag = document.createElement("span");
    tag.className = "pill";
    tag.textContent = g;
    modalTags.appendChild(tag);
  });

  // Load saved review
  const saved = localStorage.getItem(getReviewKey(anime.id)) || "";
  reviewInput.value = saved;
  reviewSaved.textContent = saved ? "Loaded your saved review ✅" : "";

  modalBackdrop.classList.remove("hidden");
  modalBackdrop.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
  modalBackdrop.setAttribute("aria-hidden", "true");
  currentAnime = null;
}

// Close button + click outside + ESC
closeModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalBackdrop.classList.contains("hidden")) {
    closeModal();
  }
});

// ========= Review + Buttons =========
saveReviewBtn.addEventListener("click", () => {
  if (!currentAnime) return;
  localStorage.setItem(getReviewKey(currentAnime.id), reviewInput.value.trim());
  reviewSaved.textContent = "Saved! (This stays on your PC browser) ✅";
});

downloadBtn.addEventListener("click", () => {
  if (!currentAnime) return;

  // If you later want direct file links, you can use currentAnime.downloadUrl
  // For now: download a generated text file
  const review = (reviewInput.value || "").trim();
  const lines = [
    `Anime: ${currentAnime.title}`,
    `Seasons: ${currentAnime.seasons}`,
    `Year: ${currentAnime.year}`,
    `Episodes: ${currentAnime.episodes}`,
    `Rating: ${currentAnime.rating}`,
    `Genres: ${currentAnime.genres.join(", ")}`,
    "",
    "Description:",
    currentAnime.desc || "",
    "",
    "Your Review:",
    review || "(no review yet)",
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentAnime.id}_info.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
});

watchBtn.addEventListener("click", () => {
  if (!currentAnime) return;
  const url = currentAnime.watchUrl || "#";
  if (url === "#" || !url) {
    alert("Bro add your Watch link first in script.js (watchUrl).");
    return;
  }
  window.open(url, "_blank");
});

// ========= Controls =========
search.addEventListener("input", render);

genreSelect.addEventListener("change", () => {
  activeGenre = genreSelect.value;
  render();
});

// ========= Init =========
buildGenreDropdown();
buildChips();
render();
