import httpClient from "../configurations/httpClient";
import { CONFIG, API } from "../configurations/configuration";
import keycloak from "../keycloak";

export const register = async (data) => {
  return await httpClient.post(API.REGISTRATION, data);
};
//Profile
export const getMyProfile = async () => {
  return await httpClient.get(API.MY_PROFILE, {
    headers : {
      Authorization: "Bearer " + keycloak.token
    }
  })
}

export const getOnlineUsers = async () => {
  return await httpClient.get(API.CONNECT_USERS, {
    headers: {
      Authorization: "Bearer " + keycloak.token
    },
  });
};

export const disconnectUser = async () => {
  return await httpClient.post(API.DISCONNECT, {},{
    headers: {
      Authorization: "Bearer " + keycloak.token
    },
  });
}

export const connectUser = async () => {
  return await httpClient.post(API.CONNECT, {},{
    headers: {
      Authorization: "Bearer " + keycloak.token
    },
  });
};

