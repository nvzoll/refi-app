export const isCollection = (path = ""): boolean => {
  if (path === "/") {
    return false;
  }
  return !(path.split("/").length % 2);
};
