/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from "power-assert";
import { MavenLogInterpreter } from "../../../../../../../src/common/delivery/build/local/maven/mavenLogInterpreter";

describe("MavenLogInterpreter", () => {

    it("should handle empty log", () => {
        const r = MavenLogInterpreter("");
        assert(!!r);
        assert.equal(r.message, "Failed with empty log");
        assert(!r.data.timeMillis);
    });

    it("should handle short failure log", () => {
        const r = MavenLogInterpreter(Fail1);
        assert(!!r);
        assert(r.relevantPart.length > 30);
        assert(r.relevantPart.includes("Unknown lifecycle phase \"build\""), r.relevantPart);
        assert.equal(r.data.timeMillis, 261);
    });

    it("should handle longer failure log", () => {
        const r = MavenLogInterpreter(Fail2);
        assert(!!r);
        assert(r.relevantPart.length > 30);
        assert(r.relevantPart.includes("COMPILATION ERROR"), r.relevantPart);
        assert.equal(r.data.timeMillis, 1814);
    });

    it("should handle failure with tests", () => {
        const r = MavenLogInterpreter(FailWithTests);
        assert(!!r);
        assert(r.relevantPart.length > 30);
        assert(r.relevantPart.includes("There are test failures"), r.relevantPart);
        assert.equal(r.data.testInfo.failingTests, 0);
        assert.equal(r.data.testInfo.errors, 1);
        assert.equal(r.data.timeMillis, 6151);
    });

    it("should handle success log", () => {
        const r = MavenLogInterpreter(Success1);
        assert(!!r);
        assert.equal(r.relevantPart, "");
        assert(r.data.timeMillis === 1640);
    });

});

/* tslint:disable */
const Fail1 = `[INFO] Scanning for projects...
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] Building spring-rest-seed 0.1.0-SNAPSHOT
[INFO] ------------------------------------------------------------------------
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 0.261 s
[INFO] Finished at: 2018-03-12T13:36:05+11:00
[INFO] Final Memory: 10M/245M
[INFO] ------------------------------------------------------------------------
[ERROR] Unknown lifecycle phase "build". You must specify a valid lifecycle phase or a goal in the format <plugin-prefix>:<goal> or <plugin-group-id>:<plugin-artifact-id>[:<plugin-version>]:<goal>. Available lifecycle phases are: validate, initialize, generate-sources, process-sources, generate-resources, process-resources, compile, process-classes, generate-test-sources, process-test-sources, generate-test-resources, process-test-resources, test-compile, process-test-classes, test, prepare-package, package, pre-integration-test, integration-test, post-integration-test, verify, install, deploy, pre-clean, clean, post-clean, pre-site, site, post-site, site-deploy. -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/LifecyclePhaseNotFoundException`;

const Success1 = `[INFO] Scanning for projects...
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] Building spring-rest-seed 0.1.0-SNAPSHOT
[INFO] ------------------------------------------------------------------------
[INFO] 
[INFO] --- git-commit-id-plugin:2.2.2:revision (default) @ buick ---
[INFO] dotGitDirectory /Users/rodjohnson/temp/buick/.git
[INFO] git.build.user.name Rod Johnson
[INFO] git.build.user.email rod@atomist.com
[INFO] git.branch master
[INFO] --always = true
[INFO] --dirty = -dirty
[INFO] --abbrev = 7
[INFO] Tag refs [[]]
[INFO] Created map: [{}]
[INFO] HEAD is [c0a9472937df56b19ef5fe04d38fc04582ef78b4]
[INFO] git.commit.id.describe c0a9472
[INFO] git.commit.id c0a9472937df56b19ef5fe04d38fc04582ef78b4
[INFO] git.commit.id.abbrev c0a9472
[INFO] git.dirty false
[INFO] git.commit.user.name Christian Dupuis
[INFO] git.commit.user.email cd@atomist.com
[INFO] git.commit.message.full fix up app events
[INFO] git.commit.message.short fix up app events
[INFO] git.commit.time 2017-12-14T18:44:09+1100
[INFO] git.remote.origin.url https://github.com/spring-team/buick
[INFO] git.tags 
[INFO] Tag refs [[]]
[INFO] git.closest.tag.name 
[INFO] Tag refs [[]]
[INFO] git.closest.tag.commit.count 
[INFO] git.build.time 2018-03-12T13:38:44+1100
[INFO] git.build.version 0.1.0-SNAPSHOT
[INFO] git.build.host Rods-MBP-104.local
[INFO] git.commit.id.describe-short c0a9472
[INFO] found property git.build.user.email
[INFO] found property git.build.host
[INFO] found property git.dirty
[INFO] found property git.remote.origin.url
[INFO] found property git.closest.tag.name
[INFO] found property git.commit.id.describe-short
[INFO] found property git.commit.user.email
[INFO] found property git.commit.time
[INFO] found property git.commit.message.full
[INFO] found property git.build.version
[INFO] found property git.commit.message.short
[INFO] found property git.commit.id.abbrev
[INFO] found property git.branch
[INFO] found property git.build.user.name
[INFO] found property git.closest.tag.commit.count
[INFO] found property git.commit.id.describe
[INFO] found property git.commit.id
[INFO] found property git.tags
[INFO] found property git.build.time
[INFO] found property git.commit.user.name
[INFO] Reading existing properties file [/Users/rodjohnson/temp/buick/target/classes/git.properties] (for module spring-rest-seed)...
[INFO] Properties file [/Users/rodjohnson/temp/buick/target/classes/git.properties] is up-to-date (for module spring-rest-seed)...
[INFO] 
[INFO] --- maven-resources-plugin:2.6:resources (default-resources) @ buick ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 1 resource
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:compile (default-compile) @ buick ---
[INFO] Nothing to compile - all classes are up to date
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 1.640 s
[INFO] Finished at: 2018-03-12T13:38:44+11:00
[INFO] Final Memory: 19M/266M
[INFO] ------------------------------------------------------------------------`;

