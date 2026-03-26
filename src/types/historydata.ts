export interface HistoryData {
    data_id: string;
    week_number: number;
    year: number;
    district_id: number;
    disease_id: number;
    case_count: number;
}

export interface District {
    district_id: number;
    district_name: string;
}

export interface Disease {
    disease_id: number;
    disease_name: string;
}
