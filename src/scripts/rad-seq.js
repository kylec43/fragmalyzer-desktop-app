//const electron = require('electron');

window.onload = async ()=>{

    //If the page is refreshed and it is checked, display 2nd enzyme input
    if(doubleDigestInput[0].checked){
        secondEnzymeBlock.removeClass("display-none");
        enzymeSite2[0].required = true;
    }

    /* Prevent icon anchor defaults. Prevents from going to top of page on click*/
    $("#icon-question-a").on("click", (event)=>{
        showAnalysisInfoPopup();
        return false;
    });

    $("#icon-question-g").on("click", (event)=>{
        showGraphInfoPopup();
        return false;
    });


    $("#rad_graph_link").on("click", () => {
        return false;
    });

    $("#length_distribution_ex1_link").on("click", () => {
        return false;
    });

    $("#length_distribution_ex2_link").on("click", () => {
        return false;
    });

    $("#length_distribution_ex3_link").on("click", () => {
        return false;
    });

    $("#include_outliers_ex_link").on("click", () => {
        return false;
    });
};


/*----------------------------- Input Elements -----------------------------*/
const enzymeSite = $('#enzyme_site');
const enzymeSite2 = $('#enzyme_site2');
const probability = $('#probability');
const lengthDistribution = $('#length_distribution');
const graphRangeMin = $('#graph_range_min');
const graphRangeMax = $('#graph_range_max');
const focusRangeMin = $('#focus_range_min');
const focusRangeMax = $('#focus_range_max');
const outlierInput = $('#outlier');
const doubleDigestInput = $('#doubleDigest');
const genomeFileInput = $('#genome_file');


/*----------------------------- Misc Elements -----------------------------*/
const analysisButton = $('#analysis_button');
const analysisLoadingBlock = $('#analysis_loading_block');
const progressBar = $('#progress_bar');
const fragmentTableContainer = $('#fragment_table_container');
const fragmentChartCanvas = $('#fragment_chart');
const secondEnzymeBlock = $("#secondEnzymeBlock");
const analysisForm = $('#analysis_form');

/* Chart/Graph Object */
let fragmentChartObject = null;


/*----------------------------- Input Utilies -----------------------------*/
function showRestrictionSite2(checkbox){
    if(checkbox.checked){
        secondEnzymeBlock.removeClass("display-none");
        enzymeSite2[0].required = true;
    } else {
        secondEnzymeBlock.addClass("display-none");
        enzymeSite2[0].required = false;
    }
}


function updateToFixed(){
    let value = parseFloat(probability.val());
    if(!isNaN(value) && value >= 0.001 && value <= 1.000){
        probability.val(value.toFixed(3));
    }
}


/* Popup Events */
function closeAnalysisInfoPopup(){
    $("#analysisInfoPopup").addClass("display-none");
    $("#infoShadow").addClass("display-none");
}

function showAnalysisInfoPopup(){
    $("#analysisInfoPopup").removeClass("display-none");
    $("#infoShadow").removeClass("display-none");
}

function closeGraphInfoPopup(){
    $("#graphInfoPopup").addClass("display-none");
    $("#infoShadow").addClass("display-none");
}

function showGraphInfoPopup(){
    $("#graphInfoPopup").removeClass("display-none");
    $("#infoShadow").removeClass("display-none");
}



