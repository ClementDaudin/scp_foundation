import scp_foundationItemSheet from "./sheets/scp_foundationItemSheet.js";
import scp_foundationActorSheet from "./sheets/scp_foundationActorSheet.js";
Hooks.once("init", () => {
    console.log("scp_foundation | Initialisation du système");

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("scp_foundation", scp_foundationItemSheet, {makeDefault: true});

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("scp_foundation", scp_foundationActorSheet, {makeDefault: true});
})
Hooks.on("createItem", async (item, itemData) => {
    if(item.parent !== null) {
        const actor = game.actors.get(item.parent._id);

        console.log(`Un item est sur le point d'être ajouté à l'acteur ${actor.name}:`, item);
        if (item.type === "attachment") {
            // Récupérer toutes les armes de l'acteur

            // Récupérer toutes les armes de l'acteur
            const armes = actor.items.filter(item => item.type === "arme");
            const options = armes.map(armes => {
                return {
                    label: armes.name,
                    value: armes._id
                };
            });

            const html = `
            <div>
                <p>Sélectionnez une arme à utiliser pour ${itemData.name} :</p>
                <select id="selectedWeapon">
                    ${options.map(option => `<option value="${option.value}">${option.label}</option>`).join('')}
                </select>
            </div>
        `;
            let choiceMade = false
            const result = await new Promise((resolve) => {
                new Dialog({
                    title: "Sélection d'une arme",
                    content: html,
                    buttons: {
                        continue: {
                            label: "Continuer",
                            callback: async (html) => {
                                choiceMade = true;
                                const selectedWeaponId = html.find('#selectedWeapon')[0].value;
                                const selectedWeapon = actor.items.find(item => item._id === selectedWeaponId);

                                let attachmentsList = selectedWeapon.data.system.attachments || [];
                                attachmentsList.push(item.id); // Utilisez item.id pour l'ID unique de l'objet nouvellement créé
                                await selectedWeapon.update({"system.attachments": attachmentsList});
                                // Assigner l'ID de l'arme sélectionnée à itemData
                                await item.update({"system.idArme": selectedWeaponId});
                                // Afficher un message de confirmation
                                ui.notifications.info(`Vous avez sélectionné l'arme "${selectedWeapon.name}" pour ${item.name}`);

                                //update de l'arme
                                let updateArme = {};
                                updateArme["system.melee"] = selectedWeapon.system.melee - (- item.system.effect.melee);
                                updateArme["system.hip"] = selectedWeapon.system.hip - (- item.system.effect.hip);
                                updateArme["system.ready"] = selectedWeapon.system.ready - (- item.system.effect.ready);
                                updateArme["system.aim"] = selectedWeapon.system.aim - (- item.system.effect.aim);
                                updateArme["system.clip_size"] = selectedWeapon.system.clip_size - (- item.system.effect.clip_size);
                                await selectedWeapon.update(updateArme);

                                // Résoudre la promesse avec true pour indiquer un choix effectué
                                resolve(true);

                            }
                        },
                        cancel: {
                            label: "Annuler",
                            callback: () => {
                                // Résoudre la promesse avec false pour indiquer aucune action choisie
                                resolve(false);
                            }
                        }
                    },
                    close: () => {
                        // Résoudre la promesse avec false si le dialogue est fermé sans action
                        if (!choiceMade) {
                            resolve(false);
                        }
                    }
                }).render(true);
            });

            // Vérifier le résultat après la fermeture du dialogue
            if (result === false) {
                ui.notifications.warn(`L'association de l'objet "${itemData.name}" à une arme a été annulée.`);
                return false; // Annuler l'ajout de l'item
            }
        }
        await scp_foundationActorSheet._updateRecoil(actor);
    }
    return true;
});
