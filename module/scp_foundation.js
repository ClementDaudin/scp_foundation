import scp_foundationItemSheet from "./sheets/scp_foundationItemSheet.js";
import scp_foundationActorSheet from "./sheets/scp_foundationActorSheet.js";

let scrollPosition = 0;
Hooks.once("init", () => {
    console.log("scp_foundation | Initialisation du système");

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("scp_foundation", scp_foundationItemSheet, {makeDefault: true});

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("scp_foundation", scp_foundationActorSheet, {makeDefault: true});

    Combat.prototype.rollInitiative = rollInitiative

})
// Restaurer la position de défilement avec un délai
Hooks.on('updateActor', (actor, updateData, options, userId) => {
    const sheet = game.actors.get(actor.id)?.sheet;
    const html = sheet.currentHtml;
    scrollPosition = html[0].scrollTop;
    localStorage.setItem("scroll", "0");

});
Hooks.on('renderActorSheet', (sheet, html, data) => {
    if(localStorage.getItem("scroll") !=="0"){
        scrollPosition = parseFloat(localStorage.getItem("scroll"));
    }
    html[0].scrollTop = scrollPosition;
    localStorage.setItem("scroll", "0");
});

Hooks.on("ready", async () => {
    let actorArray = Array.from(game.actors);
    addAttributeToAllItems();
/*
    for (const actor of actorArray) {
        await actor.update({
            img: actor.prototypeToken.texture.src // Utilisation de l'image du token de l'acteur
        });
    }
*/});

