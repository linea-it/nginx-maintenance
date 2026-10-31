(function () {
  var stored = null;
  try {
    stored = localStorage.getItem("maint-theme");
  } catch (error) {
    stored = null;
  }
  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.setAttribute("data-theme", theme);
})();
