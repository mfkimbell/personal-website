document.addEventListener("DOMContentLoaded", function () {
  const sections = document.querySelectorAll(".nav-fade");
  sections.forEach((section) => {
    section.classlist.add("trans1");
  });
});