Hooks.on("createItem", async (item, itemData) => {
    if(item._stats.lastModifiedBy === game.users.current._id) {
        if (item.parent !== null) {
            const actor = game.actors.get(item.parent._id);

            console.log(`Un item est sur le point d'être ajouté à l'acteur ${actor.name}:`, item);
            if (item.type === "accessoire") {
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
                <p>Sélectionnez une arme à utiliser pour ${item.name} :</p>
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

                                    let attachmentsList = selectedWeapon.system.attachments || [];
                                    attachmentsList.push(item.id); // Utilisez item.id pour l'ID unique de l'objet nouvellement créé
                                    await selectedWeapon.update({"system.attachments": attachmentsList});
                                    // Assigner l'ID de l'arme sélectionnée à itemData
                                    await item.update({"system.idArme": selectedWeaponId});
                                    // Afficher un message de confirmation
                                    ui.notifications.info(`Vous avez sélectionné l'arme "${selectedWeapon.name}" pour ${item.name}`);

                                    //update de l'arme
                                    let updateArme = {};
                                    updateArme["system.melee"] = selectedWeapon.system.melee - (-item.system.effect.melee);
                                    updateArme["system.hip"] = selectedWeapon.system.hip - (-item.system.effect.hip);
                                    updateArme["system.ready"] = selectedWeapon.system.ready - (-item.system.effect.ready);
                                    updateArme["system.aim"] = selectedWeapon.system.aim - (-item.system.effect.aim);
                                    updateArme["system.magazine.max"] = selectedWeapon.system.magazine.max - (-item.system.effect.magazine);
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
    }
});

export async function rollInitiative (
    ids,
    { formula = null, updateTurn = true, messageOptions = {} } = {}
) {
    // Iterate over Combatants, performing an initiative roll for each
    const updates = []
    for (const [, id] of ids.entries()) {
        // Get Combatant data (non-strictly)
        const combatant = this.combatants.get(id)

        const actor = game.actors.get(combatant.actorId);

        // Produce an initiative roll for the Combatant
        let intel = actor.system.attributes.intelligence
        let d8Used = intel.d8;
        let d10Used = intel.d10;
        let d12Used = intel.d12;
        let diceFormulae = [];
        while (d12Used > 0 && diceFormulae.length<4) {
            diceFormulae.push("1d12");
            d12Used--;
        }
        while (d10Used > 0 && diceFormulae.length<4) {
            diceFormulae.push("1d10");
            d10Used--;
        }
        while (d8Used > 0 && diceFormulae.length<4) {
            diceFormulae.push("1d8");
            d8Used--;
        }

        let diceResults = [];
        let diceExplosions = [];
        for (let formula of diceFormulae) {
            let roll = new Roll(formula);
            await roll.evaluate(); // Évalue le résultat du lancer
            let result = roll.total; // Obtient le total du résultat

            // Stocke le résultat dans le tableau des résultats
            diceResults.push({
                formula: formula,
                result: result
            });
        }
        let resultRoll = 0;
        diceResults.forEach(diceActu  => {
            let maxValue = diceActu.formula.toString().substring(2);
            if(diceActu.result === parseInt(maxValue)){
                diceExplosions.push(diceActu.formula);
            }
            else if (diceActu.result === 1) {
                resultRoll--;
            }
        });

        while(diceExplosions.length > 0){
            diceExplosions = diceExplosions.filter(item => item !== "1d20");
            diceExplosions = diceExplosions.map(item => item === "1d12" ? "1d20" : item);
            diceExplosions = diceExplosions.flatMap((num) => (num === "1d10" ? ["1d12", "1d12"] : num));
            diceExplosions = diceExplosions.map(item => item === "1d8" ? "1d10" : item);
            let diceExplosionResult = []
            let newExplosion = []

            for (const diceActu of diceExplosions) {
                let roll = new Roll(diceActu);
                await roll.evaluate(); // Évalue le résultat du lancer
                let result = roll.total; // Obtient le total du résultat

                diceResults.push({
                    formula: diceActu,
                    result: result
                });
                diceExplosionResult.push({
                    formula: diceActu,
                    result: result
                });
            }
            diceExplosionResult.forEach(diceActu  => {
                let maxValue = diceActu.formula.toString().substring(2);
                if(diceActu.result === parseInt(maxValue)){
                    newExplosion.push(diceActu.formula);
                }
                else if (diceActu.result === 1){
                    resultRoll--;
                }

            })

            diceExplosions = newExplosion;

        }
        diceResults.sort((a, b) => b.result - a.result);

        let bestResults = diceResults.slice(0, 2);
        bestResults.forEach(roll =>{
            resultRoll = resultRoll - (- roll.result)
        })

        resultRoll = resultRoll - (- actor.system.perks.abilities.initiative.perso) - (- actor.system.perks.abilities.initiative.total_mod)

        updates.push({ _id: id, initiative: resultRoll })
    }
    if (!updates.length) return this

    // Update multiple combatants
    await this.updateEmbeddedDocuments('Combatant', updates)

    return this
}

async function addAttributeToAllItems() {
    // Obtenir tous les acteurs
    let actors = game.actors.contents;
    let items = game.items.contents;
    // Parcourir chaque acteur
    for (let actor of actors) {
        let updates = [];

        // Récupérer tous les items de l'acteur
        let items = actor.items.contents;

        // Préparer les mises à jour pour les items
        for (let item of items) {
            // Vérifier si le nouvel attribut est déjà présent
            if(item.type === "accessoire" || item.type === "arme") {
                if (!item.system.hasOwnProperty('hold')) {
                    updates.push({
                        _id: item.id,
                        "system.hold": true // Ajouter le nouvel attribut avec une valeur par défaut
                    });
                }
            }
        }

        // Mettre à jour les items dans l'acteur
        if (updates.length > 0) {
            await actor.updateEmbeddedDocuments("Item", updates);
            console.log(`Mise à jour de ${updates.length} items pour l'acteur ${actor.name}.`);
        }
    }
    // Parcourir chaque item
    for (let item of items) {
        let updates = [];

        // Préparer les mises à jour pour les items
        for (let item of items) {
            // Vérifier si le nouvel attribut est déjà présent
            if(item.type === "accessoire" || item.type === "arme"){
                if (!item.system.hold) {
                    updates.push({
                        _id: item.id,
                        "system.hold": true // Ajouter le nouvel attribut avec une valeur par défaut
                    });
                }
            }

        }

        // Mettre à jour les items dans l'acteur
        if (updates.length > 0) {
            await Item.updateDocuments(updates);
            console.log(`Mise à jour de ${updates.length} items avec le nouvel attribut.`);
        }
    }
}
