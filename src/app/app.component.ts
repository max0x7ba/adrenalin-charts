import { Component } from '@angular/core';
import { DataAccess, Csv } from './data-access.service'
import { Chart } from 'angular-highcharts';
import { Options } from 'highcharts';

declare var require: any;
const Highcharts = require('highcharts');
Highcharts.setOptions({
    credits: {enabled: false},
    chart: {
        backgroundColor: "#F8F9F9"
    }
});

const series_colors = ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'];

function cumulative_histogram(values: Float32Array) {
    values = values.slice();
    values.sort((a, b) => b - a);
    let step = values.length / 100;
    let histogram = new Array(100);
    for(var i = 1; i <= 100; ++i) {
        let j = Math.max(0, Math.ceil(i * step) - 1);
        histogram[i - 1] = [i, values[j]];
    }
    return histogram;
}

function descriptive_stats(values: Float32Array): object {
    values = values.slice();
    values.sort();
    let min_1 = Math.ceil(values.length / 100);
    let values_1 = values.slice(0, min_1);
    let values_99 = values.slice(min_1);
    let min = values[0];
    let sum_1 = values_1.reduce((a, b) => a + b);
    let sum_99 = values_99.reduce((a, b) => a + b);
    let avg = (sum_1 + sum_99) / values.length;
    let avg_99 = sum_99 / values_99.length;
    let l = values.length;
    let median = l % 2
        ? (values[Math.floor(l / 2)] + values[Math.ceil(l / 2)]) / 2
        : values[l / 2]
        ;
    return {
        "minumum": min,
        "median": median,
        "average": Math.round(avg * 10) / 10,
        "99% average": Math.round(avg_99 * 10) / 10
    };
}

const descriptive_stats_names = Object.keys(descriptive_stats(new Float32Array(2)));

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
    csvs: Csv[] = null;
    fps_avg_chart: Chart = null;
    fps_chart: Chart = null;
    fps_histogram_chart: Chart = null;

    constructor(private data_access: DataAccess) {
        data_access.csvs.subscribe(csvs => this.on_csvs(csvs));
    }

    private display_fps_chart(csvs: Csv[]) {
        let series = csvs.map(csv => {
            return {
                name: csv.series_name,
                data: csv.columns['FPS'].slice(csv.series_offset),
                color: csv.series_color,
                id: csv.filename,
                column_name: 'FPS',
                transform: a => a
            }
        });
        this.fps_chart = new Chart({
            plotOptions: {
                line: {
                    marker: { enabled: false }
                }
            },
            series: series,
            title: {text: 'FPS timeline'},
            yAxis: {
                title: { text: 'Frames Per Second' },
                plotLines: [
                    {
                        color: 'red',
                        value: 30,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { text: "30 FPS" }
                    },
                    {
                        color: 'green',
                        value: 60,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { text: "60 FPS" }
                    }
                ]
            },
            xAxis: {
                title: { text: 'Seconds since recording start' }
            },
            tooltip: {
                shared: true,
                valueSuffix: ' FPS'
            }
        });
    }

    private display_fps_histogram(csvs: Csv[]) {
        let series = csvs.map(csv => {
            return {
                name: csv.series_name,
                data: cumulative_histogram(csv.columns['FPS'].slice(csv.series_offset)),
                color: csv.series_color,
                id: csv.filename,
                column_name: 'FPS',
                transform: cumulative_histogram
            }
        });
        this.fps_histogram_chart = new Chart({
            plotOptions: {
                line: {
                    marker: { enabled: false }
                }
            },
            series: series,
            title: { text: 'Cumulative FPS histogram' },
            yAxis: {
                title: { text: 'Frames Per Second' },
                plotLines: [
                    {
                        color: 'red',
                        value: 30,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { text: "30 FPS" }
                    },
                    {
                        color: 'green',
                        value: 60,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { text: "60 FPS" }
                    }
                ]
            },
            xAxis: {
                title: { text: 'Percent' }
            },
            tooltip: {
                shared: true,
                valueSuffix: ' FPS'
            }
        });
    }

    private display_fps_avg_chart(csvs: Csv[]) {
        let make_series_fn = csvs => {
            let stats = csvs.map(csv => descriptive_stats(csv.columns['FPS'].slice(csv.series_offset)));
            let series = descriptive_stats_names.map(stat_name => {
                return [
                    {
                        name: stat_name,
                        data: stats.map((stat, i) => {
                            let csv = csvs[i];
                            return {
                                y: stat[stat_name],
                                name: csv.series_name,
                                color: csv.series_color
                            };
                        })
                    }
                ];
            });
            return [].concat.apply([], series);;
        };

        this.fps_avg_chart = new Chart(<Options>{
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                },
                series: {
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                }
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'top',
                floating: true,
            },
            chart: { type: 'bar' },
            series: make_series_fn(csvs),
            update_fn: chart => chart.update({
                series: make_series_fn(csvs)
            }),
            title: { text: 'Average FPS' },
            xAxis: {
                type: 'category',
                title: { text: null }
            },
            yAxis: {
                title: { text: 'Frames Per Second' }
            },
            tooltip: {
                shared: true,
                valueSuffix: ' FPS',
                followPointer: true
            }
        });
    }

    private on_csvs(csvs: Csv[]) {
        console.log("on_csvs", csvs);
        for(var i = 0; i < csvs.length; ++i)
            csvs[i].series_color = series_colors[i % series_colors.length];
        this.csvs = csvs;
        this.display_fps_chart(csvs);
        this.display_fps_histogram(csvs);
        this.display_fps_avg_chart(csvs);
    }

    update_name(csv: Csv, name: string) {
        csv.series_name = name;
        this.update_chars(csv, { name: name });
    }

    update_color(csv: Csv, color: string) {
        csv.series_color = color;
        this.update_chars(csv, { color: color });
    }

    update_offset(csv: Csv, offset: string) {
        csv.series_offset = parseInt(offset);
        Highcharts.charts.forEach(chart => {
            let update_fn = chart.userOptions.update_fn;
            if(update_fn) {
                update_fn(chart);
            }
            else {
                let series = chart.get(csv.filename);
                let f = series.userOptions.transform;
                series.update({data: f(csv.columns[series.userOptions.column_name].slice(csv.series_offset))});
            }
        });
    }

    private update_chars(csv: Csv, a: object) {
        Highcharts.charts.forEach(chart => {
            let update_fn = chart.userOptions.update_fn;
            if(update_fn) {
                update_fn(chart);
            }
            else {
                let series = chart.get(csv.filename);
                series.update(a);
            }
        });
    }
}
