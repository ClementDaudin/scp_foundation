export default class scp_foundationActorSheet extends ActorSheet{

    constructor(...args) {
        super(...args);
        this.data = null; // Variable pour stocker les données récupérées une seule fois
    }
    get template(){
        console.log(`scp_foundation | Récupération du fichier html ${this.actor.type}-sheet.`);

        return `systems/scp_foundation/templates/sheets/${this.actor.type}-sheet.html`;
    }

    async getData(options){
        this.data = await super.getData(options);
        this.data.systemData = this.data.data.system;
        this.data.descriptionHTML = await TextEditor.enrichHTML(this.data.systemData.description, {
            secrets: this.document.isOwner,
            async: true
        });
        console.log(this.data);
        return this.data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        this.updateDicesTiles(html);
        this.updateExertionSpan(html);
        this.updateTiles(html, "exertion");
        this.updateTiles(html, "reverence");
        this.updateTiles(html, "merit_point");
        this.updateOther(html);

        window.addEventListener('keydown',function(e) {
            if (e.keyIdentifier=='U+000A' || e.keyIdentifier=='Enter' || e.keyCode==13) {
                if (e.target.nodeName=='INPUT' && e.target.type=='text') {
                    e.preventDefault();

                    return false;
                }
            }
        }, true);
        console.log(`scp_foundation | Récupération des listeners.`);

        const radiosTable = html.find(".radio-item-system");
        const radios = Array.from(radiosTable);
        radios.forEach(radio => {
            radio.addEventListener('change', async function () {
                // Mettre à jour une variable ou faire autre chose ici
                const itemId = radio.getAttribute('name').replace('item', ''); // Récupère l'ID de l'item
                const value = radio.value; // Récupère la valeur sélectionnée du radio
                let arme = this.actor.items.get(itemId);
                await arme.update("system.actual_position", value);
            });
        });
        const personnelTable = html.find(".personnelButton");
        const personnel = Array.from(personnelTable);
        personnel.forEach(radio => {
            radio.addEventListener('change', async () => {
                await this.actor.update({"system.personnel_class": radio.value});
            });
            if(radio.value === this.actor.system.personnel_class){
                radio.checked = true;
            }
        });

        html.find(".item-delete").click(this._onItemDelete.bind(this));
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
            rollButton.addEventListener('click', () =>{
                this.prepareRoll(html, rollButton.name, rollButton.value);
            })
        })
        let perksTable = html.find('.perksRoller');
        let perksArray = Array.from(perksTable);
        perksArray.forEach((perksButton) => {
            perksButton.addEventListener('click', () =>{
                this.preparePerksRoll(html, perksButton.name, perksButton.value);
            })
        });

        let popup = html.find('#ma_popup')[0];
        html.find(".closePopup")[0].addEventListener('click', function() {
            popup.style.display = 'none';
            html.find('#diceUse')[0].value = "true";
            html.find(".diceToUse")[0].style.display = "none";
            let launchDiceInput = html.find('#launchDice')[0];
            launchDiceInput.parentNode.removeChild(launchDiceInput);

        });
        this.dragElement(popup);
        let buttonsTable = html.find('.popup-content select');
        let buttonsArray = Array.from(buttonsTable);

        buttonsArray.forEach(function(button) {
            button.addEventListener('mousedown', function(event) {
                event.stopPropagation();
            });
        });
        html.find("#d12Selected")[0].addEventListener('change',  () =>{
            this.updateDicesAvailable(html);
        })
        html.find("#d10Selected")[0].addEventListener('change',  () =>{
            this.updateDicesAvailable(html);
        })
        html.find("#d8Selected")[0].addEventListener('change', () =>{
            this.updateDicesAvailable(html);
        })

        let personnalModuleTable = html.find(".self_mod");
        let personnalModuleArray =  Array.from(personnalModuleTable);
        personnalModuleArray.forEach((personnalModule) =>{
            personnalModule.addEventListener("change", (evt)=>{
                this.totalModUpdate(evt, personnalModule);
            })
        })
        html.find("#reasoning")[0].addEventListener('change', (evt)=>{
            this.bonusReasoningUpdate(evt);
        });
        html.find("#body_type")[0].addEventListener('change', (evt)=>{
            this.bonusBodyTypeUpdate(evt, html);
        });
        html.find("#appearance")[0].addEventListener('change', (evt)=>{
            this.bonusAppearanceUpdate(evt);
        });
        html.find("#all-radio")[0].addEventListener('click', () =>{
            html.find("#charactere_data")[0].style.display = "block";
            html.find("#weapons")[0].style.display = "none";
        })
        html.find("#attacks-radio")[0].addEventListener('click', () =>{
            html.find("#charactere_data")[0].style.display = "none";
            html.find("#weapons")[0].style.display = "block";
        })

        const armesTable = html.find('.arme');
        const armesArray = Array.from(armesTable);

        armesArray.forEach(arme => {
            const toggleButton = arme.querySelector('.toggle-details');
            const detailsRow = arme.nextElementSibling;

            toggleButton.addEventListener('click', function() {
                if(detailsRow.style.display === "none"){
                    detailsRow.style.display = "table-row";
                }else{
                    detailsRow.style.display = "none";
                }
            });
        });
    }

    async buyDice(dice, html){
        html.find('input[type="text"]').prop('disabled', true); //avoid experience reset
        let d8 = this.actor.system.attributes.stock.d8;
        let d10 = this.actor.system.attributes.stock.d10;
        let d12 = this.actor.system.attributes.stock.d12;
        let experience = this.actor.system.experience
        switch (dice){
            case 8:
                if(experience >=100){
                    console.log("achat d8");
                    experience -= 100;
                    d8 +=1;
                }
                break;
            case 10:
                if(experience >=200){
                    console.log("achat d10");
                    experience -= 200;
                    d10 +=1;
                }
                break;
            case 12:
                if(experience >=500){
                    console.log("achat d12");
                    experience -= 500;
                    d12 +=1;
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
    async exchangeDice(diceClicked, html){
        html.find('input[type="text"]').prop('disabled', true);
        let diceElements = diceClicked.name.split("_");
        let diceNumber = diceElements[2];
        let diceType = diceElements[1];
        let diceValue = diceClicked.value
        let nbActuDice = this.actor.system.attributes[diceType];
        let nbActuDiceVal = nbActuDice[diceNumber];
        let nbRequis = diceValue - nbActuDiceVal;
        let stock = this.actor.system.attributes.stock[diceNumber];
        let isOk = nbRequis<=stock;
        let differenceInDice = 0;

        switch (diceNumber){
            case "d8":
                differenceInDice = (diceValue - nbActuDice["d8"])*3;
                break;
            case "d10":
                differenceInDice = (diceValue - nbActuDice["d10"])*6;
                isOk = isOk && nbActuDice["d8"]>=2*diceValue;
                break;
            case "d12":
                differenceInDice = (diceValue - nbActuDice["d12"])*16;
                isOk = isOk && nbActuDice["d10"]>=2*diceValue;
                break;
        }
        if(isOk){
            let diceNumberStockAttribute = "system.attributes.stock." + diceNumber;
            let diceTypeNumberAttribute = "system.attributes." + diceType + "." + diceNumber;
            let stockLeft = stock - nbRequis;
            let updateData = {};
            updateData[diceNumberStockAttribute] = stockLeft;
            updateData[diceTypeNumberAttribute] = diceValue;
            if(diceType === "health"){
                let actualHP = this.actor.system.hp.max;
                actualHP = actualHP -(-differenceInDice);
                updateData["system.hp.max"] = actualHP;
            }

            await this.actor.update(updateData);
            await this.diceBonus(html);

        }
        this.updateDicesTiles(html);
        html.find('input[type="text"]').prop('disabled', false);

    }



    updateDicesTiles(html){
        let diceTable = html.find('.diceTile');
        let diceArray = Array.from(diceTable);
        diceArray.forEach((diceTile) => {
            let diceElements = diceTile.name.split("_");
            let diceNumber = diceElements[2];
            let diceType = diceElements[1];
            let diceValue = diceTile.value;
            let nbActuDice = this.actor.system.attributes[diceType];
            let nbActuDiceVal = nbActuDice[diceNumber];

            if(parseInt(diceValue) <= parseInt(nbActuDiceVal)){
                diceTile.checked = true;
            }
            else{
                diceTile.checked = false;
            }
        })
    }
    async changeExertion(exertionClicked, html){
        html.find('input[type="text"]').prop('disabled', true);
        let nbMax = this.actor.system.exertion.max;
        if(parseInt(exertionClicked.value) <= parseInt(nbMax)){
            await this.actor.update({
                "system.exertion.actual": exertionClicked.value
            });

        }
        this.updateTiles(html, "exertion");
        html.find('input[type="text"]').prop('disabled', false);

    }
    async changeReverence(reverenceClicked, html){
       html.find('input[type="text"]').prop('disabled', true);
        await this.actor.update({
            "system.reverence": reverenceClicked.value
        });
        this.updateTiles(html, "reverence");
        html.find('input[type="text"]').prop('disabled', false);

    }
    async changeMerit(meritClicked, html){
       html.find('input[type="text"]').prop('disabled', true);
        await this.actor.update({
            "system.merit_point": meritClicked.value
        });
        this.updateTiles(html, "merit_point");
        html.find('input[type="text"]').prop('disabled', false);

    }
    updateTiles(html, type){
        let tilesTable = html.find('.' + type + 'Tile');
        let tilesArray = Array.from(tilesTable);
        let nbTiles = 0;
        if(type === "exertion"){
            nbTiles = this.actor.system.exertion.actual;
        }else{
            nbTiles = this.actor.system[type];
        }
        tilesArray.forEach((tile) => {
            let tileValue = tile.value;
            if(parseInt(tileValue) <= parseInt(nbTiles)){
                tile.checked = true;
            }
            else{
                tile.checked = false;
            }
        })
    }
    updateExertionSpan(html){
        let exertionSpan = html.find('.exertionMax');
        let exertionArray = Array.from(exertionSpan);
        let nbMax = this.actor.system.exertion.max-(-1); //avoid concatenation
        for(let i = nbMax; i<8; i++){
            let exertionSpan = html.find('#exertionMax'+i);
            exertionSpan.css('background-color', 'white');

        }
    }

    async diceBonus(html){
        html.find('input[type="text"]').prop('disabled', true);
        let strength = this.actor.system.attributes.strength;
        let perception = this.actor.system.attributes.perception;
        let dexterity = this.actor.system.attributes.dexterity;
        let intelligence = this.actor.system.attributes.intelligence;
        let willpower = this.actor.system.attributes.willpower;
        let awareness = this.actor.system.perks.abilities.awareness_reaction.perso - (-this.actor.system.perks.abilities.awareness_reaction.total_mod);
        let meleeValue = Math.floor(strength.d10/2) -(- strength.d10%2) -(- strength.d12)+1;
        let recoil = strength.d12;
        let projectionValue = Math.floor(perception.d10/2) -(- perception.d10%2) -(- perception.d12)+1;
        let reactDef = perception.d10 -(- dexterity.d12) -(- intelligence.d10) - (- awareness) - (- this.actor.system.reaction_defense.bonus);
        let moveValue = 2 -(- dexterity.d12);
        let modAvailable = intelligence.d10/2
        let exertionMax = 1 - (-willpower.d10);
        let self_controle = this.actor.system.perks.abilities.self_controle.perso - (-this.actor.system.perks.abilities.self_controle.total_mod);
        let cognitive_value = exertionMax - (- this.actor.system.cognitive_resistance.bonus) - (- self_controle) ;
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

        html.find('input[type="text"]').prop('disabled', false);

    }

    updateOther(html){
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

    preparePerksRoll(html, rollName, perks){
        let fullPerks = perks.split(".");
        let category = this.actor.system.perks[fullPerks[0]];
        let myPerk = category[fullPerks[1]];
        let bonus = myPerk.perso - (-myPerk.total_mod);
        switch (myPerk.type){
            case "for":
                this.prepareRoll(html, rollName, "strength", bonus);
                break;
            case "dex":
                this.prepareRoll(html, rollName, "dexterity", bonus);
                break;
            case "int":
                this.prepareRoll(html, rollName, "intelligence", bonus);
                break;
            case "chr":
                this.prepareRoll(html, rollName, "charisma", bonus);
                break;
            case "per":
                this.prepareRoll(html, rollName, "perception", bonus);
                break;
            case "vol":
                this.prepareRoll(html, rollName, "willpower", bonus);
                break;
            case "san":
                this.prepareRoll(html, rollName, "health", bonus);
                break;
            case "dst":
                this.prepareRoll(html, rollName, "fate", bonus);
                break;
        }

    }

    prepareRoll(html, rollName, type, bonus=0){
        let Dices = this.actor.system.attributes[type];
        let popup = html.find("#ma_popup")[0];
        popup.style.display = "block";
        let selectExertion = html.find("#exertionUse")[0];
        let selectd12 = html.find("#d12Selected")[0];
        let selectd10 = html.find("#d10Selected")[0];
        let selectd8 = html.find("#d8Selected")[0];
        html.find('#diceUse')[0].addEventListener('change', function (){
            if(html.find('#diceUse')[0].value === "true"){
                html.find(".diceToUse")[0].style.display = "none";

            }else{
                html.find(".diceToUse")[0].style.display = "block";
            }
        })
        while (selectExertion.options.length > 0) {
            selectExertion.remove(0);
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
        for(let i = 0; i<=Math.min(4, Dices.d12); i++){
            var option = document.createElement("option");
            option.value = i;
            option.text = i;
            selectd12.appendChild(option);
        }
        for(let i = 0; i<=Math.min(4, Dices.d10); i++){
            var option = document.createElement("option");
            option.value = i;
            option.text = i;
            selectd10.appendChild(option);
        }
        for(let i = 0; i<=Math.min(4, Dices.d8); i++){
            var option = document.createElement("option");
            option.value = i;
            option.text = i;
            selectd8.appendChild(option);
        }

        if(["strength", "dexterity", "health", "willpower"].includes(type)){
            html.find(".exertionUse")[0].style.display="block";

            for(let exertionNumber = 0; exertionNumber<=this.actor.system.exertion.actual; exertionNumber++){
                var option = document.createElement("option");
                option.value = exertionNumber;
                option.text = exertionNumber;
                selectExertion.appendChild(option);
            }
        }
        else{
            html.find(".exertionUse")[0].style.display="none";
        }
        let nouveauLaunchDiceInput = document.createElement('input');
        nouveauLaunchDiceInput.name = 'launchDice';
        nouveauLaunchDiceInput.title = '@{launchDice}';
        nouveauLaunchDiceInput.id = 'launchDice';
        let labelElement = html.find('.input-label.launchDice')[0];
        labelElement.appendChild(nouveauLaunchDiceInput);
        nouveauLaunchDiceInput.addEventListener('click', () =>{
            this.prepareFormulae(html, rollName, type, bonus);
            html.find("#ma_popup")[0].style.display = 'none';
            html.find('#diceUse')[0].value = "true";
            html.find(".diceToUse")[0].style.display = "none";
            nouveauLaunchDiceInput.parentNode.removeChild(nouveauLaunchDiceInput);
        })
    }

    updateDicesAvailable(html){
        console.log("updateDicesAvailable");
        let selectd12 = html.find("#d12Selected")[0];
        let selectd10 = html.find("#d10Selected")[0];
        let selectd8 = html.find("#d8Selected")[0];
        let nbDicesSelected = selectd12.value - (-selectd10.value) - (- selectd8.value);
        let arrayDices = [selectd12, selectd10, selectd8];
        arrayDices.forEach(selectDice => {

            for (let option of selectDice.options) {
                console.log(option.value);
                if(option.value > selectDice.value){
                    if(option.value - (-nbDicesSelected) - selectDice.value <=4){
                        option.style.display = "block";
                    }
                    else{
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

    async prepareFormulae(html, rollName, type, bonus) {
        let isBestDicesUsed = html.find('#diceUse')[0].value;
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
        this.launchRoll(html, rollName, diceFormulae, type, bonus)
    }

    async launchRoll(html, rollName, diceFormulae, type, bonus){
        console.log(this.actor);
        let diceResults = [];
        let diceExplosions = [];
        let malus = 0;
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
        <div class="sheet-template sheet-scp level-` + this.actor.system.security_level+` sheet-finished">
            <div class="sheet-template-head">
                <div class="sheet-black-logo">
                    <div class="sheet-logo"></div>
                    <div class="sheet-black-diamond"></div>
                </div>
                <h3 class="sheet-roll_name sheet-color-cond">`+ rollName + `</h3>
                <h4 class="sheet-character_name sheet-color-cond">
                    <p>`+this.actor.name+`</p>
                </h4>
            </div>
            <div class="sheet-roll-content dice-tooltip">
                <div class="sheet-results dice-rolls">
                    <h5 class="sheet-color-cond" data-i18n="initial roll">initial roll</h5>
                    <div class="sheet-result-values">
        `;
        diceResults.forEach(diceActu  => {
            let myClass = "roll die "+diceActu.formula.substring(1);
            if(diceActu.result === parseInt(diceActu.formula.substring(2))){
                myClass = myClass + " max";
                diceExplosions.push(diceActu.formula);
            }
            else if (diceActu.result === 1){
                myClass = myClass + " min";
                malus--;
            }
            diceRollsHTML = diceRollsHTML +
                `<span class="`+ myClass + `">`+ diceActu.result +`</span>`
        })
        diceRollsHTML = diceRollsHTML + `
                    </div>
                </div>
        </div> `
        if(diceExplosions.length > 0){
            diceRollsHTML = diceRollsHTML + `
            <h5 class="sheet-color-cond" data-i18n="explosions">explosions</h5>
            `;
        }
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


            diceExplosionResult.forEach(diceActu  => {
                let myClass = "roll die "+diceActu.formula.substring(1);
                if(diceActu.result === parseInt(diceActu.formula.substring(2))){
                    myClass = myClass + " max";
                    newExplosion.push(diceActu.formula);
                }
                else if (diceActu.result === 1){
                    myClass = myClass + " min";
                    malus--;
                }
                diceRollsHTML = diceRollsHTML +
                    `<span class="`+ myClass + `">`+ diceActu.result +`</span>`

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
        bestResults.forEach(diceActu  => {
            let myClass = "roll die "+diceActu.formula.substring(1);
            if(diceActu.result === parseInt(diceActu.formula.substring(2))){
                myClass = myClass + " max";
            }
            else if (diceActu.result === 1){
                myClass = myClass + " min";
            }
            diceRollsHTML = diceRollsHTML +
                `<span class="`+ myClass + `">`+ diceActu.result +`</span>`;
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
            <span class="malus">`+ malus +`</span></span>
          <h5 class="sheet-total-label sheet-color-cond" data-i18n="total">total</h5>
          <span class="sheet-total-value">
          <span class="totalLaunch" >`+ (bestResultsValue - (-bonus) - (-malus)) +`</span></span>
        </div>
        <div class="sheet-roll-buttons"><span class="sheet-reverence-reroll"><input type="button" value="reroll" class="reroll" onclick="(function() {
            console.log('Bouton reroll cliqué !');
            // Ajoutez votre code ici pour gérer le clic sur le bouton reroll
        })()"></span>
        </div>
        <div class="sheet-description">
        </div>
      </div>
        `
        // Construit le contenu du message de chat avec HTML
        let messageContent = `<div>Les résultats des dés lancés sont :<br>${diceRollsHTML}</div>`;

        // Crée le message de chat
        let newMessage = ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: messageContent,
        });
        newMessage.then(async () => {
            let rerollArray = document.getElementsByClassName("reroll");
            let rerollButton = rerollArray[rerollArray.length - 1];
            rerollButton.addEventListener("click", async () => {
                let reverence = this.actor.system.reverence;
                if (reverence >= 2) {
                    this.launchRoll(html, rollName, diceFormulae, type, bonus)
                    await this.actor.update({
                        "system.reverence": reverence - 2
                    });
                }
            });
        })
    }

    async totalModUpdate(evt, perkSelected) {
        let perksName = perkSelected.name
        let perksNameTable = perksName.split(".");
        let perksType = this.actor.system.perks[perksNameTable[perksNameTable.length-3]];
        let perksChanging = perksType[perksNameTable[perksNameTable.length-2]];
        let perkToUpdate = "system.perks."+perksNameTable[perksNameTable.length-3]+"."+perksNameTable[perksNameTable.length-2]+".total_mod";
        let updateBonus = {};
        updateBonus[perkToUpdate] = evt.target.value - (- perksChanging.bonus_mod);
        await this.actor.update(updateBonus);
    }
    async bonusAppearanceUpdate(evt){
        let updateBonus = {};

        let appearance = evt.target.value;
        let reasoning = this.actor.system.reasoning;

        let negociate = 0, fashion = 0, leadership = 0, resist_distress = 0, intimidate = 0, disguise = 0, showmanship = 0;
        switch (appearance) {
            case "beau":
                negociate+=2;
                fashion+=1;
                leadership+=1;
                resist_distress-=2;
                intimidate-=1;
                disguise-=1;
                break;
            case "attractif":
                negociate+=1;
                fashion+=1;
                intimidate-=1;
                disguise-=1;
                break;
            case "moyenne":
                disguise+=2;
                break;
            case "étrange":
                intimidate+=1;
                showmanship+=1
                disguise-=2;
                break;
            case "effrayant":
                intimidate+=2;
                disguise+=1;
                resist_distress+=1;
                fashion-=2;
                negociate-=2;
                break;
        }
        if (reasoning === "naif"){
            resist_distress+=3;
        }
        else if(reasoning === "sceptique"){
            resist_distress+=2;
        }
        else if(reasoning === "ouvert d'esprit"){
            resist_distress-=1;
        }
        else if(reasoning === "fou"){
            resist_distress-=2;
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
    async bonusReasoningUpdate(evt){
        let updateBonus = {};
        let reasoning = evt.target.value;
        let appearance = this.actor.system.appearance;
        let bonusCD = this.actor.system.reaction_defense.bonus;
        let updateCD = this.actor.system.reaction_defense.value;

        let initiative = 0, intuition = 0, occulte_scp_lore = 0, resist_distress = 0;
        console.log(reasoning);
        switch (reasoning) {
            case "naif":
                resist_distress+=3;
                initiative-=3;
                intuition-=3;
                occulte_scp_lore-=2;
                updateCD -= -(15 - bonusCD);
                bonusCD = 15;
                break;
            case "sceptique":
                resist_distress+=2;
                initiative-=2;
                intuition-=2;
                updateCD -= -(12 - bonusCD);
                bonusCD = 12;
                break;
            case "scientifique":
                updateCD -= -(9 - bonusCD);
                bonusCD = 9;
                break;
            case "open-minded":
                resist_distress-=1;
                initiative+=2;
                intuition+=2;
                updateCD -= -(6 - bonusCD);
                bonusCD = 6;
                break;
            case "fou":
                resist_distress-=2;
                initiative+=3;
                intuition+=3;
                occulte_scp_lore+=2;
                updateCD -= -(3 - bonusCD);
                bonusCD = 3;
                break;
        }

        if (appearance === "beau"){
            console.log(resist_distress);
            resist_distress-=2;
        }
        else if(appearance === "effrayant"){
            console.log(resist_distress);
            resist_distress+=1;
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
    async bonusBodyTypeUpdate(evt, html){
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
        } else if (item.type === "attachment") {
            let selectedWeapon = this.actor.items.get(item.system.idArme);
            let updateArme = {};
            updateArme["system.recoil"] = selectedWeapon.system.recoil - item.system.effect.recoil;
            updateArme["system.melee"] = selectedWeapon.system.melee - item.system.effect.melee;
            updateArme["system.hip"] = selectedWeapon.system.hip - item.system.effect.hip;
            updateArme["system.ready"] = selectedWeapon.system.ready - item.system.effect.ready;
            updateArme["system.aim"] = selectedWeapon.system.aim - item.system.effect.aim;
            updateArme["system.clip_size"] = selectedWeapon.system.clip_size - item.system.effect.clip_size;
            await selectedWeapon.update(updateArme);
        }
        this.actor.deleteEmbeddedDocuments("Item", [item._id]);
    }
}