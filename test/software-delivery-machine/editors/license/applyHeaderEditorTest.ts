import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import "mocha";
import * as assert from "power-assert";
import {
    ApacheHeader,
    ApplyHeaderParameters,
    applyHeaderProjectEditor,
} from "../../../../src/software-delivery-machine/commands/editors/license/applyHeader";

const Context = {
    teamId: "anything",
    messageClient: {
        respond() {
            return undefined;
        },
    },
}as any;

describe("applyHeaderEditor", () => {

    it("should add header when not found", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {path: "src/main/java/Thing.java", content: WithApacheHeader},
            {path: "src/main/java/Thing1.java", content: "public class Thing1 {}"});
        const params = new ApplyHeaderParameters();
        await applyHeaderProjectEditor(p, Context, params);
        assert(p.fileExistsSync("src/main/java/Thing1.java"));
        const content = p.findFileSync("src/main/java/Thing1.java").getContentSync();
        assert(content.startsWith(ApacheHeader));
    });

    it("should not add header when already present", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {path: "src/main/java/Thing.java", content: WithApacheHeader},
            {path: "src/main/java/Thing1.java", content: WithApacheHeader});
        const params = new ApplyHeaderParameters();
        await applyHeaderProjectEditor(p, Context, params);
        assert(p.fileExistsSync("src/main/java/Thing1.java"));
        const content = p.findFileSync("src/main/java/Thing1.java").getContentSync();
        assert(content === WithApacheHeader);
    });

    it("should not add header when another header is present", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {path: "src/main/java/Thing.java", content: WithApacheHeader},
            {path: "src/main/java/Thing1.java", content: WithGplHeader});
        const params = new ApplyHeaderParameters();
        await applyHeaderProjectEditor(p, Context, params);
        assert(p.fileExistsSync("src/main/java/Thing1.java"));
        const content = p.findFileSync("src/main/java/Thing1.java").getContentSync();
        assert(content === WithGplHeader);
    });

});

/* tslint:disable */
const GplHeader = `/* 
 * This file is part of the XXX distribution (https://github.com/xxxx or http://xxx.github.io).
 * Copyright (c) 2015 Liviu Ionescu.
 * 
 * This program is free software: you can redistribute it and/or modify  
 * it under the terms of the GNU General Public License as published by  
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License 
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */`;

const WithApacheHeader = `${ApacheHeader}
 
 public class Thing {}`;

const WithGplHeader = `${GplHeader}
 
 public class Thing {}`;
