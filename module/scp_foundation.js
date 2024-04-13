import scp_foundationItemSheet from "./sheets/scp_foundationItemSheet.js";
import scp_foundationActorSheet from "./sheets/scp_foundationActorSheet.js";
Hooks.once("init", () => {
    console.log("scp_foundation | Initialisation du système");

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("scp_foundation", scp_foundationItemSheet, {makeDefault: true});

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("scp_foundation", scp_foundationActorSheet, {makeDefault: true});
})