import { Component } from '@angular/core';
import { DataAccess, Csv } from './data-access.service'
import { Chart } from 'angular-highcharts';
import { Options } from 'highcharts';

declare var require: any;
const Highcharts = require('highcharts');

Highcharts.Point.prototype.highlight = function(event) {
    this.onMouseOver(); // Show the hover marker.
    // this.series.chart.tooltip.refresh(this); // Show the tooltip.
    // this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair.
};

Highcharts.theme = {
    colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066', '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'
    ],
    chart: {
        backgroundColor: {
            linearGradient: {
                x1: 0,
                y1: 0,
                x2: 1,
                y2: 1
            },
            stops: [
                [0, '#2a2a2b'],
                [1, '#3e3e40']
            ]
        },
        style: {
            fontFamily: 'Roboto Slab'
        },
        plotBorderColor: '#606063'
    },
    title: {
        style: {
            color: '#E0E0E3',
            fontSize: '20px'
        }
    },
    subtitle: {
        style: {
            color: '#E0E0E3'
        }
    },
    xAxis: {
        gridLineColor: '#707073',
        labels: {
            style: {
                color: '#E0E0E3'
            }
        },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        title: {
            style: {
                color: '#A0A0A3'
            }
        }
    },
    yAxis: {
        gridLineColor: '#707073',
        labels: {
            style: {
                color: '#E0E0E3'
            }
        },
        lineColor: '#707073',
        minorGridLineColor: '#505053',
        tickColor: '#707073',
        tickWidth: 1,
        title: {
            style: {
                color: '#A0A0A3'
            }
        }
    },
    tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        style: {
            color: '#F0F0F0'
        }
    },
    plotOptions: {
        series: {
            dataLabels: {
                color: '#E0E0E3'
            },
            marker: {
                lineColor: '#333'
            }
        },
        boxplot: {
            fillColor: '#505053'
        },
        candlestick: {
            lineColor: 'white'
        },
        errorbar: {
            color: 'white'
        }
    },
    legend: {
        itemStyle: {
            color: '#E0E0E3'
        },
        itemHoverStyle: {
            color: '#FFF'
        },
        itemHiddenStyle: {
            color: '#606063'
        }
    },

    credits: { enabled: false },

    labels: {
        style: {
            color: '#707073'
        }
    },

    drilldown: {
        activeAxisLabelStyle: {
            color: '#F0F0F3'
        },
        activeDataLabelStyle: {
            color: '#F0F0F3'
        }
    },

    navigation: {
        buttonOptions: {
            symbolStroke: '#DDDDDD',
            theme: {
                fill: '#505053'
            }
        }
    },

    // scroll charts
    rangeSelector: {
        buttonTheme: {
            fill: '#505053',
            stroke: '#000000',
            style: {
                color: '#CCC'
            },
            states: {
                hover: {
                    fill: '#707073',
                    stroke: '#000000',
                    style: {
                        color: 'white'
                    }
                },
                select: {
                    fill: '#000003',
                    stroke: '#000000',
                    style: {
                        color: 'white'
                    }
                }
            }
        },
        inputBoxBorderColor: '#505053',
        inputStyle: {
            backgroundColor: '#333',
            color: 'silver'
        },
        labelStyle: {
            color: 'silver'
        }
    },

    navigator: {
        handles: {
            backgroundColor: '#666',
            borderColor: '#AAA'
        },
        outlineColor: '#CCC',
        maskFill: 'rgba(255,255,255,0.1)',
        series: {
            color: '#7798BF',
            lineColor: '#A6C7ED'
        },
        xAxis: {
            gridLineColor: '#505053'
        }
    },

    scrollbar: {
        barBackgroundColor: '#808083',
        barBorderColor: '#808083',
        buttonArrowColor: '#CCC',
        buttonBackgroundColor: '#606063',
        buttonBorderColor: '#606063',
        rifleColor: '#FFF',
        trackBackgroundColor: '#404043',
        trackBorderColor: '#404043'
    },

    // special colors for some of the
    legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
    background2: '#505053',
    dataLabelsColor: '#B0B0B3',
    textColor: '#C0C0C0',
    contrastTextColor: '#F0F0F3',
    maskColor: 'rgba(255,255,255,0.3)',
};

// Apply the theme
Highcharts.setOptions(Highcharts.theme);

