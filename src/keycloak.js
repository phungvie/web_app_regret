import Keycloak from "keycloak-js";
import { KEYCLOAK_CONFIG } from "./configurations/configuration";

const keycloak = new Keycloak({
  url: KEYCLOAK_CONFIG.url,
  realm: KEYCLOAK_CONFIG.realm,
  clientId: KEYCLOAK_CONFIG.clientId,
});

export default keycloak;
