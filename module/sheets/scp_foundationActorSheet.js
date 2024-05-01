export default class scp_foundationActorSheet extends ActorSheet{

    constructor(...args) {
        super(...args);
        this.data = null; // Variable pour stocker les données récupérées une seule fois
    }
    get template(){
        console.log(`scp_foundation | Récupération du fichier html ${this.actor.data.type}-sheet.`);

        return `systems/scp_foundation/templates/sheets/${this.actor.data.type}-sheet.html`;
    }

    async getData(options){
        //const data = await super.getData(options);
        this.data = await super.getData(options);
        //data.systemData = data.data.system;
        this.data.systemData = this.data.data.system;
        //data.descriptionHTML = await TextEditor.enrichHTML(data.systemData.description, {
        this.data.descriptionHTML = await TextEditor.enrichHTML(this.data.systemData.description, {
            secrets: this.document.isOwner,
            async: true
        });
        //console.log(data);
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
        let meritTable = html.find('.meritTile');
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
                this.selectDice(rollButton.value);
            })
        })
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
      //  this.updateDicesTiles(html);
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
        if(type == "exertion"){
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
        let meleeValue = Math.floor(strength.d10/2) -(- strength.d10%2) -(- strength.d12);
        let recoil = strength.d12;
        let projectionValue = Math.floor(perception.d10/2) -(- perception.d10%2) -(- perception.d12);
        let reactDef = perception.d10 -(- dexterity.d12) -(- intelligence.d10);
        let moveValue = 2 -(- dexterity.d12);
        let modAvailable = intelligence.d10/2
        let exertionMax = 1 - (-willpower.d10);
        let cognitive_value = exertionMax;
        let updateBonus = {};
        updateBonus["system.melee_multiplier.bonus"] = meleeValue;
        updateBonus["system.projection_multiplier.bonus"] = projectionValue;
        updateBonus["system.recoil"] = recoil;
        updateBonus["system.reaction_defense"] = reactDef;
        updateBonus["system.move_speed"] = moveValue;
        updateBonus["system.mod"] = modAvailable;
        updateBonus["system.exertion.max"] = exertionMax;
        updateBonus["system.cognitive_resistance"] = exertionMax;

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

    selectDice(type, bonus=0){
        console.log(type);
        console.log(this.actor.system.attributes[type]);
    }
}