export const CONFIG = {
  API_GATEWAY: "http://localhost:8091/regret",
};

export const API = {
  REGISTRATION: "/profile/register",
  MY_PROFILE: "/profile/my-profile",
  CONNECT_USERS:"/profile/connect-users",
  DISCONNECT: "/profile/disconnectUser",
  CONNECT:"/profile/connectUser",

  MY_CHAT_ROOMS: "/my-chat-rooms",
  MESSAGES_SENDER_RECIPIENT:"/messages/{senderId}/{recipientId}",

  CHAT:"/chat",
};

export const KEYCLOAK_CONFIG = {
  url: "http://localhost:8090",
  realm: "regret",
  clientId: "regret_web_app",
};
