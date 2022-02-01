const shell = require('electron').shell;
const path = require('path');

window.addEventListener('DOMContentLoaded', () => {

    document.getElementById("rad_graph_link").addEventListener("click", () => {
        shell.openPath(path.join(__dirname, "../assets/images/rad_graph.png"));
    });

    document.getElementById("length_distribution_ex1_link").addEventListener("click", () => {
        shell.openPath(path.join(__dirname, "../assets/images/length_distribution_ex1.png"));
    });

    document.getElementById("length_distribution_ex2_link").addEventListener("click", () => {
        shell.openPath(path.join(__dirname, "../assets/images/length_distribution_ex2.png"));
    });

    document.getElementById("length_distribution_ex3_link").addEventListener("click", () => {
        shell.openPath(path.join(__dirname, "../assets/images/length_distribution_ex3.png"));
    });

    document.getElementById("include_outliers_ex_link").addEventListener("click", () => {
        shell.openPath(path.join(__dirname, "../assets/images/include_outliers_ex.png"));
    });


    
})