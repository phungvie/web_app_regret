import keycloak from "../keycloak";

export const logOut = () => {
  keycloak.logout().catch(reason => console.log("Logout error:", reason));
};
