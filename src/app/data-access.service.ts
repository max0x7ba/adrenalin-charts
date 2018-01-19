import { Injectable, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs/Rx';

export class Csv {
    filename: string;
    series_name: string;
    series_color: string;
    series_offset: number;
    columns: object;

    constructor(filename: string, csv: string) {
        this.filename = filename;

        this.series_name = filename.replace(/\.csv$/i, '');
        this.series_color = null;
        this.series_offset = 0;

        // Parse csv header.
        let lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        let names = lines[0].split(',').map(line => line.trim());
        let column_count = names.length;
        let row_count = lines.length - 1;

        // Parse csv rows column-wise.
        let values = names.map(name => new Float32Array(row_count));
        for(var r = 0; r < lines.length - 1; ++r) {
            let row = lines[r + 1].split(',').map(parseFloat);
            values.forEach((column, c) => column[r] = row[c]);
        }

        let columns = {};
        for(var c = 0; c < column_count; ++c)
            columns[names[c]] = values[c];
        this.columns = columns;
    }
}

function normalize(column) {
    let mean = column.reduce((a, b) => a + b, 0) / column.length;
    let stdev_inv = column.length / column.reduce((a, v) => a + Math.pow(v - mean, 2), 0);
    return column.map(v => (v - mean) * stdev_inv);
}

function shift_left_longer_series(a, b) {
    // a is no longer than b here.
    // The offset is calculated for b.
    // Find minimal shift left for b that maximizes the similatity between a and b.
    var product_max = -Infinity;
    var offset_best = 0;
    let b_length_inv = 1 / b.length;
    for(var offset = 0; offset < b.length; ++offset) {
        // Calculate the inner product.
        var product = 0;
        for(var i = 0, j = Math.min(b.length - offset, a.length); i < j; ++i)
            product += a[i] * b[i + offset];

        // Penalize shorter lengths.
        let length_penalty = 1 - offset * b_length_inv;
        product *= length_penalty;

        if(product_max < product) {
            product_max = product;
            offset_best = offset;
        }
    }
    return offset_best;
}

export function align_timeseries(csvs: Csv[]): Csv[] {
    let fps_norm = csvs.map(csv => normalize(csv.columns['FPS']));
    // Align series from shortes to longest.
    let idxs = fps_norm.map((v, i) => i);
    idxs.sort((a, b) => fps_norm[a].length - fps_norm[b].length);
    for(var i = 1; i < idxs.length; ++i) {
        let a_idx = idxs[i - 1];
        let b_idx = idxs[i];
        let a = fps_norm[a_idx].slice(csvs[a_idx].series_offset);
        let b = fps_norm[b_idx];
        csvs[b_idx].series_offset = shift_left_longer_series(a, b);
    }
    return csvs;
}

export function cumulative_histogram(values: Float32Array) {
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

export function descriptive_stats(values: Float32Array): object {
    values = values.slice();
    values.sort();
    let min_1 = Math.ceil(values.length / 100);
    let values_1 = values.slice(0, min_1);
    let values_99 = values.slice(min_1);
    let min = values[0];
    let sum_1 = values_1.reduce((a, b) => a + b, 0);
    let sum_99 = values_99.reduce((a, b) => a + b, 0);
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


function open_csv(file: File, on_csv) {
    var reader = new FileReader();
    reader.onload = () => on_csv(new Csv(file.name, reader.result));
    reader.readAsText(file);
}

@Injectable()
export class DataAccess {

    @Output() csvs = new EventEmitter<Csv[]>();

    constructor() { }

    load_local_csvs(files: FileList) {
        let csvs: Csv[] = [];
        let file_count = files.length;
        for(var i = 0; i < file_count; ++i) {
            open_csv(files[i], csv => {
                csvs.push(csv);
                if(csvs.length === file_count)
                    this.csvs.emit(csvs);
            });
        }
    }
}
