"use strict";

$(function() {

console.log("ready!");

function Csv(filename, text) {
    this.filename = filename;
    let lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    this.names = lines[0].split(',').map(line => line.trim());
    let column_count = this.names.length;
    let row_count = lines.length - 1;
    this.values = this.names.map(name => new Float32Array(row_count));
    for(var r = 0; r < lines.length - 1; ++r) {
        let row = lines[r + 1].split(',').map(s => parseFloat(s));
        for(var c = 0; c < column_count; ++c)
            this.values[c][r] = row[c];
    }
}

Csv.prototype.getColumn = function(name) {
    let c = this.names.indexOf(name);
    return this.values[c];
}

function display_fps_chart(div, csvs) {
    let series = csvs.map(csv => {
        return {
            name: csv.filename,
            data: csv.getColumn('FPS')
        }
    });
    Highcharts.chart(div, {
        series: series,
        title: {text: 'FPS timeline'},
        yAxis: {
            title: { text: 'Frames Per Second' }
        },
        xAxis: {
            title: { text: 'Seconds since recording start' }
        },
        tooltip: {shared: true}
    });
}

function display(csvs) {
    console.log(csvs);
    display_fps_chart('fps-chart', csvs);
}

function open_csv(file, on_csv) {
    var reader = new FileReader();
    reader.onload = function() {
        on_csv(new Csv(file.name, reader.result));
    }
    reader.readAsText(file);
}

$('#filenames').change(function() {
    var csvs = [];
    let file_count = this.files.length;
    for(var i = 0; i < file_count; ++i) {
        open_csv(this.files[i], csv => {
            csvs.push(csv);
            if(csvs.length === file_count)
                display(csvs);
        });
    }
});

});
