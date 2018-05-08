import { TypeScriptES6FileParser } from "@atomist/automation-client/tree/ast/typescript/TypeScriptFileParser";
import { TreeNode } from "@atomist/tree-path/TreeNode";
import { ElementRequest } from "./elementRequest";

/**
 * Request for all JavaScript functions
 */
export const JavaScriptElementRequest: ElementRequest = {
    fileParser: TypeScriptES6FileParser,
    pathExpression: "//FunctionDeclaration",
    globPattern: "**/*.js",
    extractIdentifier: m => {
        const ids = m.evaluateExpression("//Identifier") as TreeNode[];
        return ids[0].$value;
    },
};