const plot_lines_label_style = { color: '#E0E0E3' };
const plot_lines_line_color = '#707073';
const series_colors = Highcharts.theme.colors;

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

    time_series_columns = ["FPS", "GPU UTIL", "GPU SCLK" , "GPU MCLK", "GPU TEMP", "GPU PWR","GPU FAN","GPU VRAM UTIL","CPU UTIL","RAM UTIL"];
    time_series_chart_options = {
        "FPS": {
            chart: {
                height: 400
            },
            yAxis: {
                title: { text: 'Frames Per Second' },
                minorTickWidth: 10,
                plotLines: [
                    {
                        color: 'red',
                        value: 30,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "30 FPS" }
                    },
                    {
                        color: 'green',
                        value: 60,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "60 FPS" }
                    }
                ]
            },
            xAxis: {
                crosshair: true,
                opposite: true,
                visible: true,
                title: {
                    text: 'Seconds since recording start'
                }
            },
            tooltip: {
                valueSuffix: ' FPS'
            },
            legend: {
                enabled: true
            },
            plotOptions: {
                series: {
                    events: {
                        legendItemClick: (() => {
                            let that = this;
                            return function(event) {
                                for(var i = 0; i < that.time_series_charts.length; ++i) {
                                    let chart = that.time_series_charts[i];
                                    let series = (<any>chart.ref).get(this.options.id);
                                    if(series) {
                                        series.visible = this.visible;
                                        // if(this.visible)
                                        //     series.visible;
                                        // else
                                        //     series.show();
                                    }
                                }
                            };
                        })()
                    }
                }
            },

        }
    };
    time_series_charts: Chart[] = null;

    constructor(private data_access: DataAccess) {
        data_access.csvs.subscribe(csvs => this.on_csvs(csvs));
    }

    sync_time_series_charts(e) {
        for(let chart of this.time_series_charts) {
            let event = (<any>chart.ref).pointer.normalize(e); // Find coordinates within the chart.
            for(let series of (<any>chart.ref).series) {
                let point = series.searchPoint(event, true); // Get the hovered point.
                if(point)
                    point.highlight(e);
            }
        }
    }

    private create_time_series_chart(csvs: Csv[], column_name) {
        let series = csvs.map(csv => {
            return {
                name: csv.series_name,
                data: csv.columns[column_name].slice(csv.series_offset),
                color: csv.series_color,
                id: csv.filename,
                column_name: column_name,
                transform: a => a
            }
        });
        var options = {
            chart: {
                height: 200
            },
            plotOptions: {
                line: {
                    marker: { enabled: false }
                }
            },
            series: series,
            title: { text: null },
            yAxis: {
                title: { text: column_name }
            },
            xAxis: {
                crosshair: true
            },
            tooltip: {
                shared: true
            },
            legend: {
                enabled: false,
                verticalAlign: "top"
            }
        };
        let extra_options = this.time_series_chart_options[column_name] || {};
        options = Highcharts.merge(options, extra_options);
        return new Chart(options);
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
            chart: {
                height: 600
            },
            plotOptions: {
                line: {
                    marker: { enabled: false }
                }
            },
            series: series,
            title: {text: 'FPS timeline'},
            yAxis: {
                title: { text: 'Frames Per Second' },
                minorTickWidth: 10,
                plotLines: [
                    {
                        color: 'red',
                        value: 30,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "30 FPS" }
                    },
                    {
                        color: 'green',
                        value: 60,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "60 FPS" }
                    }
                ]
            },
            xAxis: {
                crosshair: true,
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
                tickInterval: 10,
                plotLines: [
                    {
                        color: 'red',
                        value: 30,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "30 FPS" }
                    },
                    {
                        color: 'green',
                        value: 60,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "60 FPS" }
                    }
                ]
            },
            xAxis: {
                crosshair: true,
                title: { text: 'Percent' },
                tickInterval: 10,
                plotLines: [
                    {
                        color: plot_lines_line_color,
                        value: 50,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "Median" }
                    },
                    {
                        color: plot_lines_line_color,
                        value: 95,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "95%" }
                    },
                    {
                        color: plot_lines_line_color,
                        value: 99,
                        width: 1,
                        dashStyle: 'ShortDash',
                        label: { style: plot_lines_label_style, text: "99%" }
                    }
                ]
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
                    },
                    borderWidth: 0
                },
                series: {
                    states: {
                        hover: {
                            enabled: false
                        }
                    }
                }
            },
            chart: {
                type: 'bar',
                height: 120 + csvs.length * 100
            },
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
        // console.log("on_csvs", csvs);
        for(var i = 0; i < csvs.length; ++i)
            csvs[i].series_color = series_colors[i % series_colors.length];
        this.csvs = csvs;
        this.display_fps_histogram(csvs);
        this.display_fps_avg_chart(csvs);
        // this.display_fps_chart(csvs);
        this.time_series_charts = this.time_series_columns.map(column_name => this.create_time_series_chart(csvs, column_name));
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
