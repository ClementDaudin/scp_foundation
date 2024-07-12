export default class scp_foundationItemSheet extends ItemSheet{
    get template(){
        console.log(`scp_foundation | Récupération du fichier html ${this.item.type}-sheet.`);

        return `systems/scp_foundation/templates/sheets/${this.item.type}-sheet.html`;
    }

    async getData(options){
        const data = await super.getData(options);
        data.systemData = data.data.system;
        data.descriptionHTML = await TextEditor.enrichHTML(data.systemData.description, {
            secrets: this.document.isOwner,
            async: true
        });
        console.log(data);
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        if(this.item.type==="arme") {
            this.updateArme(html);
        }
    }

    updateArme(html){
        html.find('input[type="text"]').prop('disabled', true);
        let skill = html.find('#skill')[0];
        let skill_selected = this.item.system.skill;
        let optionsSkill = skill.options;

        for (let i = 0; i < optionsSkill.length; i++) {
            if (optionsSkill[i].value === skill_selected) {
                optionsSkill[i].selected = true;
            } else {
                optionsSkill[i].selected = false;
            }
        }
        html.find('input[type="text"]').prop('disabled', false);
    }
}