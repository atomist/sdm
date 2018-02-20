
export interface CheckstyleReport {

    files: FileReport[];

}

export interface FileReport {

    name: string;

    errors: Error[];
}

export type Severity = "error" | "info";

export interface Error {

    line: number;
    severity: Severity;
    message: string;
    source: string;
}
