(function () {
  const source = Array.isArray(window.PROJECTS) ? window.PROJECTS : [];
  const projects = [];
  const projectIds = new Set();

  source.forEach((project) => {
    if (!project || !project.id || project.visible === false || projectIds.has(project.id)) return;
    projectIds.add(project.id);
    projects.push(project);
  });

  function getProjects() {
    return projects.slice();
  }

  function getProjectById(id) {
    return projects.find((project) => project.id === id) || null;
  }

  function getProjectsByCategory(category) {
    if (!category || category === "all") return getProjects();
    return projects.filter((project) => project.category === category);
  }

  function getPrimaryProjects() {
    return getProjects();
  }

  window.ProjectService = {
    getProjects,
    getProjectById,
    getProjectsByCategory,
    getPrimaryProjects
  };
})();
