import { Injectable, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export class Csv {
    filename: string;
    series_name: string;
    series_color: string;
    series_offset: number;
    columns: object;

    constructor(filename: string, csv: string) {
        this.filename = filename.replace(/^.*[/]/, ''); // Remove path.
        this.series_name = this.filename.replace(/\.csv$/i, ''); // Remove extension.
        this.series_color = null;
        this.series_offset = 0;

        // Parse csv header.
        const rows = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const names = rows.splice(0, 1)[0].split(',').map(line => line.trim());

        // Parse csv rows column-wise.
        const columns = names.map(() => new Float32Array(rows.length));
        // rows.forEach((row, r) => row.split(',').forEach((v, c) => columns[c][r] = parseFloat(v)));
        for(var r = 0; r < rows.length; ++r) {
            const row = rows[r].split(',');
            for(var c = 0; c < columns.length; ++c)
                columns[c][r] = parseFloat(row[c]);
        }
        this.columns = Object.fromEntries(names.map((name, c) => [name, columns[c]]));
    }
}

function normalize(column) {
    const mean = column.reduce((a, b) => a + b, 0) / column.length;
    const stdev_inv = column.length / column.reduce((a, v) => a + Math.pow(v - mean, 2), 0);
    return column.map(v => (v - mean) * stdev_inv);
}

function shift_left_longer_series(a, b) {
    // a is no longer than b here.
    // The offset is calculated for b.
    // Find minimal shift left for b that maximizes the similatity between a and b.
    var product_max = -Infinity;
    var offset_best = 0;
    const b_length_inv = 1 / b.length;
    for(var offset = 0; offset < b.length; ++offset) {
        // Calculate the inner product.
        var product = 0;
        for(var i = 0, j = Math.min(b.length - offset, a.length); i < j; ++i)
            product += a[i] * b[i + offset];

        // Penalize shorter lengths.
        const length_penalty = 1 - offset * b_length_inv;
        product *= length_penalty;

        if(product_max < product) {
            product_max = product;
            offset_best = offset;
        }
    }
    return offset_best;
}

export function align_timeseries(csvs: Csv[]): Csv[] {
    const fps_norm = csvs.map(csv => normalize(csv.columns['FPS']));
    // Align series from shortes to longest.
    const idxs = fps_norm.map((v, i) => i);
    idxs.sort((a, b) => fps_norm[a].length - fps_norm[b].length);
    for(var i = 1; i < idxs.length; ++i) {
        const a_idx = idxs[i - 1];
        const b_idx = idxs[i];
        const a = fps_norm[a_idx].slice(csvs[a_idx].series_offset);
        const b = fps_norm[b_idx];
        csvs[b_idx].series_offset = shift_left_longer_series(a, b);
    }
    return csvs;
}

export function cumulative_histogram(values: Float32Array) {
    values = values.slice();
    values.sort((a, b) => b - a);
    const step = values.length / 100;
    const histogram = new Array(101);
    for(var i = 0; i <= 100; ++i) {
        const j = Math.max(0, Math.round(i * step) - 1);
        histogram[i] = values[j];
    }
    return histogram;
}

export function descriptive_stats(values: Float32Array): object {
    values = values.slice();
    values.sort();
    const min_1 = Math.ceil(values.length / 100);
    const values_1 = values.slice(0, min_1);
    const values_99 = values.slice(min_1);
    const min = values[0];
    const sum_1 = values_1.reduce((a, b) => a + b, 0);
    const sum_99 = values_99.reduce((a, b) => a + b, 0);
    const avg = (sum_1 + sum_99) / values.length;
    const avg_99 = sum_99 / values_99.length;
    const l = values.length;
    const median = l % 2
        ? (values[Math.floor(l / 2)] + values[Math.ceil(l / 2)]) / 2
        : values[l / 2]
        ;
    return {
        "minimum": min,
        "median": median,
        "average": Math.round(avg * 10) / 10,
        "99% average": Math.round(avg_99 * 10) / 10
    };
}


function open_csv(file: File, on_csv) {
    var reader = new FileReader();
    reader.onload = () => on_csv(new Csv(file.name, reader.result as string));
    reader.readAsText(file);
}

@Injectable()
export class DataAccess {

    @Output() csvs = new EventEmitter<Csv[]>();

    constructor(private http: HttpClient) {}

    load_local_csvs(files: FileList) {
        const csvs: Csv[] = [];
        const file_count = files.length;
        for(var i = 0; i < file_count; ++i) {
            open_csv(files[i], csv => {
                csvs.push(csv);
                if(csvs.length === file_count)
                    this.csvs.emit(csvs);
            });
        }
    }

    load_csvs(files: string[]) {
        const event = new EventEmitter<Csv[]>();
        const csvs = [];
        for(const file of files) {
            this.http.get(file, {responseType: 'text'}).subscribe(data => {
                csvs.push(new Csv(file, data));
                if(csvs.length === files.length)
                    event.emit(csvs);
            })
        }
        return event;
    }
}
