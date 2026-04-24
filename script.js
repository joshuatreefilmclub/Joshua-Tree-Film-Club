let lastSug = "";
//API key to access from The Movie Database 
const apiKey = "956ace95c54dddb5f36342022f32588e";
//Each Genre in an array, number next to them represents the id fetched from the API
const genreIds = {
  Comedy: 35,
  Horror: 27,
  Romance: 10749,
  Action: 28,
  Animated: 16,
  Western: 37,
  Fantasy: 14,
  Mystery: 9648,
  War: 10752,
  History: 36
};
//Stores the base URL for accessing the poster of each movie. w300 = width 300
const posterBase = "https://image.tmdb.org/t/p/w300"; 
//This function checks what radio button is selected when a button is pressed
document.getElementById("genBtn").addEventListener("click", function () {
  let selectedGenre;
  const radios = document.getElementsByName("genre");
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      selectedGenre = radios[i].value;
      break;
    }
  }
  checkRadio(selectedGenre);
});
//Another button that when clicked just gets a random movie from whatever genre
document.getElementById("randomBtn").addEventListener("click", function () {
  const randomGenre = getRandomGenre();
  checkRadio(randomGenre);
});
//async function basically a function that fetches data from a network (the API in use)
async function fetchMoviesByGenre(genreId) {
  //Fetches a random movie from the first 6 pages
  const page = Math.floor(Math.random() * 8) + 1;
  //data I am fetching, I found using the API's documentation https://developer.themoviedb.org/reference/getting-started
  const sortOptions = ["popularity.desc", "vote_average.desc", "release_date.desc", "revenue.desc"];
  const sortBy = sortOptions[Math.floor(Math.random() * sortOptions.length)];
  //Dynamically builds a url with apiKey and genreId, sortBy, and page
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}&language=en-US&sort_by=${sortBy}&page=${page}`;
  //try contains code that may not work, if it doesnt work it goes to the catch await, waits for a paramenter to happen before doing it.
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching movie data: ", error);
    return [];
  }
}
//Function returns a random movie from a list
function getRandomMovie(movies) {
  if (!movies.length) return null;
  //Random movie based on the length of the code
  let randomMovie = movies[Math.floor(Math.random() * movies.length)];
  let tries = 0;
  //while loop makes sure the movie has more than 1000 views from the platform, tries up to 10 times
  while (randomMovie && (randomMovie.title === lastSug || randomMovie.vote_count < 1000) && tries < 10) {
    randomMovie = movies[Math.floor(Math.random() * movies.length)];
    tries++;
  }
  lastSug = randomMovie ? randomMovie.title : "";
  return randomMovie && randomMovie.vote_count >= 1000 ? randomMovie : null;
}
//async function that fetches the movie detail
async function fetchMovieDetails(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`;
  const response = await fetch(url);
  return response.json();
}
//fetches the data for the trailer using a dynamic links and youtube link
async function fetchTrailer(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}&language=en-US`;
  const response = await fetch(url);
  const data = await response.json();
  const trailer = data.results.find(v => v.type === "Trailer" && v.site === "YouTube");
  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}
//get the randomGenre for the click function for the random genre button
function getRandomGenre() {
  const genres = Object.keys(genreIds);
  return genres[Math.floor(Math.random() * genres.length)];
}
async function fetchWatchProviders(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  // US results only, flatrate = streaming (not rent/buy)
  const us = data.results?.US;
  if (!us) return null;
  return {
    stream: us.flatrate || [],
    rent: us.rent || [],
    link: us.link || null
  };
}
// verifies that the check radio has the right genre and the movie is the same genre.
async function checkRadio(selectedGenre) {
  let prompt = "Select a Genre";
  if (selectedGenre && genreIds[selectedGenre]) {
    const genreId = genreIds[selectedGenre];
    const movies = await fetchMoviesByGenre(genreId);
    const movie = getRandomMovie(movies);
    if (movie) {
      const details = await fetchMovieDetails(movie.id);
      const trailerUrl = await fetchTrailer(movie.id);
      const providers = await fetchWatchProviders(movie.id);
      const posterUrl = movie.poster_path ? `${posterBase}${movie.poster_path}` : "";
      prompt = `<div class="movie-card-side">
        <div class="movie-left">
          <h2>${movie.title}</h2>
          ${posterUrl ? `<img src="${posterUrl}" alt="${movie.title}" class="movie-poster">` : "<p>No poster available</p>"}
        </div>
        <div class="movie-right">
          <p><strong>Rating:</strong> ${movie.vote_average}/10</p>
          <p><strong>Views on TheMovieDB: </strong>${movie.vote_count}</p>
          <p><strong>Runtime:</strong> ${details.runtime} min</p>
          <p><strong>Release Date:</strong> ${details.release_date}</p>
          <p><strong>Summary:</strong> ${details.overview}</p>
          ${trailerUrl ? `<p><a href="${trailerUrl}" target="_blank">Watch Trailer</a></p>` : ""}
          ${providers && providers.stream.length > 0
            ? `<p><strong>Streaming on:</strong> ${providers.stream.map(p => p.provider_name).join(", ")}</p>`
            : providers && providers.rent.length > 0
            ? `<p><strong>Available to rent on:</strong> ${providers.rent.map(p => p.provider_name).join(", ")}</p>`
            : "<p><strong>Streaming:</strong> Not available on major platforms</p>"
          }
          ${providers?.link ? `<p><a href="${providers.link}" target="_blank">See all watch options</a></p>` : ""}
        </div>
      </div>`;
    } else {
      checkRadio(selectedGenre);
    }
  }
  document.getElementById("text").innerHTML = prompt;
}