/*----------------------------- Analysis Setup -----------------------------*/
async function performAnalysis(){

    if (analysisForm[0].checkValidity()){

        console.log("Start")
        try{

            /* String inputs to numbers */
            let lengthDistributionNumber = parseInt(lengthDistribution.val());
            let graphRangeMinNumber = parseInt(graphRangeMin.val());
            let graphRangeMaxNumber = parseInt(graphRangeMax.val());
            let focusRangeMinNumber = parseInt(focusRangeMin.val());
            let focusRangeMaxNumber = parseInt(focusRangeMax.val());
            let probabilityNumber = parseFloat(probability.val());

            /* Validate range inputs */
            if(graphRangeMaxNumber < graphRangeMinNumber){
                graphRangeMax.val(`${graphRangeMinNumber}`);
                graphRangeMaxNumber = graphRangeMinNumber;
            }

            if(focusRangeMaxNumber > graphRangeMaxNumber){
                focusRangeMax.val(`${graphRangeMaxNumber}`);
                focusRangeMaxNumber = graphRangeMaxNumber;
            } else if (focusRangeMaxNumber < graphRangeMinNumber){
                focusRangeMax.val(`${graphRangeMinNumber}`);
                focusRangeMaxNumber = graphRangeMinNumber;
            }

            if(focusRangeMinNumber > focusRangeMaxNumber){
                focusRangeMin.val(`${focusRangeMaxNumber}`);
                focusRangeMinNumber = focusRangeMaxNumber;
            } else if(focusRangeMinNumber < graphRangeMinNumber){
                focusRangeMin.val(`${graphRangeMinNumber}`);
                focusRangeMinNumber = graphRangeMinNumber;
            }


            /* Parse and put enzyme inputs into an array */
            restrictionEnzymes = [];
            restrictionEnzymes.push(parseRestrictionSite(enzymeSite.val()));

            if(doubleDigestInput[0].checked){
                console.log("TREY");
                restrictionEnzymes.push(parseRestrictionSite(enzymeSite2.val()));
            }
        

            /* Create config for analyzer */
            let radConfig = {
                genomeFile: genomeFileInput[0].files[0],
                restrictionEnzymes,
                probability: probabilityNumber,
                lengthDistribution: lengthDistributionNumber,
                graphRangeMin: graphRangeMinNumber,
                graphRangeMax: graphRangeMaxNumber,
                focusRangeMin: focusRangeMinNumber,
                focusRangeMax: focusRangeMaxNumber,
                includeOutliers: outlierInput[0].checked,
            }

            /* Create analyzer. Configure callbacks */
            const analyzer = new RadSequencingAnalyzer(radConfig);

            analyzer.onBegin(onBeginCallback);
            analyzer.onProgress(onProgressCallback);
            analyzer.onResult(onResultCallback);

            analyzer.onReadError(()=>{
                analysisLoadingBlock.style.display = "none";
                analysisButton.style.display = "block";
            });

            analyzer.analyze(genomeFileInput[0].files[0])
        } catch(e) {
            alert(e);
        }
    } else {
        analysisForm[0].reportValidity()                
    }
}


/*----------------------------- Analysis Setup Utilies -----------------------------*/
function parseRestrictionSite(site){
    const reg = new RegExp("[^\|ACTG]")
    let siteUpper = site.toUpperCase();

    const invalidCharIndex = siteUpper.search(reg);
    const pipes = siteUpper.match(/\|/g);
    const pipeCount = pipes !== null ? pipes.length : 0;

    if(pipeCount > 1 || invalidCharIndex !== -1){
        throw Error(`Invalid input for restriction site: ${site}`)
    } else {
        const pipeIndex = siteUpper.indexOf("|");
        let sliceOffset = null;
        if(pipeIndex !== -1){
            sliceOffset = pipeIndex;
            siteUpper = siteUpper.replace("|", "");
        } else {
            sliceOffset = siteUpper.length/2;
        }
        return {site: siteUpper, sliceOffset};
    }

}




function displayChart(fragmentDistributions) {
    const chartLabels = [];
    const chartData = [];
    const backgroundColor = [];
    const borderColor = [];

    for(let i = 0; i < fragmentDistributions.length; i++){

        chartLabels.push(fragmentDistributions[i].range);
        chartData.push(`${fragmentDistributions[i].count}`);
        if(fragmentDistributions[i].focusArea){
            backgroundColor.push('rgba(30, 130, 76, 0.2)');
            borderColor.push('rgba(30, 130, 76, 1)');
        } else {
            backgroundColor.push('rgba(54, 162, 235, 0.2)');
            borderColor.push('rgba(54, 162, 235, 1.0)');
        }

    }
    
    fragmentChartObject = new Chart(fragmentChartCanvas, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Fragments',
                data: chartData,
                backgroundColor,
                borderColor,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Fragment Length (bp)"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Fragment Count"
                    }
                }
            }
        }
    });
    
}



