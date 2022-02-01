window.DataTableBuilder = class {

    constructor(){
        this.navbar = `    
        <nav class="navbar navbar-expand-sm navbar-dark bg-dark rad-navbar-data-tables">
            <a class="navbar-brand rad-navbar-brand-data-tables" href="#">Data Tables</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavData">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse rad-navbar-collapse-data-tables" id="navbarNavData">
                <ul class="navbar-nav" id="data_table_titles">
                </ul>
            </div>
        </nav>
        <hr>
        `;

        this.titles = [];
        this.tables = [];
        this.table_id = 0;
    }


    addTable({ title, rows }){

        this.titles.push(`
        <li class="nav-item rad-item" id="inputPropertiesItem${this.table_id}">
            <a class="nav-link table-link ${this.table_id === 0 ? 'active' : ''}" id="tableLink${this.table_id}" href="#" onclick="DataTableBuilder.showDataTable(${this.table_id})">${title}</a>
        </li>
        `);

        /*
        {
            rows: [
                {
                    isHeader: true,
                    cols: [
                        {
                            title: "",
                            text: ""
                        }
                    ],
                }
            ]
        }
        */

        const parser = new DOMParser();
        const tableHtml = `<table class="rad-data-table ${this.table_id === 0 ? '' : 'display-none'}" id="dataTable${this.table_id}"></table>`;
        const doc = parser.parseFromString(tableHtml, "text/html");
        const dataTable = doc.querySelector(`#dataTable${this.table_id}`);
        for(let row of rows){
            const isHeader = row.isHeader;
            const trNode = doc.createElement("tr");
            dataTable.appendChild(trNode);
            const tr = dataTable.lastElementChild;
            const colType = isHeader ? "th" : "td";
            for(let col of row.cols){
                tr.innerHTML += `
                    <${colType} class="${colType === 'th' ? 'rad-th' : 'rad-td'}">${col.text}</${colType}>
                `
            }
        }

        

        this.tables.push(dataTable.outerHTML);

        this.table_id++;

        return this;
    }


    build(){
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.navbar, "text/html");
        const titlesElem = doc.querySelector("#data_table_titles");
        for(let title of this.titles){
            titlesElem.innerHTML += title;
        }

        for(let table of this.tables){
            doc.body.innerHTML += table;
        }

        if(typeof dataTableClickEventActivated === "undefined"){
            doc.body.innerHTML += `
                <script>
                    const dataTableClickEventActivated = true;
                    $(".nav-link.table-link").on("click", (event)=>{
                        event.preventDefault();
                        return false;
                    });
                </script>
            `;
        }

        return doc.body.innerHTML;
    }

    static hideDataTables(){
        $(".rad-data-table").addClass("display-none")
    }

    static deactivateTableLinks(){
        $(".nav-link.table-link").removeClass("active");
    }

    static showDataTable(id){
        this.hideDataTables();
        this.deactivateTableLinks();
        $(`#dataTable${id}`).removeClass("display-none");
        $(`#tableLink${id}`).addClass("active");

    }
}