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
