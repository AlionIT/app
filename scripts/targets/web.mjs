import path from "node:path";

function webRoot(projectRoot) {
  return path.join(projectRoot, "apps", "web");
}

export default Object.freeze({
  start({ projectRoot, runNpmScript }) {
    return runNpmScript(webRoot(projectRoot), "dev");
  },
  dev({ projectRoot, runNpmScript }) {
    return runNpmScript(webRoot(projectRoot), "dev");
  },
  check({ projectRoot, runNpmScript }) {
    return runNpmScript(webRoot(projectRoot), "check");
  },
  build({ projectRoot, runNpmScript }) {
    return runNpmScript(webRoot(projectRoot), "build");
  },
});
