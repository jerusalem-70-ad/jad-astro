import { withBasePath } from "./withBasePath";
const searchForm = document.querySelector("#searchForm");
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const searchInput = document.querySelector("#searchInput");
  const searchValue = searchInput.value;
  if (searchValue) {
    window.location.href = withBasePath(
      `/advanced-search/?JAD-temp[query]=${searchValue}`
    );
  } else {
    window.location.href = withBasePath(`/advanced-search/`);
  }
});
