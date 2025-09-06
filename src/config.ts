const hostApi = process.env.NODE_ENV === "development"
  ? "http://localhost"
  : "https://sing-generator-node.herokuapp.com";
const portApi = process.env.NODE_ENV === "development" ? 8080 : "";
const baseURLApi = `${hostApi}${portApi ? `:${portApi}` : ``}/api`;
const redirectUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://flatlogic.github.io/react-material-admin-full";

const config = {
  hostApi,
  portApi,
  baseURLApi,
  redirectUrl,
  remote: "https://sing-generator-node.herokuapp.com",
  isBackend: process.env.REACT_APP_BACKEND,
  auth: {
    email: 'admin@flatlogic.com',
    password: 'password',
  },
  app: {
    colors: {
      dark: "#002B49",
      light: "#FFFFFF",
      sea: "#004472",
      sky: "#E9FAFF",
      wave: "#D1EBF1",
      rain: "#CCDDE3",
      medium: "#7A8D97",
    },
    themeColors: {
      warning: '#FEBE69',
      danger: '#FF7070',
      success: '#6EFFB4',
      info: '#00C2FF'
    }
  }
};

export default config;
