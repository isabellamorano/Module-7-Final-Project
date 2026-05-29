const OMDB_API_KEY = "5dd2ddb1";
const OMDB_API_URL = "https://www.omdbapi.com/";
const DEFAULT_SEARCH_TERM = "star";

const movieGrid = document.querySelector("#movieGrid");
const sortSelect = document.querySelector("#sortSelect");
const searchInput = document.querySelector("#searchInput");
const searchForm = document.querySelector("#searchForm");
const heroSearchInput = document.querySelector("#heroSearchInput");
const heroSearchForm = document.querySelector("#heroSearchForm");
const resultsLine = document.querySelector("#resultsLine");
const menuToggle = document.querySelector("#menuToggle");
const navLinks = document.querySelector("#navLinks");

let displayedMovies = [];
let searchTimeout;

const urlParams = new URLSearchParams(window.location.search);
const searchFromUrl = urlParams.get("search") || "";

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sortMovies(movieList, sortType) {
  return [...movieList].sort((firstMovie, secondMovie) => {
    if (sortType === "za") {
      return secondMovie.title.localeCompare(firstMovie.title);
    }

    if (sortType === "newest") {
      return secondMovie.year - firstMovie.year;
    }

    if (sortType === "oldest") {
      return firstMovie.year - secondMovie.year;
    }

    return firstMovie.title.localeCompare(secondMovie.title);
  });
}

function formatYear(year) {
  const yearMatch = String(year).match(/\d{4}/);
  return yearMatch ? Number(yearMatch[0]) : 0;
}

function formatPoster(poster) {
  if (!poster || poster === "N/A") {
    return "https://placehold.co/600x750/263238/ffffff?text=No+Poster";
  }

  return poster;
}

function formatApiMovie(apiMovie) {
  return {
    title: apiMovie.Title,
    year: formatYear(apiMovie.Year),
    rating: "OMDb",
    genres: [apiMovie.Type || "Movie"],
    image: formatPoster(apiMovie.Poster),
    description: `Released in ${apiMovie.Year}. IMDb ID: ${apiMovie.imdbID}.`
  };
}

async function fetchMovies(searchTerm) {
  const url = `${OMDB_API_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(
    searchTerm
  )}&type=movie`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.Response === "False") {
    return [];
  }

  return data.Search.map(formatApiMovie);
}

function createMovieCard(movie) {
  const genreItems = movie.genres
    .map((genre) => `<li>${escapeHTML(genre)}</li>`)
    .join("");

  return `
    <article class="movie-card">
      <div class="poster-wrap">
        <img src="${escapeHTML(movie.image)}" alt="${escapeHTML(movie.title)} movie poster" loading="lazy" />
      </div>
      <div class="movie-content">
        <div class="movie-meta">
          <span>${escapeHTML(movie.year)}</span>
          <span class="rating">${escapeHTML(movie.rating)}</span>
        </div>
        <h3>${escapeHTML(movie.title)}</h3>
        <ul class="genre-list" aria-label="${escapeHTML(movie.title)} genres">
          ${genreItems}
        </ul>
        <p class="movie-description">${escapeHTML(movie.description)}</p>
      </div>
    </article>
  `;
}

function renderMovies(movieList = displayedMovies) {
  const sortedMovies = sortMovies(movieList, sortSelect.value);

  resultsLine.textContent = `${sortedMovies.length} ${
    sortedMovies.length === 1 ? "movie" : "movies"
  } shown`;

  if (sortedMovies.length === 0) {
    movieGrid.innerHTML = `
      <div class="empty-state">
        <h3>No movies found</h3>
        <p>Try searching for another movie title.</p>
      </div>
    `;
    return;
  }

  movieGrid.innerHTML = sortedMovies.map(createMovieCard).join("");
}

function renderLoadingState() {
  resultsLine.textContent = "Searching OMDb...";
  movieGrid.innerHTML = `
    <div class="empty-state">
      <h3>Loading movies</h3>
      <p>Fetching movie cards from the OMDb API.</p>
    </div>
  `;
}

async function loadMovies(searchTerm = DEFAULT_SEARCH_TERM) {
  renderLoadingState();

  try {
    displayedMovies = await fetchMovies(searchTerm);
    renderMovies();
  } catch (error) {
    resultsLine.textContent = "Unable to load movies";
    movieGrid.innerHTML = `
      <div class="empty-state">
        <h3>Search unavailable</h3>
        <p>Please check your connection and try again.</p>
      </div>
    `;
  }
}

function handleSearch(searchTerm = searchInput.value.trim()) {
  const finalSearchTerm = searchTerm || DEFAULT_SEARCH_TERM;
  searchInput.value = searchTerm;
  loadMovies(finalSearchTerm);
}

function goToMovieSearch(searchTerm) {
  const finalSearchTerm = searchTerm.trim() || DEFAULT_SEARCH_TERM;
  window.location.href = `movies.html?search=${encodeURIComponent(finalSearchTerm)}#movies`;
}

function closeMobileMenu() {
  navLinks.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
}

function toggleMobileMenu() {
  const isOpen = navLinks.classList.toggle("is-open");

  menuToggle.setAttribute("aria-expanded", isOpen);
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", toggleMobileMenu);

  navLinks.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      closeMobileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", () => renderMovies());
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(searchTimeout);
    handleSearch(searchInput.value.trim());
  });
}

if (heroSearchForm) {
  heroSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(searchTimeout);
    goToMovieSearch(heroSearchInput.value);
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      handleSearch(searchInput.value.trim());
    }, 350);
  });
}

if (movieGrid) {
  searchInput.value = searchFromUrl;
  loadMovies(searchFromUrl || DEFAULT_SEARCH_TERM);
}
