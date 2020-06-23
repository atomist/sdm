/*
 * Copyright © 2020 Atomist, Inc.
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

import { TreeNode } from "@atomist/tree-path";
import { DockerfileParser, From, Instruction, Label } from "dockerfile-ast";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Position } from "vscode-languageserver-types/lib/umd/main";
import { FileParser, logger, ProjectFile } from "../../../../client";

class DockerFileParserClass implements FileParser {
    public readonly rootName: "docker";

    public async toAst(f: ProjectFile): Promise<TreeNode> {
        try {
            const dockerfile = DockerfileParser.parse(await f.getContent());
            // console.log(stringify(dockerfile));
            const doc = (dockerfile as any).document;
            const $children = dockerfile.getInstructions().map(i => instructionToTreeNode(i, doc));
            return {
                $name: f.name,
                $children,
            };
        } catch (err) {
            logger.error("Error parsing Dockerfile", err);
            throw err;
        }
    }
}

/**
 * FileParser instance to use for Docker files.
 * Example path expressions, given "node:argon" as the image
 *  //FROM/image/name - returns a node with the value "node" etc
 *  //FROM/image/tag - returns a node with the value "argon" etc
 * @type {DockerFileParserClass}
 */
export const DockerFileParser: FileParser = new DockerFileParserClass();

function instructionToTreeNode(l: Instruction, doc: TextDocument, parent?: TreeNode): TreeNode {
    const n: TreeNode = {
        $name: l.getKeyword(),
        $value: l.getTextContent(),
        $parent: parent,
        $offset: l.getRange() ? convertToOffset(l.getRange().start, doc) : undefined,
    };

    // Deconstruct subelements. There is no generic tree structure in the
    // AST library, so we need to do this manually for subelements we care about.
    if (isFrom(l)) {
        addChildrenFromFromStructure(n, l, doc);
    } else if (isLabel(l)) {
        addChildrenFromLabelStructure(n, l, doc);
    } else {
        switch (l.getKeyword()) {
            case "MAINTAINER":
                addChildrenFromMaintainer(n, l, doc);
                break;
            case "EXPOSE":
                n.$children = [
                    {
                        $name: "port",
                        $value: l.getArgumentsContent(),
                    },
                ];
                break;
            default:
                break;
        }
    }
    return n;
}

function isFrom(l: Instruction): l is From {
    const maybe = l as From;
    return !!maybe.getImageName;
}

function isLabel(l: Instruction): l is Label {
    const maybe = l as Label;
    return !!maybe.getProperties;
}

// Deconstruct FROM to add children.
// We need to do this for all structures we want to see inside
function addChildrenFromFromStructure(n: TreeNode, l: From, doc: TextDocument): void {
    const nameChild = {
        $name: "name",
        $value: l.getImageName(),
        $offset: convertToOffset(l.getImageNameRange().start, doc),
    };
    const $children = [nameChild];
    if (!!l.getImageTag()) {
        $children.push({
            $name: "tag",
            $value: l.getImageTag(),
            $offset: convertToOffset(l.getImageTagRange().start, doc),
        });
    }
    n.$children = [
        {
            $parent: n,
            $name: "image",
            $value: l.getImage(),
            $offset: convertToOffset(l.getImageRange().start, doc),
            $children,
        },
    ];
}

function addChildrenFromLabelStructure(n: TreeNode, l: Label, doc: TextDocument): void {
    n.$children = l.getProperties().map(prop => ({
        $parent: n,
        $name: "pair",
        $value: l.getTextContent().slice("LABEL ".length),
        // Children are the name and value
        $children: [
            {
                $name: "key",
                $value: prop.getName(),
                $offset: convertToOffset(prop.getNameRange().start, doc),
            },
            {
                $name: "value",
                $value: prop.getValue(),
                $offset: prop.getValueRange() ? convertToOffset(prop.getValueRange().start, doc) : undefined,
            },
        ],
    }));
}

function addChildrenFromMaintainer(n: TreeNode, m: Instruction, doc: TextDocument): void {
    const rest = n.$value.slice("MAINTAINER ".length);
    n.$children = [
        {
            $parent: n,
            $name: "maintainer",
            $value: rest,
            $offset: n.$offset + "MAINTAINER ".length,
            $children: [],
        },
    ];
}

// Convert a position to an offset, given the document
function convertToOffset(pos: Position, doc: TextDocument): number {
    return doc.offsetAt(pos);
}
