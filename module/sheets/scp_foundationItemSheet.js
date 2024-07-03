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
}