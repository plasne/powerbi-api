export interface ITable {
    name: string;
    columns: IColumn[];
}

export interface IColumn {
    dataType: string;
    name: string;
    options?: string[];
    min?: number;
    max?: number;
}
