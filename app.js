"use strict";

$(function() {

function Csv(filename, text) {
    this.filename = filename;
    this.series_name = filename.replace(/\.csv$/i, '');
    this.series_color = null;
    this.series_offset = 0;

    let lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    this.names = lines[0].split(',').map(line => line.trim());

    let column_count = this.names.length;
    let row_count = lines.length - 1;
    this.values = this.names.map(name => new Float32Array(row_count));
    for(var r = 0; r < lines.length - 1; ++r) {
        let row = lines[r + 1].split(',').map(parseFloat);
        this.values.forEach((column, c) => column[r] = row[c]);
    }
}

Csv.prototype.getColumn = function(name) {
    return this.values[this.names.indexOf(name)];
}

function display_series_controls(csvs) {
    function append_control(row_div, label) {
        var div = $('<div class="col-xs-3"/>').appendTo(row_div);
        div = $('<div class="form-group"/>').appendTo(div);
        var label_div = $('<label>' + label + '</label>').appendTo(div);
        return div;
    }

    function update_charts(series_attribute, csv, csv_attribute) {
        return function() {
            let value = this.value;
            csv[csv_attribute] = value;
            var a = {};
            a[series_attribute] = value;
            Highcharts.charts.forEach(chart => {
                let series = chart.get(csv.filename);
                series.update(a);
            });
        }
    }

    function update_series_offset(csv) {
        return function() {
            let offset = parseInt(this.value);
            csv.series_offset = offset;
            Highcharts.charts.forEach(chart => {
                let series = chart.get(csv.filename);
                series.update({data: csv.getColumn(series.userOptions.column_name).slice(csv.series_offset)});
            });
        }
    }

    var div = $('#series-controls');
    csvs.forEach((csv, index) => {
        csv.series_color = Highcharts.theme.colors[index % Highcharts.theme.colors.length];
        var row_div = $('<div class="row"/>').appendTo(div);
        var filename_filename = $('<input type="text" class="form-control" disabled value="' + csv.filename + '"></input>').appendTo(append_control(row_div, "Filename:"));
        var series_name = $('<input type="text" class="form-control" value="' + csv.series_name + '"></input>').appendTo(append_control(row_div, "Series Name:"));
        var series_color = $('<input type="color" class="form-control" value="' + csv.series_color + '"></input>').appendTo(append_control(row_div, "Series Color:"));
        var series_offset = $('<input type="number" class="form-control" value="' + csv.series_offset + '" min="0" max="' + (csv.values[0].length - 1) + '"></input>').appendTo(append_control(row_div, "Offset:"));
        series_name.on('input', update_charts('name', csv, 'series_name'));
        series_color.on('input', update_charts('color', csv, 'series_color'));
        series_offset.on('input', update_series_offset(csv));
    });
}

function display_fps_chart(div, csvs) {
    let series = csvs.map(csv => {
        return {
            name: csv.series_name,
            data: csv.getColumn('FPS').slice(csv.series_offset),
            color: csv.series_color,
            id: csv.filename,
            column_name: 'FPS'
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

function display_fps_histogram(div, csvs) {
}

function display(csvs) {
    console.log(csvs);
    display_series_controls(csvs);
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
