export function parseAuthRedirectParams(url: string) {
  const hashIndex = url.indexOf("#");
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const afterHash = hashIndex >= 0 ? url.slice(hashIndex + 1) : "";
  const queryString = beforeHash.includes("?") ? beforeHash.split("?")[1] : "";
  const queryParams = new URLSearchParams(queryString);
  const hashParams = new URLSearchParams(afterHash);

  return {
    code: queryParams.get("code") ?? hashParams.get("code"),
    access_token: hashParams.get("access_token") ?? queryParams.get("access_token"),
    refresh_token: hashParams.get("refresh_token") ?? queryParams.get("refresh_token"),
  };
}
