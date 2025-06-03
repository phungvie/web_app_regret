import httpClient from "../configurations/httpClient";
import { CONFIG, API } from "../configurations/configuration";
import keycloak from "../keycloak";

export const getMyChatRooms = async () => {
    return await httpClient.get(API.MY_CHAT_ROOMS, {
        headers : {
            Authorization: "Bearer " + keycloak.token
        }
    })
}

export const getMessages = async (senderId, recipientId) => {
    const url = API.MESSAGES_SENDER_RECIPIENT
        .replace("{senderId}", senderId)
        .replace("{recipientId}", recipientId);
    return await httpClient.get(url, {
        headers: {
            Authorization: "Bearer " + keycloak.token
        }
    });
}