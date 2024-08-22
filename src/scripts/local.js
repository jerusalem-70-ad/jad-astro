const openCloseSidebar = () => {
  document.querySelector("#app-sidebar").classList.remove("hidden").add("show");
};

const menuSidebar = document.querySelector("#menu-sidebar");

menuSidebar.addEventListener("click", () => {
  openCloseSidebar();
});
