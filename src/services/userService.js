import httpClient from "../configurations/httpClient";
import { CONFIG, API } from "../configurations/configuration";
import keycloak from "../keycloak";

export const register = async (data) => {
  return await httpClient.post(API.REGISTRATION, data);
};

export const getMyProfile = async () => {
  return await httpClient.get(API.MY_PROFILE, {
    headers : {
      Authorization: "Bearer " + keycloak.token
    }
  })
}

export const getOnlineUsers = async () => {
  return await httpClient.get(CONFIG.API_GATEWAY + "/profile/users", {
    headers: {
      Authorization: "Bearer " + keycloak.token
    },
  });
};