const Fail2 = `[INFO] Building spring-rest-seed 0.1.0-SNAPSHOT
[INFO] ------------------------------------------------------------------------
[INFO] 
[INFO] >>> spring-boot-maven-plugin:1.5.4.RELEASE:run (default-cli) > test-compile @ wynyard >>>
[INFO] 
[INFO] --- git-commit-id-plugin:2.2.2:revision (default) @ wynyard ---
[INFO] 
[INFO] --- maven-resources-plugin:2.6:resources (default-resources) @ wynyard ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 2 resources
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:compile (default-compile) @ wynyard ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 3 source files to /private/var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/tmp-37499RMXgIoo246rw/target/classes
[INFO] -------------------------------------------------------------
[ERROR] COMPILATION ERROR : 
[INFO] -------------------------------------------------------------
[ERROR] /private/var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/tmp-37499RMXgIoo246rw/src/main/java/Bad.java:[1,1] class, interface, or enum expected
[ERROR] /private/var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/tmp-37499RMXgIoo246rw/src/main/java/Bad.java:[1,6] class, interface, or enum expected
[INFO] 2 errors 
[INFO] -------------------------------------------------------------
[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 1.814 s
[INFO] Finished at: 2018-04-12T14:29:17+10:00
[INFO] Final Memory: 21M/272M
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.1:compile (default-compile) on project wynyard: Compilation failure: Compilation failure: 
[ERROR] /private/var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/tmp-37499RMXgIoo246rw/src/main/java/Bad.java:[1,1] class, interface, or enum expected
[ERROR] /private/var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/tmp-37499RMXgIoo246rw/src/main/java/Bad.java:[1,6] class, interface, or enum expected
[ERROR] -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException`;

const FailWithTests = `[INFO] Scanning for projects...
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] Building spring-rest-seed 0.0.1-SNAPSHOT
[INFO] ------------------------------------------------------------------------
Downloading: https://atomist.jfrog.io/atomist/libs-release-demo/com/atomist/spring-boot-agent/maven-metadata.xml
Downloading: https://atomist.jfrog.io/atomist/libs-snapshot-demo/com/atomist/spring-boot-agent/maven-metadata.xml
[INFO] 
[INFO] --- git-commit-id-plugin:2.2.2:revision (default) @ spring-rest-seed ---
[INFO] 
[INFO] --- maven-resources-plugin:2.6:resources (default-resources) @ spring-rest-seed ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] Copying 2 resources
[INFO] Copying 0 resource
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:compile (default-compile) @ spring-rest-seed ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-resources-plugin:2.6:testResources (default-testResources) @ spring-rest-seed ---
[INFO] Using 'UTF-8' encoding to copy filtered resources.
[INFO] skip non existing resourceDirectory /Users/rodjohnson/temp/spring-rest-seed/src/test/resources
[INFO] 
[INFO] --- maven-compiler-plugin:3.1:testCompile (default-testCompile) @ spring-rest-seed ---
[INFO] Nothing to compile - all classes are up to date
[INFO] 
[INFO] --- maven-surefire-plugin:2.18.1:test (default-test) @ spring-rest-seed ---
[INFO] Surefire report directory: /Users/rodjohnson/temp/spring-rest-seed/target/surefire-reports

-------------------------------------------------------
 T E S T S
-------------------------------------------------------
... skipped Spring output

Results :

Tests in error: 
  SpringRestSeedApplicationTests.contextLoads » IllegalState Failed to load Appl...

Tests run: 1, Failures: 0, Errors: 1, Skipped: 0

[INFO] ------------------------------------------------------------------------
[INFO] BUILD FAILURE
[INFO] ------------------------------------------------------------------------
[INFO] Total time: 6.151 s
[INFO] Finished at: 2018-04-12T14:53:29+10:00
[INFO] Final Memory: 24M/310M
[INFO] ------------------------------------------------------------------------
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-surefire-plugin:2.18.1:test (default-test) on project spring-rest-seed: There are test failures.
[ERROR] 
[ERROR] Please refer to /Users/rodjohnson/temp/spring-rest-seed/target/surefire-reports for the individual test results.
[ERROR] -> [Help 1]
[ERROR] 
[ERROR] To see the full stack trace of the errors, re-run Maven with the -e switch.
[ERROR] Re-run Maven using the -X switch to enable full debug logging.
[ERROR] 
[ERROR] For more information about the errors and possible solutions, please read the following articles:
[ERROR] [Help 1] http://cwiki.apache.org/confluence/display/MAVEN/MojoFailureException`;
