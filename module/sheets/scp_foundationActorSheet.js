export default class scp_foundationActorSheet extends ActorSheet {

    constructor(...args) {
        super(...args);
        this.data = null; // Variable pour stocker les données récupérées une seule fois
        this.currentHtml = null;
    }

    get template() {
        console.log(`scp_foundation | Récupération du fichier html ${this.actor.type}-sheet.`);

        return `systems/scp_foundation/templates/sheets/${this.actor.type}-sheet.html`;
    }

    async getData(options) {
        this.data = await super.getData(options);
        this.data.systemData = this.data.data.system;
        this.data.descriptionHTML = await TextEditor.enrichHTML(this.data.systemData.biography, {
            secrets: this.document.isOwner,
            async: true
        });
        console.log(this.data);
        return this.data;
    }

    activateListeners(html) {
        this.currentHtml = html;
        super.activateListeners(html);
        if (this.actor.type === "character") {
            this.updateDicesTiles(html);
            this.updateExertionSpan(html);
            this.updateTiles(html, "exertion");
            this.updateTiles(html, "reverence");
            this.updateTiles(html, "merit_point");
            this.updateOther(html);
            this.abilitiesBonus(html);
            window.addEventListener('keydown', function (e) {
                if (e.keyIdentifier == 'U+000A' || e.keyIdentifier == 'Enter' || e.keyCode == 13) {
                    if (e.target.nodeName == 'INPUT' && e.target.type == 'text') {
                        e.preventDefault();

                        return false;
                    }
                }
            }, true);
            console.log(`scp_foundation | Récupération des listeners.`);

            const radiosTable = html.find(".radio-item-system");
            const radios = Array.from(radiosTable);
            radios.forEach(radio => {
                const itemId = radio.getAttribute('name').replace('item', ''); // Récupère l'ID de l'item
                let arme = this.actor.items.get(itemId);
                let value = radio.value
                radio.addEventListener('change', async () => {
                    await arme.update({"system.actual_position": value});
                });
                radio.checked = value === arme.system.actual_position;
            });
            const personnelTable = html.find(".personnelButton");
            const personnel = Array.from(personnelTable);
            personnel.forEach(radio => {
                radio.addEventListener('change', async () => {
                    await this.actor.update({"system.personnel_class": radio.value});
                });
                if (radio.value === this.actor.system.personnel_class) {
                    radio.checked = true;
                }
            });

            html.find(".item-delete").click(this._onItemDelete.bind(this));
            html.find(".sortAlpha")[0].addEventListener('click', () => {
                this.sortItems();
            });
            // Sélectionnez le bouton par sa classe ou son ID, ajustez le sélecteur en fonction de votre HTML
            const diceButton = html.find('.die-purchase');

            // Utilisez addEventListener pour attacher un événement onclick au bouton
            diceButton[0].addEventListener('click', async () => {
                await this.buyDice(8, html);
            });
            diceButton[1].addEventListener('click', async () => {
                await this.buyDice(10, html);
            });
            diceButton[2].addEventListener('click', async () => {
                await this.buyDice(12, html);
            });
            let diceTable = html.find('.diceTile');
            let diceArray = Array.from(diceTable);

            diceArray.forEach((diceTile) => {
                diceTile.addEventListener('click', async () => {
                    await this.exchangeDice(diceTile, html);
                })
            })

            let exertionTable = html.find('.exertionTile');
            let exertionArray = Array.from(exertionTable);
            exertionArray.forEach((exertionTile) => {
                exertionTile.addEventListener('click', async () => {
                    await this.changeExertion(exertionTile, html);
                })
            })
            let reverenceTable = html.find('.reverenceTile');
            let reverenceArray = Array.from(reverenceTable);
            reverenceArray.forEach((reverenceTile) => {
                reverenceTile.addEventListener('click', async () => {
                    await this.changeReverence(reverenceTile, html);
                })
            })
            let meritTable = html.find('.merit_pointTile');
            let meritArray = Array.from(meritTable);
            meritArray.forEach((meritTile) => {
                meritTile.addEventListener('click', async () => {
                    await this.changeMerit(meritTile, html);
                })
            })
            let rollButtonTable = html.find('.roller');
            let rollButtonArray = Array.from(rollButtonTable);
            rollButtonArray.forEach((rollButton) => {
                rollButton.addEventListener('click', () => {
                    this.prepareRoll(html, rollButton.name, rollButton.value);
                })
            })
            let perksTable = html.find('.perksRoller');
            let perksArray = Array.from(perksTable);
            perksArray.forEach((perksButton) => {
                perksButton.addEventListener('click', () => {
                    this.preparePerksRoll(html, perksButton.name, perksButton.value, null, 0);
                })
            });
            let weaponTable = html.find('.weaponRoller');
            let weaponArray = Array.from(weaponTable);
            weaponArray.forEach((weaponButton) => {
                weaponButton.addEventListener('click', () => {
                    this.prepareAttackRoll(html, weaponButton.name, weaponButton.value);
                })
            });

            let popup = html.find('#ma_popup')[0];
            html.find(".closePopup")[0].addEventListener('click', function () {
                popup.style.display = 'none';
                html.find('#diceUse')[0].value = "true";
                html.find(".diceToUse")[0].style.display = "none";
                let launchDiceInput = html.find('.input-label.launchDice')[0];

                const newElement = launchDiceInput.firstElementChild.cloneNode(true);
                launchDiceInput.replaceChild(newElement, launchDiceInput.firstElementChild);

            });
            this.dragElement(popup);
            let buttonsTable = html.find('.popup-content select');
            let buttonsArray = Array.from(buttonsTable);

            buttonsArray.forEach(function (button) {
                button.addEventListener('mousedown', function (event) {
                    event.stopPropagation();
                });
            });
            html.find("#d12Selected")[0].addEventListener('change', () => {
                this.updateDicesAvailable(html);
            })
            html.find("#d10Selected")[0].addEventListener('change', () => {
                this.updateDicesAvailable(html);
            })
            html.find("#d8Selected")[0].addEventListener('change', () => {
                this.updateDicesAvailable(html);
            })

            let personnalModuleTable = html.find(".self_mod");
            let personnalModuleArray = Array.from(personnalModuleTable);
            personnalModuleArray.forEach((personnalModule) => {
                personnalModule.addEventListener("change", (evt) => {
                    this.totalModUpdate(evt, personnalModule);
                })
            })
            html.find("#reasoning")[0].addEventListener('change', (evt) => {
                this.bonusReasoningUpdate(evt);
            });
            html.find("#body_type")[0].addEventListener('change', (evt) => {
                this.bonusBodyTypeUpdate(evt, html);
            });
            html.find("#appearance")[0].addEventListener('change', (evt) => {
                this.bonusAppearanceUpdate(evt);
            });
            html.find("#all-radio")[0].addEventListener('click', () => {
                html.find("#main")[0].style.display = "block";
                html.find("#charactere_data")[0].style.display = "block";
                html.find("#weapons")[0].style.display = "none";
                html.find("#inventory")[0].style.display = "none";
                html.find("#presentation")[0].style.display = "none";
                html.find("#attributes")[0].style.display = "block";
                localStorage.setItem('page', 'all')
            })
            html.find("#attacks-radio")[0].addEventListener('click', () => {
                html.find("#main")[0].style.display = "block";
                html.find("#charactere_data")[0].style.display = "none";
                html.find("#weapons")[0].style.display = "block";
                html.find("#inventory")[0].style.display = "none";
                html.find("#presentation")[0].style.display = "none";
                html.find("#attributes")[0].style.display = "none";
                localStorage.setItem('page', 'attack')
            })
            html.find("#equipment-radio")[0].addEventListener('click', () => {
                html.find("#main")[0].style.display = "block";
                html.find("#charactere_data")[0].style.display = "none";
                html.find("#weapons")[0].style.display = "none";
                html.find("#inventory")[0].style.display = "block";
                html.find("#presentation")[0].style.display = "none";
                html.find("#attributes")[0].style.display = "none";
                localStorage.setItem('page', 'inventory')
            })
            html.find("#presentation-radio")[0].addEventListener('click', () => {
                html.find("#charactere_data")[0].style.display = "none";
                html.find("#weapons")[0].style.display = "none";
                html.find("#inventory")[0].style.display = "none";
                html.find("#presentation")[0].style.display = "block";
                html.find("#attributes")[0].style.display = "none";
                html.find("#main")[0].style.display = "none";
                localStorage.setItem('page', 'presentation')
            })
            if(!this.actor.isOwner){
                localStorage.setItem('page', 'presentation');
            }

            switch (localStorage.getItem('page')) {
                case "all":
                    html.find("#main")[0].style.display = "block";
                    html.find("#charactere_data")[0].style.display = "block";
                    html.find("#weapons")[0].style.display = "none";
                    html.find("#inventory")[0].style.display = "none";
                    html.find("#attributes")[0].style.display = "block";
                    html.find("#presentation")[0].style.display = "none";
                    html.find("#all-radio")[0].checked = true;
                    break;
                case "attack":
                    html.find("#main")[0].style.display = "block";
                    html.find("#charactere_data")[0].style.display = "none";
                    html.find("#weapons")[0].style.display = "block";
                    html.find("#inventory")[0].style.display = "none";
                    html.find("#attributes")[0].style.display = "none";
                    html.find("#attacks-radio")[0].checked = true;
                    html.find("#presentation")[0].style.display = "none";
                    document.fonts.ready.then(()=>{
                        this.synchronizeTableColumnWidths();
                    });
                    break;
                case "inventory":
                    html.find("#main")[0].style.display = "block";
                    html.find("#charactere_data")[0].style.display = "none";
                    html.find("#weapons")[0].style.display = "none";
                    html.find("#inventory")[0].style.display = "block";
                    html.find("#attributes")[0].style.display = "none";
                    html.find("#equipment-radio")[0].checked = true;
                    html.find("#presentation")[0].style.display = "none";
                    break;
                default:
                    html.find("#charactere_data")[0].style.display = "none";
                    html.find("#weapons")[0].style.display = "none";
                    html.find("#inventory")[0].style.display = "none";
                    html.find("#presentation")[0].style.display = "block";
                    html.find("#attributes")[0].style.display = "none";
                    html.find("#main")[0].style.display = "none";
                    html.find("#presentation")[0].checked = true;
                    break;
            }

            const armesTable = html.find('.arme');
            const armesArray = Array.from(armesTable);

            armesArray.forEach(arme => {
                const toggleButton = arme.querySelector('.toggle-details');
                const detailsRow = arme.nextElementSibling;

                toggleButton.addEventListener('click', function () {
                    if (detailsRow.style.display === "none") {
                        detailsRow.style.display = "table-row";
                    } else {
                        detailsRow.style.display = "none";
                    }
                });
            });
            const armesStatsTable = html.find('.statValue');
            const armesStatsArray = Array.from(armesStatsTable);

            armesStatsArray.forEach(armeStat => {
                let fullPerks = armeStat.id.split(".");

                const type = this.actor.system.perks[fullPerks[0]];
                const skill = type[fullPerks[1]]
                armeStat.innerHTML = skill["perso"] - (-skill["total_mod"]);
            });

            const searchInput = html.find('#searchInput')[0];
            const showChecked = html.find('#showChecked')[0];
            const checkboxesTable = html.find('.isHoldCheckbox');
            const ownedValueTable = html.find('.ownedValue');
            const weaponValueTable = html.find('.nameUpdate');
            const magazineTable = html.find('.magazine');
            const checkboxes = Array.from(checkboxesTable)
            const ownedValue = Array.from(ownedValueTable)
            const weaponNameValue = Array.from(weaponValueTable)
            const magazineValue = Array.from(magazineTable)
            // Filtrage lors de la saisie dans le champ de recherche
            searchInput.addEventListener('input', function () {
                const searchText = searchInput.value.toLowerCase();
                checkboxes.forEach(function (checkbox) {
                    const row = checkbox.closest('tr');
                    const name = row.querySelector('td:nth-child(2)').firstElementChild.value.toLowerCase();
                    if (name.includes(searchText) && (!showChecked.checked || checkbox.checked)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });

            checkboxes.forEach(checkbox => {
                checkbox.addEventListener("click", async () => {
                    let item = this.actor.items.get(checkbox.name);
                    await item.update({"system.hold": checkbox.checked})
                    if(item.type === "accessoire"){
                        this.updateAccessoire(item, checkbox.checked);
                    }
                })
                let item = this.actor.items.get(checkbox.name);
                checkbox.checked = item.system.hold;
            });
            ownedValue.forEach(ownedButton => {
                ownedButton.addEventListener("change", async () => {
                    let item = this.actor.items.get(ownedButton.name);
                    await item.update({"system.owned": ownedButton.value})
                })
            });
            weaponNameValue.forEach(weaponName => {
                weaponName.addEventListener("change", async () => {
                    let item = this.actor.items.get(weaponName.name);
                    await item.update({"name": weaponName.value})
                })
            });
            magazineValue.forEach(magazineButton => {
                magazineButton.addEventListener("change", async () => {
                    let item = this.actor.items.get(magazineButton.name);
                    await item.update({"system.magazine.actual": magazineButton.value})
                })
            });
            showChecked.checked = localStorage.getItem('isChecked') === "true";

            // Filtrage pour afficher seulement les éléments cochés
            showChecked.addEventListener('change', function () {
                localStorage.setItem('isChecked', showChecked.checked);
                checkboxes.forEach(function (checkbox) {
                    const row = checkbox.closest('tr');
                    if (showChecked.checked && !checkbox.checked) {
                        row.style.display = 'none';
                    } else {
                        const searchText = searchInput.value.toLowerCase();
                        const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                        if (name.includes(searchText)) {
                            row.style.display = '';
                        }
                    }
                });
            })
            checkboxes.forEach(function (checkbox) {
                const row = checkbox.closest('tr');
                if (showChecked.checked && !checkbox.checked) {
                    row.style.display = 'none';
                } else {
                    const searchText = searchInput.value.toLowerCase();
                    const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                    if (name.includes(searchText)) {
                        row.style.display = '';
                    }
                }
            });

        }
        if (this.actor.type === "pnj" || this.actor.type === "scp") {
            html.find('#addWeapon')[0].addEventListener("click", () => {
                this.add_weapon();
            });
            let pnjWeaponList = html.find(".pnjWeapon");
            let pnjWeapon = Array.from(pnjWeaponList);
            pnjWeapon.forEach(weapon => {
                weapon.addEventListener('change', () => {
                    this.updateWeapon(weapon);
                })
            })
            html.find(".pnj-delete").click(this.delete_weapon.bind(this));
            let diceRollButtonList = html.find(".diceImage");
            let diceRollAttributeList = html.find(".pnjDice");
            let diceRollAttributeButton = Array.from(diceRollAttributeList);
            let diceRollButton = Array.from(diceRollButtonList);
            diceRollButton.forEach(diceButton => {
                diceButton.firstElementChild.addEventListener("click", () => {
                    this.preparePnjRoll(html, diceButton.firstElementChild.name, diceButton.firstElementChild.value)
                });
            })
            diceRollAttributeButton.forEach(diceButton => {
                diceButton.firstElementChild.addEventListener("click", () => {
                    this.preparePnjRoll(html, diceButton.children[0].innerHTML.substring(0, diceButton.children[0].innerHTML.length - 2), diceButton.children[1].value)
                });
            })

            this.updateTiles(html, "devastation_point");
            let devastationTable = html.find('.devastation_pointTile');
            let devastationArray = Array.from(devastationTable);
            devastationArray.forEach((devastationTile) => {
                devastationTile.addEventListener('click', async () => {
                    await this.changeDevastation(devastationTile, html);
                })
            })
            let popup = html.find('#ma_popup')[0];

            html.find(".closePopup")[0].addEventListener('click', function () {
                popup.style.display = 'none';
                let launchDiceInput = html.find('.input-label.launchDice')[0];

                const newElement = launchDiceInput.firstElementChild.cloneNode(true);
                launchDiceInput.replaceChild(newElement, launchDiceInput.firstElementChild);

            });
        }
    }

    async buyDice(dice, html) {
        html.find('input[type="text"]').prop('disabled', true); //avoid experience reset
        let d8 = this.actor.system.attributes.stock.d8;
        let d10 = this.actor.system.attributes.stock.d10;
        let d12 = this.actor.system.attributes.stock.d12;
        let experience = this.actor.system.experience
        switch (dice) {
            case 8:
                if (experience >= 100) {
                    console.log("achat d8");
                    experience -= 100;
                    d8 += 1;
                }
                break;
            case 10:
                if (experience >= 200) {
                    console.log("achat d10");
                    experience -= 200;
                    d10 += 1;
                }
                break;
            case 12:
                if (experience >= 500) {
                    console.log("achat d12");
                    experience -= 500;
                    d12 += 1;
                }
                break;
        }
        await this.actor.update({
            "system.attributes.stock.d8": d8,
            "system.attributes.stock.d10": d10,
            "system.attributes.stock.d12": d12,
            "system.experience": experience
        });
        // Après avoir effectué les modifications via les boutons, réactivez les événements de saisie
        html.find('input[type="text"]').prop('disabled', false);
    }

    async exchangeDice(diceClicked, html) {
        html.find('input[type="text"]').prop('disabled', true);
        let diceElements = diceClicked.name.split("_");
        let diceNumber = diceElements[2];
        let diceType = diceElements[1];
        let diceValue = diceClicked.value
        let nbActuDice = this.actor.system.attributes[diceType];
        let nbActuDiceVal = nbActuDice[diceNumber];
        let nbRequis = diceValue - nbActuDiceVal;
        let stock = this.actor.system.attributes.stock[diceNumber];
        let isOk = nbRequis <= stock;
        let differenceInDice = 0;

        switch (diceNumber) {
            case "d8":
                differenceInDice = (diceValue - nbActuDice["d8"]) * 3;
                break;
            case "d10":
                differenceInDice = (diceValue - nbActuDice["d10"]) * 6;
                isOk = isOk && nbActuDice["d8"] >= 2 * diceValue;
                break;
            case "d12":
                differenceInDice = (diceValue - nbActuDice["d12"]) * 16;
                isOk = isOk && nbActuDice["d10"] >= 2 * diceValue;
                break;
        }
        if (isOk) {
            let diceNumberStockAttribute = "system.attributes.stock." + diceNumber;
            let diceTypeNumberAttribute = "system.attributes." + diceType + "." + diceNumber;
            let stockLeft = stock - nbRequis;
            let updateData = {};
            updateData[diceNumberStockAttribute] = stockLeft;
            updateData[diceTypeNumberAttribute] = diceValue;
            if (diceType === "health") {
                let actualHP = this.actor.system.hp.max;
                actualHP = actualHP - (-differenceInDice);
                updateData["system.hp.max"] = actualHP;
            }

            await this.actor.update(updateData);
            await this.diceBonus(html);

        }
        this.updateDicesTiles(html);
        html.find('input[type="text"]').prop('disabled', false);

    }


    updateDicesTiles(html) {
        let diceTable = html.find('.diceTile');
        let diceArray = Array.from(diceTable);
        diceArray.forEach((diceTile) => {
            let diceElements = diceTile.name.split("_");
            let diceNumber = diceElements[2];
            let diceType = diceElements[1];
            let diceValue = diceTile.value;
            let nbActuDice = this.actor.system.attributes[diceType];
            let nbActuDiceVal = nbActuDice[diceNumber];

            if (parseInt(diceValue) <= parseInt(nbActuDiceVal)) {
                diceTile.checked = true;
            } else {
                diceTile.checked = false;
            }
        })
    }

    async changeExertion(exertionClicked, html) {
        html.find('input[type="text"]').prop('disabled', true);
        let nbMax = this.actor.system.exertion.max;
        if (parseInt(exertionClicked.value) <= parseInt(nbMax)) {
            await this.actor.update({
                "system.exertion.actual": exertionClicked.value
            });

        }
        this.updateTiles(html, "exertion");
        html.find('input[type="text"]').prop('disabled', false);

    }

    async changeReverence(reverenceClicked, html) {
        html.find('input[type="text"]').prop('disabled', true);
        await this.actor.update({
            "system.reverence": reverenceClicked.value
        });
        this.updateTiles(html, "reverence");
        html.find('input[type="text"]').prop('disabled', false);

    }

    async changeDevastation(devastationClicked, html) {
        html.find('input[type="text"]').prop('disabled', true);
        if (parseInt(this.actor.system.devastation_point) === parseInt(devastationClicked.value)) {
            await this.actor.update({
                "system.devastation_point": devastationClicked.value - 1
            });
        } else {
            await this.actor.update({
                "system.devastation_point": devastationClicked.value
            });
        }

        this.updateTiles(html, "devastation_point");
        html.find('input[type="text"]').prop('disabled', false);

    }

    async changeMerit(meritClicked, html) {
        html.find('input[type="text"]').prop('disabled', true);
        await this.actor.update({
            "system.merit_point": meritClicked.value
        });
        this.updateTiles(html, "merit_point");
        html.find('input[type="text"]').prop('disabled', false);

    }

    updateTiles(html, type) {
        let tilesTable = html.find('.' + type + 'Tile');
        let tilesArray = Array.from(tilesTable);
        let nbTiles = 0;
        if (type === "exertion") {
            nbTiles = this.actor.system.exertion.actual;
        } else {
            nbTiles = this.actor.system[type];
        }
        tilesArray.forEach((tile) => {
            let tileValue = tile.value;
            if (parseInt(tileValue) <= parseInt(nbTiles)) {
                tile.checked = true;
            } else {
                tile.checked = false;
            }
        })
    }

    updateExertionSpan(html) {
        let exertionSpan = html.find('.exertionMax');
        let exertionArray = Array.from(exertionSpan);
        let nbMax = this.actor.system.exertion.max - (-1); //avoid concatenation
        for (let i = nbMax; i < 8; i++) {
            let exertionSpan = html.find('#exertionMax' + i);
            exertionSpan.css('background-color', 'white');

        }
    }

    async diceBonus(html) {
        html.find('input[type="text"]').prop('disabled', true);
        let strength = this.actor.system.attributes.strength;
        let perception = this.actor.system.attributes.perception;
        let dexterity = this.actor.system.attributes.dexterity;
        let intelligence = this.actor.system.attributes.intelligence;
        let willpower = this.actor.system.attributes.willpower;
        let awareness = this.actor.system.perks.abilities.awareness_reaction.perso - (-this.actor.system.perks.abilities.awareness_reaction.total_mod);
        let meleeValue = Math.floor(strength.d10 / 2) - (-strength.d10 % 2) - (-strength.d12) + 1;
        let recoil = strength.d12;
        let projectionValue = Math.floor(perception.d10 / 2) - (-perception.d10 % 2) - (-perception.d12) + 1;
        let reactDef = perception.d10 - (-dexterity.d12) - (-intelligence.d10) - (-awareness) - (-this.actor.system.reaction_defense.bonus);
        let moveValue = 2 - (-dexterity.d12);
        let modAvailable = intelligence.d10 / 2
        let exertionMax = 1 - (-willpower.d10);
        let self_controle = this.actor.system.perks.abilities.self_controle.perso - (-this.actor.system.perks.abilities.self_controle.total_mod);
        let cognitive_value = exertionMax - (-this.actor.system.cognitive_resistance.bonus) - (-self_controle);
        let updateBonus = {};
        updateBonus["system.melee_multiplier.bonus"] = meleeValue;
        updateBonus["system.projection_multiplier.bonus"] = projectionValue;
        updateBonus["system.recoil"] = recoil;
        updateBonus["system.reaction_defense.value"] = reactDef;
        updateBonus["system.move_speed"] = moveValue;
        updateBonus["system.mod"] = modAvailable;
        updateBonus["system.exertion.max"] = exertionMax;
        updateBonus["system.cognitive_resistance.value"] = cognitive_value;

        await this.actor.update(updateBonus);
        await this._updateRecoil(this.actor);

        html.find('input[type="text"]').prop('disabled', false);

    }

    async abilitiesBonus(html) {
        html.find('input[type="text"]').prop('disabled', true);
        let perception = this.actor.system.attributes.perception;
        let dexterity = this.actor.system.attributes.dexterity;
        let intelligence = this.actor.system.attributes.intelligence;
        let willpower = this.actor.system.attributes.willpower;
        let awareness = this.actor.system.perks.abilities.awareness_reaction.perso - (-this.actor.system.perks.abilities.awareness_reaction.total_mod);

        let reactDef = perception.d10 - (-dexterity.d12) - (-intelligence.d10) - (-awareness) - (-this.actor.system.reaction_defense.bonus);

        let exertionMax = 1 - (-willpower.d10);
        let self_controle = this.actor.system.perks.abilities.self_controle.perso - (-this.actor.system.perks.abilities.self_controle.total_mod);
        let cognitive_value = exertionMax - (-this.actor.system.cognitive_resistance.bonus) - (-self_controle);
        let updateBonus = {};

        updateBonus["system.reaction_defense.value"] = reactDef;
        updateBonus["system.cognitive_resistance.value"] = cognitive_value;

        await this.actor.update(updateBonus);

        html.find('input[type="text"]').prop('disabled', false);

    }

    updateOther(html) {
        html.find('input[type="text"]').prop('disabled', true);
        let appearance = html.find('#appearance')[0];
        let body_type = html.find('#body_type')[0];
        let reasoning = html.find('#reasoning')[0];
        let body_type_selected = this.actor.system.body_type;
        let appearance_selected = this.actor.system.appearance;
        let reasoning_selected = this.actor.system.reasoning;
        let optionsAppearance = appearance.options;
        let optionsBody = body_type.options;
        let optionsReasoning = reasoning.options;

        for (let i = 0; i < optionsAppearance.length; i++) {
            if (optionsAppearance[i].value === appearance_selected) {
                optionsAppearance[i].selected = true;
            } else {
                optionsAppearance[i].selected = false;
            }
        }
        for (let i = 0; i < optionsBody.length; i++) {
            if (optionsBody[i].value === body_type_selected) {
                optionsBody[i].selected = true;
            } else {
                optionsBody[i].selected = false;
            }
        }
        for (let i = 0; i < optionsReasoning.length; i++) {
            if (optionsReasoning[i].value === reasoning_selected) {
                optionsReasoning[i].selected = true;
            } else {
                optionsReasoning[i].selected = false;
            }
        }
        html.find('input[type="text"]').prop('disabled', false);
    }

    prepareAttackRoll(html, rollName, weaponId) {
        let weapon = this.actor.items.get(weaponId);
        console.log(weapon)
        let skill = weapon.system.skill
        let bonus = 0;
        switch (weapon.system.actual_position) {
            case "0":
            case 0:
                if (skill === "catch_throw" || skill === "demolition") {
                    break;
                }
                ui.notifications.warn(`L'objet n'est pas utilisable`);
                return;
                break;
            case "1":
            case 1:
                bonus = weapon.system.melee;
                break;
            case "2":
            case 2:
                bonus = weapon.system.hip;
                break;
            case "3":
            case 3:
                bonus = weapon.system.ready;
                break;
            case "4":
            case 4:
                bonus = weapon.system.aim;
                break;
            default:
                ui.notifications.warn(`Une erreur innatendue est survenue. le statut "${weapon.system.actual_position}" n'existe pas.`);
                break;
        }
        ;
        if (skill === "demolition") {
            skill = "knowledges." + skill;
        } else {
            skill = "skills." + skill;
        }
        console.log(rollName);
        console.log(bonus);
        console.log(skill);
        this.preparePerksRoll(html, rollName, skill, weapon, bonus);
    }

    preparePerksRoll(html, rollName, perks, weapon, bonus) {
        let fullPerks = perks.split(".");
        let category = this.actor.system.perks[fullPerks[0]];
        let myPerk = category[fullPerks[1]];
        bonus -= -(myPerk.perso - (-myPerk.total_mod));
        switch (myPerk.type) {
            case "for":
                this.prepareRoll(html, rollName, "strength", weapon, bonus);
                break;
            case "dex":
                this.prepareRoll(html, rollName, "dexterity", weapon, bonus);
                break;
            case "int":
                this.prepareRoll(html, rollName, "intelligence", weapon, bonus);
                break;
            case "chr":
                this.prepareRoll(html, rollName, "charisma", weapon, bonus);
                break;
            case "per":
                this.prepareRoll(html, rollName, "perception", weapon, bonus);
                break;
            case "vol":
                this.prepareRoll(html, rollName, "willpower", weapon, bonus);
                break;
            case "san":
                this.prepareRoll(html, rollName, "health", weapon, bonus);
                break;
            case "dst":
                this.prepareRoll(html, rollName, "fate", weapon, bonus);
                break;
        }

    }

    prepareRoll(html, rollName, type, weapon = null, bonus = 0) {
        let Dices = this.actor.system.attributes[type];
        let popup = html.find("#ma_popup")[0];
        let content = html[0];
        const contentHeight = content.clientHeight;
        const scrollTop = content.scrollTop;

        const newPosition = scrollTop + (contentHeight / 2);

        popup.style.top = `${newPosition}px`

        popup.style.display = "block";
        let selectExertion = html.find("#exertionUse")[0];
        let selectd12 = html.find("#d12Selected")[0];
        let selectd10 = html.find("#d10Selected")[0];
        let selectd8 = html.find("#d8Selected")[0];
        html.find('#diceUse')[0].addEventListener('change', function () {
            if (html.find('#diceUse')[0].value === "true") {
                html.find(".diceToUse")[0].style.display = "none";

            } else {
                html.find(".diceToUse")[0].style.display = "block";
            }
        })
        while (selectExertion.options.length > 1) {
            selectExertion.remove(1);
        }
        while (selectd12.options.length > 0) {
            selectd12.remove(0);
        }
        while (selectd10.options.length > 0) {
            selectd10.remove(0);
        }
        while (selectd8.options.length > 0) {
            selectd8.remove(0);
        }
        for (let i = 0; i <= Math.min(4, Dices.d12); i++) {
            var option = document.createElement("option");
            option.value = i;
            option.text = i;
            selectd12.appendChild(option);
        }
        for (let i = 0; i <= Math.min(4, Dices.d10); i++) {
            var option = document.createElement("option");
            option.value = i;
            option.text = i;
            selectd10.appendChild(option);
        }
        for (let i = 0; i <= Math.min(4, Dices.d8); i++) {
            var option = document.createElement("option");
            option.value = i;
            option.text = i;
            selectd8.appendChild(option);
        }

        if (["strength", "dexterity", "health", "willpower"].includes(type)) {
            html.find(".exertionUse")[0].style.display = "block";

            for (let exertionNumber = 1; exertionNumber <= this.actor.system.exertion.actual; exertionNumber++) {
                var option = document.createElement("option");
                option.value = exertionNumber;
                option.text = exertionNumber;
                selectExertion.appendChild(option);
            }
        } else {
            html.find(".exertionUse")[0].style.display = "none";
        }

        let labelElement = html.find('.input-label.launchDice')[0];
        labelElement.firstElementChild.addEventListener('click', () => {
            this.prepareFormulae(html, rollName, type, weapon, bonus);
            html.find("#ma_popup")[0].style.display = 'none';
            const newElement = labelElement.firstElementChild.cloneNode(true);
            labelElement.replaceChild(newElement, labelElement.firstElementChild);
        })
    }

    updateDicesAvailable(html) {
        console.log("updateDicesAvailable");
        let selectd12 = html.find("#d12Selected")[0];
        let selectd10 = html.find("#d10Selected")[0];
        let selectd8 = html.find("#d8Selected")[0];
        let nbDicesSelected = selectd12.value - (-selectd10.value) - (-selectd8.value);
        let arrayDices = [selectd12, selectd10, selectd8];
        arrayDices.forEach(selectDice => {

            for (let option of selectDice.options) {
                console.log(option.value);
                if (option.value > selectDice.value) {
                    if (option.value - (-nbDicesSelected) - selectDice.value <= 4) {
                        option.style.display = "block";
                    } else {
                        option.style.display = "none";
                    }

                }
            }
        });
    }

    dragElement(element) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(element.id + "header")) {
            // Si un en-tête est présent, utilisez-le comme pointeur pour le déplacement
            document.getElementById(element.id + "header").onmousedown = dragMouseDown;
        } else {
            // Sinon, déplacez l'élément lui-même s'il est cliqué
            element.onmousedown = dragMouseDown;
        }

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // obtenir la position de la souris au début du déplacement
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // appeler une fonction chaque fois que le curseur bouge
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculer la nouvelle position de l'élément
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // définir la nouvelle position de l'élément
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // arrêter de bouger lorsque le bouton de la souris est relâché
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    async prepareFormulae(html, rollName, type, weapon, bonus) {
        let isBestDicesUsed = html.find('#diceUse')[0].value;
        let exertionUsed = parseInt(html.find('#exertionUse')[0].value);
        await this.actor.update({"system.exertion.actual": parseInt(this.actor.system.exertion.actual) - exertionUsed})
        let Dices = this.actor.system.attributes[type];
        let maxD8 = Dices.d8;
        let maxD10 = Dices.d10;
        let maxD12 = Dices.d12;
        let d8Used = 0;
        let d10Used = 0;
        let d12Used = 0;
        if (isBestDicesUsed === "true") {
            let complete = false;
            while (!complete) {
                if (maxD12 > 0) {
                    d12Used++;
                    maxD12--;
                } else if (maxD10 > 0) {
                    d10Used++;
                    maxD10--;
                } else {
                    d8Used++;
                    maxD8--;
                }
                if (d12Used + d10Used + d8Used === 4 || (maxD12 < 1 && maxD10 < 1 && maxD8 < 1)) {
                    complete = true;
                }
            }
        } else {
            d12Used = html.find("#d12Selected")[0].value;
            d10Used = html.find("#d10Selected")[0].value;
            d8Used = html.find("#d8Selected")[0].value;
        }
        let diceFormulae = [];
        while (d8Used > 0) {
            diceFormulae.push("1d8");
            d8Used--;
        }
        while (d10Used > 0) {
            diceFormulae.push("1d10");
            d10Used--;
        }
        while (d12Used > 0) {
            diceFormulae.push("1d12");
            d12Used--;
        }
        while (exertionUsed > 0) {
            diceFormulae.push("1d12");
            bonus -= -1
            exertionUsed--;
        }
        this.launchRoll(html, rollName, diceFormulae, false, weapon, bonus)
    }

    async launchRoll(html, rollName, diceFormulae, reroll, weapon, bonus, previousPosition = 0, pnj = false) {
        if (weapon !== null && previousPosition !== 0 && pnj === false) {
            await weapon.update({'system.actual_position': previousPosition});
        }
        let sound = new Audio('systems/scp_foundation/assets/dice.wav'); // Assurez-vous que le chemin est correct
        sound.play();
        let diceResults = [];
        let diceExplosions = [];
        let malus = 0;
        if (reroll) {
            rollName = "Reroll : " + rollName;
        }
        // Lancez les dés et stockez les résultats
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

        // Construit une chaîne de texte pour afficher les dés et les résultats
        let diceRollsHTML = `
        <div class="sheet-template sheet-scp level-` + this.actor.system.security_level + ` sheet-finished">
            <div class="sheet-template-head">
                <div class="sheet-black-logo">
                    <div class="sheet-logo"></div>
                    <div class="sheet-black-diamond"></div>
                </div>
                <h3 class="sheet-roll_name sheet-color-cond">` + rollName + `</h3>
                <h4 class="sheet-character_name sheet-color-cond">
                    <p>` + this.actor.name + `</p>
                </h4>
            </div>
            <div class="sheet-roll-content dice-tooltip">
                <div class="sheet-results dice-rolls">
                    <h5 class="sheet-color-cond" data-i18n="initial roll">initial roll</h5>
                    <div class="sheet-result-values">
        `;
        diceResults.forEach(diceActu => {
            let myClass = "roll die " + diceActu.formula.substring(1);
            if (diceActu.result === parseInt(diceActu.formula.substring(2))) {
                myClass = myClass + " max";
                diceExplosions.push(diceActu.formula);
            } else if (diceActu.result === 1) {
                myClass = myClass + " min";
                malus--;
            }
            diceRollsHTML = diceRollsHTML +
                `<span class="` + myClass + `">` + diceActu.result + `</span>`
        })
        diceRollsHTML = diceRollsHTML + `
                    </div>
                </div>
        </div> `
        if (diceExplosions.length > 0) {
            diceRollsHTML = diceRollsHTML + `
            <h5 class="sheet-color-cond" data-i18n="explosions">explosions</h5>
            `;
        }
        while (diceExplosions.length > 0) {
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

                // Stocke le résultat dans le tableau des résultats
                diceResults.push({
                    formula: diceActu,
                    result: result
                });// Stocke le résultat dans le tableau des résultats
                diceExplosionResult.push({
                    formula: diceActu,
                    result: result
                });
            }
            diceRollsHTML = diceRollsHTML + `
           <div class="sheet-roll-content dice-tooltip sheet-continuation">
                <div class="sheet-results dice-rolls">
                    <div class="sheet-result-values">
            `;


            diceExplosionResult.forEach(diceActu => {
                let myClass = "roll die " + diceActu.formula.substring(1);
                if (diceActu.result === parseInt(diceActu.formula.substring(2))) {
                    myClass = myClass + " max";
                    newExplosion.push(diceActu.formula);
                } else if (diceActu.result === 1) {
                    myClass = myClass + " min";
                    malus--;
                }
                diceRollsHTML = diceRollsHTML +
                    `<span class="` + myClass + `">` + diceActu.result + `</span>`

            })

            diceExplosions = newExplosion;
            diceRollsHTML = diceRollsHTML + `
                    </div>
                </div>
        </div> `
        }

        diceRollsHTML = diceRollsHTML + `
            <div class="sheet-total">
          <h5 class="sheet-high-label sheet-color-cond" data-i18n="highest 2">highest 2</h5>
          <span class="sheet-high-dice">
           <div class="sheet-roll-content dice-tooltip">
                    <div class="sheet-results dice-rolls">
        `;
        // Triez les résultats par ordre décroissant
        diceResults.sort((a, b) => b.result - a.result);

        // Gardez les deux meilleurs résultats
        let bestResults = diceResults.slice(0, 2);
        let bestResultsValue = 0;
        bestResults.forEach(diceActu => {
            let myClass = "roll die " + diceActu.formula.substring(1);
            if (diceActu.result === parseInt(diceActu.formula.substring(2))) {
                myClass = myClass + " max";
            } else if (diceActu.result === 1) {
                myClass = myClass + " min";
            }
            diceRollsHTML = diceRollsHTML +
                `<span class="` + myClass + `">` + diceActu.result + `</span>`;
            bestResultsValue = bestResultsValue - (-diceActu.result);
        })
        diceRollsHTML = diceRollsHTML + `
            </div>
            </div>
           </span>
           <span class="sheet-modifier" xmlns="http://www.w3.org/1999/html">
           <span class="bonus">` + bonus + `</span>
           </span>
           <span class="sheet-ones">
            <span class="malus">` + malus + `</span></span>
          <h5 class="sheet-total-label sheet-color-cond" data-i18n="total">total</h5>
          <span class="sheet-total-value">
          <span class="totalLaunch" >` + (bestResultsValue - (-bonus) - (-malus)) + `</span></span>
        </div>
        <div class="sheet-roll-buttons">`
        if (!reroll && !pnj) {
            diceRollsHTML +=

                `<span class="sheet-reverence-reroll"><input type="button" value="reroll" class="reroll"></span>`
        }
        if (weapon !== null) {
            diceRollsHTML += `
        <span class="sheet-roll-damage"><input type="button" value="Roll Damage" class="rollDamage"></span>`;
        }
        diceRollsHTML += `
        </div>  
      </div>
        `
        // Construit le contenu du message de chat avec HTML
        let messageContent = `<div>Les résultats des dés lancés sont :<br>${diceRollsHTML}</div>`;

        // Crée le message de chat
        let cible = html.find("#launchTarget")[0].value;
        let newMessage;
        let whisperTo = null;
        switch (cible) {
            case "Public":
                newMessage = ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: this.actor}),
                    content: messageContent,
                });
                break;
            case "Perso":
                whisperTo = [this.actor.id];
                newMessage = ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: this.actor}),
                    content: messageContent,
                    whisper: whisperTo

                });
                break;
            case "Hidden":
                whisperTo = ChatMessage.getWhisperRecipients("GM").concat([this.actor.id]);

                newMessage = ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: this.actor}),
                    content: messageContent,
                    whisper: whisperTo
                });
                break;
            case "GM":
                whisperTo = ChatMessage.getWhisperRecipients("GM");
                newMessage = ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: this.actor}),
                    content: messageContent,
                    whisper: whisperTo
                });
                break;
        }
        newMessage.then(async () => {
            if (pnj !== true) {
                let rerollArray = document.getElementsByClassName("reroll");
                let rerollButton = rerollArray[rerollArray.length - 1];
                rerollButton.addEventListener("click", async () => {
                    let reverence = this.actor.system.reverence;
                    if (reverence >= 2) {
                        await this.launchRoll(html, rollName, diceFormulae, true, weapon, bonus, previousPosition)
                        await this.actor.update({
                            "system.reverence": reverence - 2
                        });
                    } else {
                        ui.notifications.warn(`Vous n'avez pas assez de point de révérence`);

                    }
                });
            }
            let rollDamageArray = document.getElementsByClassName("rollDamage");
            let rollDamageButton = rollDamageArray[rollDamageArray.length - 1];
            if (!pnj && weapon !== null) {
                if (weapon.system.skill === "catch_throw" || weapon.system.skill === "demolition" || weapon.system.skill === "shotgun") {
                    rollDamageButton.addEventListener("click", async () => {
                        this.prepareRollDamage(html, weapon, previousPosition, rollName, pnj, whisperTo);
                    });
                } else {
                    rollDamageButton.addEventListener("click", async () => {
                        this.rollDamage(html, weapon, previousPosition, rollName, pnj, whisperTo);
                    });
                }
            } else {
                rollDamageButton.addEventListener("click", async () => {
                    this.rollDamage(html, weapon, previousPosition, rollName, pnj, whisperTo);
                });
            }
        }).then(async () => {
                if (weapon !== null && !pnj) {
                    previousPosition = weapon.system.actual_position;
                    if (parseInt(weapon.system.actual_position) > 1 && parseInt(weapon.system.actual_position) - parseInt(weapon.system.recoil.actual) <= 1) {
                        await weapon.update({'system.actual_position': "0"})
                    } else {
                        await weapon.update({'system.actual_position': "" + Math.max(0, parseInt(weapon.system.actual_position) - parseInt(weapon.system.recoil.actual))})
                    }
                }
            }
        );
    }

    async prepareRollDamage(html, weapon, previousPosition, rollName, pnj, whisperTo = null){
        //popup indiquant le nombre de dés à retirer
        //roll damage sans ces dés
        console.log(this.currentHtml[0].clientHeight);
        let popup = this.currentHtml.find("#rollDamage")[0];
        let content = this.currentHtml[0];
        const contentHeight = content.clientHeight;
        const scrollTop = content.scrollTop;

        const newPosition = scrollTop + (contentHeight / 2);

        popup.style.top = `${newPosition}px`

        popup.style.display = "block";

        this.currentHtml.find(".closeDamagePopup")[0].addEventListener('click', function () {
            popup.style.display = 'none';
            let launchDiceInput = this.currentHtml.find('.input-label.launchDamageDice')[0];

            const newElement = launchDiceInput.firstElementChild.cloneNode(true);
            launchDiceInput.replaceChild(newElement, launchDiceInput.firstElementChild);

        });

        let nbDiceToRemove = this.currentHtml.find("#deleteDice")[0];

        while (nbDiceToRemove.options.length > 1) {
            nbDiceToRemove.remove(1);
        }
        let delimiters = ["d", "D"];
        let regex = new RegExp(delimiters.join('|'));
        let nbDices = weapon.system.base_damage.split(regex);
        for (let nbDiceToRemoveValue = 1; nbDiceToRemoveValue <= parseInt(nbDices[0]); nbDiceToRemoveValue++) {
            var option = document.createElement("option");
            option.value = nbDiceToRemoveValue;
            option.text = nbDiceToRemoveValue;
            nbDiceToRemove.appendChild(option);
        }
        let labelElement = this.currentHtml.find('.input-label.launchDamageDice')[0];
        labelElement.firstElementChild.addEventListener('click', () => {
            let nbLaunch = nbDices[0] - this.currentHtml.find("#deleteDice")[0].value
            this.rollDamage(this.currentHtml, weapon, previousPosition, rollName, pnj, whisperTo, nbLaunch + "d"+nbDices[1]);
            this.currentHtml.find("#rollDamage")[0].style.display = 'none';
            const newElement = labelElement.firstElementChild.cloneNode(true);
            labelElement.replaceChild(newElement, labelElement.firstElementChild);
        })
    }


    async rollDamage(html, weapon, position, rollName, pnj, whisperTo= null, baseDamageValue = null) {
        let sound = new Audio('systems/scp_foundation/assets/dice.wav'); // Assurez-vous que le chemin est correct
        sound.play();
        if (pnj) {
            weapon.replace("&", "+");
            let roll = new Roll(weapon);
            await roll.evaluate();
            let damage = roll.total;
            let
                damageHTML = `
                <div class="sheet-template sheet-scp sheet-finished">
                    <div class="sheet-template-head sheet-element">
                        <div class="sheet-black-logo">
                            <div class="sheet-logo"></div>
                            <div class="sheet-black-diamond"></div>
                        </div>
                        <h3 class="sheet-roll_name sheet-color-cond">` + rollName + `</h3>
                        <h4 class="sheet-character_name sheet-color-cond">
                            <p>` + this.actor.name + `</p>
                        </h4>
                    </div>
                    <div class="sheet-damage">
                        <h5 class="sheet-x-label sheet-color-cond" data-i18n="total">Dégâts</h5><span class="sheet-x-damage"><span class="inlinerollresult showtip tipsy-n-right" title="Rolling 0[computed value] = 0">` + damage + `</span></span>
                    </div>
                </div>
        `
            // Crée le message de chat
            let messageContent = `<div>${damageHTML}</div>`;
            if(whisperTo === null){
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: this.actor}),
                    content: messageContent
                });
            }else{
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: this.actor}),
                    content: messageContent,
                    whisper: whisperTo
                });
            }
        } else {
            let baseDamageRoll;
            if(baseDamageValue === null){
                baseDamageRoll = new Roll(weapon.system.base_damage);
            }else{
                baseDamageRoll = new Roll(baseDamageValue);
            }
            await baseDamageRoll.evaluate(); // Évalue le résultat du lancer
            let baseDamage = baseDamageRoll.total; // Obtient le total du résultat
            let xFormula = "(" + weapon.system.x_damage + ")";
            if (position === "1") {
                let currentMeleeMult = html.find("#meleeMult")[0].value;
                xFormula = xFormula + "*" + currentMeleeMult;
            } else {
                let currentProjMult = html.find("#projMult")[0].value;
                xFormula = xFormula + "*" + currentProjMult;
            }
            let xDamageRoll = new Roll(xFormula);
            await xDamageRoll.evaluate(); // Évalue le résultat du lancer
            let xDamage = xDamageRoll.total; // Obtient le total du résultat
            let totalDamage = baseDamage - (-xDamage);

            let
                damageHTML = `
                <div class="sheet-template sheet-scp level-` + this.actor.system.security_level + ` sheet-finished">
                    <div class="sheet-template-head sheet-element">
                        <div class="sheet-black-logo">
                            <div class="sheet-logo"></div>
                            <div class="sheet-black-diamond"></div>
                        </div>
                        <h3 class="sheet-roll_name sheet-color-cond">` + rollName + `</h3>
                        <h4 class="sheet-character_name sheet-color-cond">
                            <p>` + this.actor.name + `</p>
                        </h4>
                        <h5 class="sheet-element">` + weapon.system.element + `</h5>
                    </div>
                    <div class="sheet-damage">
                        <h5 class="sheet-base-label sheet-color-cond" data-i18n="base">base</h5><span class="sheet-base-damage">` + baseDamage + `</span>
                        <h5 class="sheet-x-label sheet-color-cond" data-i18n="x">x</h5><span class="sheet-x-damage">` + xDamage + `</span>
                        <h5 class="sheet-total-label sheet-color-cond" data-i18n="total">total</h5><span class="sheet-total-damage">` + totalDamage + `</span>
                    </div>
                </div>
        `
            // Crée le message de chat
            let messageContent = `<div>${damageHTML}</div>`;

            if (whisperTo === null) {
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: this.actor}),
                    content: messageContent
                });
            } else {
                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({actor: this.actor}),
                    content: messageContent,
                    whisper: whisperTo
                });
            }
        }

    }

    async totalModUpdate(evt, perkSelected) {
        let perksName = perkSelected.name
        let perksNameTable = perksName.split(".");
        let perksType = this.actor.system.perks[perksNameTable[perksNameTable.length - 3]];
        let perksChanging = perksType[perksNameTable[perksNameTable.length - 2]];
        let perkToUpdate = "system.perks." + perksNameTable[perksNameTable.length - 3] + "." + perksNameTable[perksNameTable.length - 2] + ".total_mod";
        let updateBonus = {};
        updateBonus[perkToUpdate] = evt.target.value - (-perksChanging.bonus_mod);
        await this.actor.update(updateBonus);
    }

    async bonusAppearanceUpdate(evt) {
        let updateBonus = {};

        let appearance = evt.target.value;
        let reasoning = this.actor.system.reasoning;

        let negociate = 0, fashion = 0, leadership = 0, resist_distress = 0, intimidate = 0, disguise = 0,
            showmanship = 0;
        switch (appearance) {
            case "beau":
                negociate += 2;
                fashion += 1;
                leadership += 1;
                resist_distress -= 2;
                intimidate -= 1;
                disguise -= 1;
                break;
            case "attractif":
                negociate += 1;
                fashion += 1;
                intimidate -= 1;
                disguise -= 1;
                break;
            case "moyenne":
                disguise += 2;
                break;
            case "étrange":
                intimidate += 1;
                showmanship += 1
                disguise -= 2;
                break;
            case "effrayant":
                intimidate += 2;
                disguise += 1;
                resist_distress += 1;
                fashion -= 2;
                negociate -= 2;
                break;
        }
        if (reasoning === "naif") {
            resist_distress += 3;
        } else if (reasoning === "sceptique") {
            resist_distress += 2;
        } else if (reasoning === "ouvert d'esprit") {
            resist_distress -= 1;
        } else if (reasoning === "fou") {
            resist_distress -= 2;
        }

        updateBonus["system.perks.abilities.negociation_persuade.bonus_mod"] = negociate;
        updateBonus["system.perks.abilities.negociation_persuade.total_mod"] = this.actor.system.perks.abilities.negociation_persuade.self_mod - (-negociate);
        updateBonus["system.perks.knowledges.fashion_etiquette.bonus_mod"] = fashion;
        updateBonus["system.perks.knowledges.fashion_etiquette.total_mod"] = this.actor.system.perks.knowledges.fashion_etiquette.self_mod - (-fashion);
        updateBonus["system.perks.abilities.leadership.bonus_mod"] = leadership;
        updateBonus["system.perks.abilities.leadership.total_mod"] = this.actor.system.perks.abilities.leadership.self_mod - (-leadership);
        updateBonus["system.perks.abilities.resist_distress.bonus_mod"] = resist_distress;
        updateBonus["system.perks.abilities.resist_distress.total_mod"] = this.actor.system.perks.abilities.resist_distress.self_mod - (-resist_distress);
        updateBonus["system.perks.abilities.intimidate_taunt.bonus_mod"] = intimidate;
        updateBonus["system.perks.abilities.intimidate_taunt.total_mod"] = this.actor.system.perks.abilities.intimidate_taunt.self_mod - (-intimidate);
        updateBonus["system.perks.skills.disguise_blend_in.bonus_mod"] = disguise;
        updateBonus["system.perks.skills.disguise_blend_in.total_mod"] = this.actor.system.perks.skills.disguise_blend_in.self_mod - (-disguise);
        updateBonus["system.perks.skills.showmanship.bonus_mod"] = showmanship;
        updateBonus["system.perks.skills.showmanship.total_mod"] = this.actor.system.perks.skills.showmanship.self_mod - (-showmanship);
        await this.actor.update(updateBonus);
    }

    async bonusReasoningUpdate(evt) {
        let updateBonus = {};
        let reasoning = evt.target.value;
        let appearance = this.actor.system.appearance;
        let bonusCD = this.actor.system.reaction_defense.bonus;
        let updateCD = this.actor.system.reaction_defense.value;

        let initiative = 0, intuition = 0, occulte_scp_lore = 0, resist_distress = 0;
        console.log(reasoning);
        switch (reasoning) {
            case "naif":
                resist_distress += 3;
                initiative -= 3;
                intuition -= 3;
                occulte_scp_lore -= 2;
                updateCD -= -(15 - bonusCD);
                bonusCD = 15;
                break;
            case "sceptique":
                resist_distress += 2;
                initiative -= 2;
                intuition -= 2;
                updateCD -= -(12 - bonusCD);
                bonusCD = 12;
                break;
            case "scientifique":
                updateCD -= -(9 - bonusCD);
                bonusCD = 9;
                break;
            case "open-minded":
                resist_distress -= 1;
                initiative += 2;
                intuition += 2;
                updateCD -= -(6 - bonusCD);
                bonusCD = 6;
                break;
            case "fou":
                resist_distress -= 2;
                initiative += 3;
                intuition += 3;
                occulte_scp_lore += 2;
                updateCD -= -(3 - bonusCD);
                bonusCD = 3;
                break;
        }

        if (appearance === "beau") {
            console.log(resist_distress);
            resist_distress -= 2;
        } else if (appearance === "effrayant") {
            console.log(resist_distress);
            resist_distress += 1;
        }
        updateBonus["system.perks.abilities.resist_distress.bonus_mod"] = resist_distress;
        updateBonus["system.perks.abilities.resist_distress.total_mod"] = this.actor.system.perks.abilities.resist_distress.self_mod - (-resist_distress);
        updateBonus["system.perks.abilities.initiative.bonus_mod"] = initiative;
        updateBonus["system.perks.abilities.initiative.total_mod"] = this.actor.system.perks.abilities.initiative.self_mod - (-initiative);
        updateBonus["system.perks.abilities.intuition.bonus_mod"] = intuition;
        updateBonus["system.perks.abilities.intuition.total_mod"] = this.actor.system.perks.abilities.intuition.self_mod - (-intuition);
        updateBonus["system.perks.knowledges.occulte_scp_lore.bonus_mod"] = occulte_scp_lore;
        updateBonus["system.perks.knowledges.occulte_scp_lore.total_mod"] = this.actor.system.perks.knowledges.occulte_scp_lore.self_mod - (-occulte_scp_lore);
        updateBonus["system.cognitive_resistance.value"] = updateCD;
        updateBonus["system.cognitive_resistance.bonus"] = bonusCD;
        await this.actor.update(updateBonus);
    }

    async bonusBodyTypeUpdate(evt, html) {
        html.find('input[type="text"]').prop('disabled', true);

        let updateBonus = {};

        let bodyType = evt.target.value;
        let bonusHp = this.actor.system.hp.bonus;
        let updateHp = this.actor.system.hp.max;
        let bonusRD = this.actor.system.reaction_defense.bonus;
        let updateRD = this.actor.system.reaction_defense.value;

        switch (bodyType) {
            case "petit":
                updateHp -= -(0 - bonusHp);
                bonusHp = 0;
                updateRD -= -(6 - bonusRD);
                bonusRD = 6;
                break;
            case "mince":
                updateHp -= -(5 - bonusHp);
                bonusHp = 5;
                updateRD -= -(4 - bonusRD);
                bonusRD = 4;
                break;
            case "moyenne":
                updateHp -= -(10 - bonusHp);
                bonusHp = 10;
                updateRD -= -(3 - bonusRD);
                bonusRD = 3;
                break;
            case "lourd":
                updateHp -= -(15 - bonusHp);
                bonusHp = 15;
                updateRD -= -(2 - bonusRD);
                bonusRD = 2;
                break;
            case "bestial":
                updateHp -= -(20 - bonusHp);
                bonusHp = 20;
                updateRD -= -(0 - bonusRD);
                bonusRD = 0;
                break;
        }

        updateBonus["system.hp.max"] = updateHp;
        updateBonus["system.hp.bonus"] = bonusHp;
        updateBonus["system.reaction_defense.value"] = updateRD;
        updateBonus["system.reaction_defense.bonus"] = bonusRD;
        await this.actor.update(updateBonus);
        html.find('input[type="text"]').prop('disabled', false);

    }

    getItemFromEvent = (ev) => {
        const parent = $(ev.currentTarget).parents(".item");
        return this.actor.items.get(parent.data("itemId"));
    }

    async _onItemDelete(event) {
        const item = this.getItemFromEvent(event);
        if (item.type === "arme") {
            this.actor.deleteEmbeddedDocuments("Item", item.system.attachments);
        } else if (item.type === "accessoire") {
            let selectedWeapon = this.actor.items.get(item.system.idArme);
            let updateArme = {};
            let attachmentsList = selectedWeapon.system.attachments || [];
            attachmentsList = attachmentsList.filter(attachment => attachment !== item._id);
            await selectedWeapon.update({"system.attachments": attachmentsList});
            if(item.system.hold === true){
                updateArme["system.melee"] = selectedWeapon.system.melee - item.system.effect.melee;
                updateArme["system.hip"] = selectedWeapon.system.hip - item.system.effect.hip;
                updateArme["system.ready"] = selectedWeapon.system.ready - item.system.effect.ready;
                updateArme["system.aim"] = selectedWeapon.system.aim - item.system.effect.aim;
                updateArme["system.magazine.max"] = selectedWeapon.system.magazine.max - item.system.effect.magazine;
            }

            await selectedWeapon.update(updateArme);
            await this._updateRecoil(this.actor);
        }
        this.actor.deleteEmbeddedDocuments("Item", [item._id]);
    }

    async updateAccessoire(item, hold){
        let selectedWeapon = this.actor.items.get(item.system.idArme);
        let updateArme = {};
        if(hold){
            updateArme["system.melee"] = selectedWeapon.system.melee - (- item.system.effect.melee);
            updateArme["system.hip"] = selectedWeapon.system.hip - (- item.system.effect.hip);
            updateArme["system.ready"] = selectedWeapon.system.ready - (- item.system.effect.ready);
            updateArme["system.aim"] = selectedWeapon.system.aim - (- item.system.effect.aim);
            updateArme["system.magazine.max"] = selectedWeapon.system.magazine.max - (- item.system.effect.magazine);
        }else{

            updateArme["system.melee"] = selectedWeapon.system.melee - item.system.effect.melee;
            updateArme["system.hip"] = selectedWeapon.system.hip - item.system.effect.hip;
            updateArme["system.ready"] = selectedWeapon.system.ready - item.system.effect.ready;
            updateArme["system.aim"] = selectedWeapon.system.aim - item.system.effect.aim;
            updateArme["system.magazine.max"] = selectedWeapon.system.magazine.max - item.system.effect.magazine;

        }
        await selectedWeapon.update(updateArme);
        await this._updateRecoil(this.actor);

    }

    static async _updateRecoil(actorSelect) {
        const armes = actorSelect.items.filter(item => item.type === "arme");
        armes.map(async arme => {
            let updateArme = {};
            let recoil = arme.system.recoil.base;
            recoil -= actorSelect.system.recoil;
            let attachmentsList = arme.system.attachments;
            attachmentsList.map(attachmentId => {
                let attachment = actorSelect.items.get(attachmentId)
                if(attachment.system.hold){
                    recoil -= -attachment.system.effect.recoil;
                }
            })
            if (recoil < 0) {
                updateArme["system.recoil.actual"] = 0;
            } else {
                updateArme["system.recoil.actual"] = recoil;
            }
            await arme.update(updateArme);
        })
    }

    async add_weapon() {
        let weapon = {
            "attack": "",
            "to_hit_roll": "",
            "range": "",
            "damage": ""
        }
        let weaponsList = this.actor.system.weapons || [];
        weaponsList.push(weapon);
        await this.actor.update({"system.weapons": weaponsList});

    }

    async delete_weapon(elem) {
        let parent = elem.currentTarget.parentNode.parentNode;
        let id = parent.className.split("-")[1];

        let weaponsList = this.actor.system.weapons || [];
        let finalWeaponList = [];
        let i = 0;
        weaponsList.forEach(weapon => {
            if (i !== parseInt(id)) {
                finalWeaponList.push(weapon);
            }
            i++;
        })
        await this.actor.update({"system.weapons": finalWeaponList});

    }

    async updateWeapon(updatedElement) {
        let parent = updatedElement.parentNode.parentNode;
        let id = parent.className.split("-")[1];
        let weaponsList = this.actor.system.weapons || [];
        let weapon = weaponsList[parseInt(id)];
        switch (updatedElement.name) {
            case "attack":
                weapon.attack = updatedElement.value;
                break;
            case "hit_roll":
                weapon.to_hit_roll = updatedElement.value;
                break;
            case "range":
                weapon.range = updatedElement.value;
                break;
            case "damage":
                weapon.damage = updatedElement.value;
        }
        weaponsList[parseInt(id)] = weapon;

        await this.actor.update({"system.weapons": weaponsList});

    }

    preparePnjRoll(html, rollName, result) {
        let popup = html.find("#ma_popup")[0];
        let content = html[0];
        const contentHeight = content.clientHeight;
        const scrollTop = content.scrollTop;

        const newPosition = scrollTop + (contentHeight / 2);

        popup.style.top = `${newPosition}px`


        popup.style.display = "block";
        let selectExertion = html.find("#exertionUse")[0];

        while (selectExertion.options.length > 1) {
            selectExertion.remove(1);
        }

        html.find(".exertionUse")[0].style.display = "block";

        for (let exertionNumber = 1; exertionNumber <= this.actor.system.exertion; exertionNumber++) {
            var option = document.createElement("option");
            option.value = exertionNumber;
            option.text = exertionNumber;
            selectExertion.appendChild(option);
        }

        let labelElement = html.find('.input-label.launchDice')[0];
        labelElement.firstElementChild.addEventListener('click', () => {
            this.preparePnjFormula(html, rollName, result);
            html.find("#ma_popup")[0].style.display = 'none';
            const newElement = labelElement.firstElementChild.cloneNode(true);
            labelElement.replaceChild(newElement, labelElement.firstElementChild);
        })
        html.find(".closePopup")[0].addEventListener('click', function () {
            popup.style.display = 'none';
            let launchDiceInput = html.find('.input-label.launchDice')[0];

            const newElement = launchDiceInput.firstElementChild.cloneNode(true);
            launchDiceInput.replaceChild(newElement, launchDiceInput.firstElementChild);

        });
    }

    async preparePnjFormula(html, rollName, result) {
        let sortResult = result.split("$");
        let defaultFormula = sortResult[0];
        let damage;
        if (sortResult.length > 1) {
            damage = sortResult[1];
        } else {
            damage = null;
        }
        let delimiters = ["&", "+"];
        let regex = new RegExp(delimiters.map(delimiter => `\\${delimiter}`).join('|'), 'g');
        let newDelimiters = ["d", "D"];
        let newRegex = new RegExp(newDelimiters.join('|'));
        let splitFormula = defaultFormula.split(regex);
        let preparedFormula = [];
        splitFormula.forEach(formula => {
            let res = formula.split("-").map(element => element.trim());
            preparedFormula.push(res[0]);
            for(let i = 1; i< res.length; i++) {
                preparedFormula.push("-"+res[i]);
            }
        })
        let diceFormulae = [];
        let bonus = 0;
        let index = 0;
        while (index < preparedFormula.length) {
            if (preparedFormula[index].includes("Force")) {
                preparedFormula.push(...this.actor.system.attributes.strength.split(regex))
            } else if (preparedFormula[index].includes("Santé")) {
                preparedFormula.push(...this.actor.system.attributes.health.split(regex))
            } else if (preparedFormula[index].includes("Perception")) {
                preparedFormula.push(...this.actor.system.attributes.perception.split(regex))
            } else if (preparedFormula[index].includes("Intelligence")) {
                preparedFormula.push(...this.actor.system.attributes.intelligence.split(regex))
            } else if (preparedFormula[index].includes("Volonté")) {
                preparedFormula.push(...this.actor.system.attributes.willpower.split(regex))
            } else if (preparedFormula[index].includes("Dexterité")) {
                preparedFormula.push(...this.actor.system.attributes.dexterity.split(regex))
            } else if (preparedFormula[index].includes("Physique")) {
                preparedFormula.push(...this.actor.system.stats.physical.split(regex))
            } else if (preparedFormula[index].includes("Mental")) {
                preparedFormula.push(...this.actor.system.stats.mental.split(regex))
            } else if (preparedFormula[index].includes("Social")) {
                preparedFormula.push(...this.actor.system.stats.social.split(regex))
            } else if (preparedFormula[index].includes('d') || preparedFormula[index].includes("D")) {
                let formulaeDetail = preparedFormula[index].split(newRegex);
                if(parseInt(formulaeDetail[0])>0){
                    for (let i = 0; i < parseInt(formulaeDetail[0]); i++) {
                        let dice = "1d" + formulaeDetail[1];
                        diceFormulae.push(dice);
                    }
                }else{
                    for (let i = 0; i > parseInt(formulaeDetail[0]); i--) {
                        let dice = "-1d" + formulaeDetail[1];
                        diceFormulae.push(dice);
                    }
                }

            } else {
                bonus += parseFloat(preparedFormula[index])
            }
            index++;
        }

        let exertionUsed = parseInt(html.find('#exertionUse')[0].value);
        while (exertionUsed > 0) {
            diceFormulae.push("1d12");
            bonus += 1
            exertionUsed--;
        }
        this.launchRoll(html, rollName, diceFormulae, false, damage, bonus, 0, true)

    }

    // Fonction pour trier les items par nom
    async sortItems() {
        let items = this.actor.items.contents;
        let filteredItems = items.filter(item => !(item.type === "arme" || item.type === "accessoire"));

        // Trier les items par nom
        filteredItems.sort((a, b) => a.name.localeCompare(b.name));
        let listId = filteredItems.map(filteredItems => filteredItems.id);
        await this.actor.deleteEmbeddedDocuments("Item", listId);

        // Ajouter les items triés à l'acteur
        await this.actor.createEmbeddedDocuments("Item", filteredItems.map(item => ({
            _id: item.id,
            ...item.toObject() // Conserver les autres attributs des items
        })));
    }

    synchronizeTableColumnWidths() {
        // Sélectionner la table principale et la table des pièces jointes
        const itemTables = document.querySelectorAll('#tableArmes');
        const attachmentTables = document.querySelectorAll('.item-details');

        itemTables.forEach((itemTable, index) => {
            attachmentTables.forEach((attachmentTable) =>{
                if (!attachmentTable) return;

                // Sélectionner les en-têtes de colonnes
                const itemHeaders = itemTable.querySelectorAll('thead th');
                const attachmentHeaders = attachmentTable.querySelectorAll('tr td');

                // Synchroniser les largeurs des colonnes
                itemHeaders.forEach((itemHeader, columnIndex) => {
                    if (attachmentHeaders[columnIndex]) {
                        attachmentHeaders[columnIndex].style.width = getComputedStyle(itemHeader).width;
                    }
                });
            });

        });
    }
}
