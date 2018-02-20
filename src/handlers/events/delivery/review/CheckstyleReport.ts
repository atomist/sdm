/**
 * <?xml version="1.0" encoding="UTF-8"?>
 <checkstyle version="8.8">
 <file name="/Users/rodjohnson/tools/checkstyle-8.8/Test.java">
 <error line="0" severity="error" message="Missing package-info.java file." source="com.puppycrawl.tools.checkstyle.checks.javadoc.JavadocPackageCheck"/>
 <error line="1" severity="error" message="Missing a Javadoc comment." source="com.puppycrawl.tools.checkstyle.checks.javadoc.JavadocTypeCheck"/>
 </file>
 </checkstyle>

 */
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
