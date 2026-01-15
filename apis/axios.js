import axios from "axios";
import APIConfig from "@/apis/config";
import { ACCESS_TOKEN, USER_INFO } from "@/config/constants";
import config from "@/config";

const getToken = () => {
  return typeof window !== "undefined"
    ? window.localStorage.getItem(ACCESS_TOKEN)
    : "ssr";
};

export const api = axios.create({
  baseURL: APIConfig.base,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "x-access-token": getToken() || "ssr",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    config.headers["x-access-token"] = getToken();
    
    // Set ngrok abuse_interstitial cookie
    if (typeof window !== "undefined") {
      // Set cookie in browser
      document.cookie = "abuse_interstitial=a6ade097b069.ngrok-free.app; path=/";
      
      // Also add to Cookie header to ensure it's sent
      const existingCookies = config.headers.Cookie || "";
      const abuseCookie = "abuse_interstitial=a6ade097b069.ngrok-free.app";
      if (!existingCookies.includes("abuse_interstitial")) {
        config.headers.Cookie = existingCookies 
          ? `${existingCookies}; ${abuseCookie}` 
          : abuseCookie;
      }
    }
    
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  function (response) {
    return response.data;
  },
  function (error) {
    const status = error?.response?.status;
    switch (status) {
      case config.httpCode.TOKEN_EXPIRED:
      case config.httpCode.CONFLICT:
        // logout()
        break;
      default:
        break;
    }
    return Promise.reject(error);
  }
);

const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(USER_INFO);
    window.location.href = "/login";
  }
};
