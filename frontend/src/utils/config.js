export const API_BASE_URL =
  (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8010/api"
  ).replace(
    /\/$/,
    ""
  );

export const getAuthToken = () =>
  localStorage.getItem("typeaware_token") || localStorage.getItem("token");