function onResultCallback(data){
    analysisLoadingBlock.addClass("display-none");
    analysisButton.removeClass("display-none");

    //Build Data Table
    const builder = new DataTableBuilder(data);
    builder.addTable(createTotalTable(data));
    builder.addTable(createGraphRangeTable(data));
    builder.addTable(createFocusRangeTable(data));
    builder.addTable(createInputPropertiesTable(data));
    fragmentTableContainer.html("");
    fragmentTableContainer.html(builder.build() + "<hr>");

    displayChart(data.fragmentDistributions);
}


function onProgressCallback(percentage) {
    progressBar.css("width", `${percentage}%`);
}


function onBeginCallback() {
    progressBar.css("width", "0%");
    analysisLoadingBlock.removeClass("display-none");
    analysisButton.addClass("display-none");
    fragmentTableContainer.html("");
    if(fragmentChartObject !== null) {
        console.log("Destroyed");
        fragmentChartObject.destroy();
    }
}


/*------------------- Table Creations -------------------*/

function createTotalTable(data){
    const table = {
        title: "Total",
        rows: [
            {
                isHeader: true,
                cols: [
                    {
                        text: "RS Count"
                    },
                    {
                        text: "Expected RS Slice Count"
                    },
                    {
                        text: "Actual RS Slice Count"
                    },
                    {
                        text: "Fragment Count"
                    },
                ]
            },
            {
                isHeader: false,
                cols: [
                    {
                        text: data.totalSiteCount
                    },
                    {
                        text: data.expectedSiteCount
                    },
                    {
                        text: data.actualSiteCount
                    },
                    {
                        text: data.fragmentCount
                    },
                ]
            }
        ]
    };

    if(data.restrictionEnzymes[1]){
        table.rows[0].cols.splice(1, 0, {
            text: "Conflict Sites"
        });

        table.rows[1].cols.splice(1, 0, {
            text: data.conflicts
        });
    }

    return table;
}


function createGraphRangeTable(data){
    const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (2 || -1) + '})?');

    return {
        title: "Graph Range",
        rows: [
            {
                isHeader: true,
                cols: [
                    {
                        text: "Fragment Count"
                    },
                    {
                        text: "Fragment Percentage"
                    },
                ]
            },
            {
                isHeader: false,
                cols: [
                    {
                        text: data.fragmentGraphRangeCount
                    },
                    {
                        text: `${(((data.fragmentGraphRangeCount)/data.fragmentCount)*100).toString().match(re)[0]}%`
                    },
                ]
            }
        ]
    };
}


function createFocusRangeTable(data){
    const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (2 || -1) + '})?');

    return {
        title: "Focus Range",
        rows: [
            {
                isHeader: true,
                cols: [
                    {
                        text: "Fragment Count"
                    },
                    {
                        text: "Fragment Percentage"
                    },
                ]
            },
            {
                isHeader: false,
                cols: [
                    {
                        text: data.fragmentFocusRangeCount
                    },
                    {
                        text: `${(((data.fragmentFocusRangeCount)/data.fragmentCount)*100).toString().match(re)[0]}%`
                    },
                ]
            }
        ]
    };

}


function createInputPropertiesTable(data){
    const table = {
        title: "Input Properties",
        rows: [
            {
                isHeader: true,
                cols: [
                    {
                        text: data.restrictionEnzymes[1] ? "Restriction Site #1" : "Restriction Site"
                    },
                    {
                        text: "Slice Probability"
                    },
                    {
                        text: "Graph Range"
                    },
                    {
                        text: "Focus Range"
                    },
                    {
                        text: "Length Distribution"
                    },
                    {
                        text: "Include Outliers"
                    },
                ]
            },
            {
                isHeader: false,
                cols: [
                    {
                        text: restrictionEnzymes[0].site
                    },
                    {
                        text: `${data.sliceProbability*100}%`
                    },
                    {
                        text: data.graphRangeMin.toString() + "-" + data.graphRangeMax.toString()
                    },
                    {
                        text: data.focusRangeMin.toString() + "-" + data.focusRangeMax.toString()
                    },
                    {
                        text: data.lengthDistribution
                    },
                    {
                        text: data.includeOutliers ? "Yes" : "No"
                    }
                ]
            }
        ]
    };


    if(restrictionEnzymes[1]){
        table.rows[0].cols.splice(1, 0, {
            text: "Restriction Site #2"
        });

        table.rows[1].cols.splice(1, 0, {
            text: restrictionEnzymes[1].site
        });

    }

    return table;
}