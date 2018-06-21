/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Project } from "@atomist/automation-client/project/Project";
import { findMatches } from "@atomist/automation-client/tree/ast/astUtils";
import { MatchResult } from "@atomist/automation-client/tree/ast/FileHits";
import { FileParser } from "@atomist/automation-client/tree/ast/FileParser";
import { TreeNode } from "@atomist/tree-path/TreeNode";

import { CFamilyLangHelper } from "@atomist/microgrammar/matchers/lang/cfamily/CFamilyLangHelper";
import { computeShaOf } from "../../api-helper/misc/sha";
import { JavaScriptElementRequest } from "./JavaScriptElementRequest";

/**
 * Request for language elements: For example, function declarations
 */
export interface ElementRequest {

    /**
     * Parser to use to parse the content
     */
    fileParser: FileParser;

    /**
     * Path expression for the elements we want
     */
    pathExpression: string;

    /**
     * Glob patterns for the files we want to parse
     */
    globPattern: string;

    /**
     * Regex to narrow identifier names if specified
     */
    identifierPattern?: RegExp;

    /**
     * Function to extract the identifier from each matched element
     * @param {MatchResult} m
     * @return {string}
     */
    extractIdentifier: (m: MatchResult) => string;

    /**
     * Return a canonical string from this element.
     * Rules will be different for functions, classes etc.
     * Default behavior is C comment removal and whitespace canonicalization
     * @param {TreeNode} n matching node
     * @return {string}
     */
    canonicalize?: (n: TreeNode) => string;
}

/**
 * Request the given elements in a language
 * @param {Project} p
 * @param {Partial<ElementRequest>} opts
 * @return {Promise<Element[]>}
 */
export async function findElements(p: Project,
                                   opts: Partial<ElementRequest> = {}): Promise<Element[]> {
    const optsToUse: ElementRequest = {
        ...JavaScriptElementRequest,
        ...opts,
    };
    const matches = await findMatches(p,
        optsToUse.fileParser,
        optsToUse.globPattern,
        optsToUse.pathExpression,
    );
    const helper = new CFamilyLangHelper();
    return matches.map(m => {
        const identifier = optsToUse.extractIdentifier(m);
        const body = m.$value;
        const canonicalBody = !!optsToUse.canonicalize ? optsToUse.canonicalize(m) :  helper.canonicalize(body);
        return {
            node: m,
            path: m.sourceLocation.path,
            identifier,
            body,
            canonicalBody,
            sha: computeShaOf(canonicalBody),
        };
    }).filter(sig => !optsToUse.identifierPattern || optsToUse.identifierPattern.test(sig.identifier));
}

/**
 * Function signature we've found
 */
export interface Element {

    /**
     * AST node. We can parse further if we wish
     */
    node: TreeNode;

    /**
     * Path of the file within the project
     */
    path: string;

    /**
     * Identifier of the element
     */
    identifier: string;

    body: string;

    /**
     * Canonical body without comments or whitespace.
     * Useful for sha-ing.
     */
    canonicalBody: string;

    /**
     * Sha computed from the canonical body
     */
    sha: string;
}
