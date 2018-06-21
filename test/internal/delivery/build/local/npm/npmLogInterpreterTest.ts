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

import * as assert from "power-assert";
import { NpmLogInterpreter } from "../../../../../../src/internal/delivery/build/local/npm/npmLogInterpreter";

describe("NpmLogInterpreter", () => {

    it("should handle empty log", () => {
        const r = NpmLogInterpreter("");
        assert(!r);
    });

    it("should handle short failure log", () => {
        const r = NpmLogInterpreter(Fail1);
        assert(!!r, "interpretation expected");
        assert.equal(r.message, "Tests: 1 failing");
        assert.equal(r.relevantPart, RelevantPart1);
        assert(!r.data, "there should be no data");
    });

    it("should handle test failure", () => {
        const r = NpmLogInterpreter(Fail2);
        assert.equal(r.message, "Tests: 1 failing");
        assert.equal(r.relevantPart, RelevantPart2);
    });

    it("should handle general npm run failure", () => {
        const r = NpmLogInterpreter(Fail3);
        assert.equal(r.message, "ERROR: \"compile\" exited with 1.");
        assert.equal(r.relevantPart, RelevantPart3);
    });

});

/* tslint:disable */
const Fail1 = `to /tmp/tmp-5086mapRbHkXFZF6
2018-04-12T06:00:32.267Z [m:5086] [info ]     ✓ should copy one (790ms)
2018-04-12T06:00:32.267Z [m:5086] [info ] 
2018-04-12T06:00:32.267Z [m:5086] [info ] 
2018-04-12T06:00:32.268Z [m:5086] [info ]   116 passing (44s)
2018-04-12T06:00:32.268Z [m:5086] [info ]   1 pending
2018-04-12T06:00:32.268Z [m:5086] [info ]   1 failing
2018-04-12T06:00:32.268Z [m:5086] [info ] 
2018-04-12T06:00:32.272Z [m:5086] [info ]   1) addHeaderFix
       should lint and make fixes:

      AssertionError [ERR_ASSERTION]:   # addHeaderFixTest.ts:55
  
  assert.equal(r.code, 0)
         | |    |     
         | 1    false 
         Object{code:1,message:"Edited"}
  
  [number] 0
  => 0
  [number] r.code
  => 1
  
      + expected - actual

      -false
      +true
      
      at Decorator._callFunc (node_modules/empower-core/lib/decorator.js:110:20)
      at Decorator.concreteAssert (node_modules/empower-core/lib/decorator.js:103:17)
      at decoratedAssert (node_modules/empower-core/lib/decorate.js:49:30)
      at powerAssert (node_modules/empower-core/index.js:63:32)
      at Object.<anonymous> (test/common/delivery/code/autofix/node/addHeaderFixTest.ts:90:9)
      at Generator.next (<anonymous>)
      at fulfilled (test/common/delivery/code/autofix/node/addHeaderFixTest.ts:30:32)
      at propagateAslWrapper (node_modules/async-listener/index.js:502:23)
      at node_modules/async-listener/glue.js:188:31
      at node_modules/async-listener/index.js:539:70
      at node_modules/async-listener/glue.js:188:31
      at <anonymous>
      at process._tickCallback (internal/process/next_tick.js:182:7)

2018-04-12T06:00:32.273Z [m:5086] [info ] 
2018-04-12T06:00:32.273Z [m:5086] [info ] 
2018-04-12T06:00:32.274Z [m:5086] [info ] Shutdown initiated. Calling shutdown hooks
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! @atomist/github-sdm@0.4.0-20180412055619 test: \`mocha --exit --require espower-typescript/guess "test/**/*.ts"\`
npm ERR! Exit status 1
npm ERR! 
npm ERR! Failed at the @atomist/github-sdm@0.4.0-20180412055619 test script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /root/.npm/_logs/2018-04-12T06_00_32_295Z-debug.log
ERROR: "test" exited with 1.
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! @atomist/github-sdm@0.4.0-20180412055619 build: \`npm-run-all compile test\`
npm ERR! Exit status 1
npm ERR! 
npm ERR! Failed at the @atomist/github-sdm@0.4.0-20180412055619 build script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /root/.npm/_logs/2018-04-12T06_00_32_340Z-debug.log
Stopping build commands due to error on npm run buildERROR: Failure reported: undefined
Error: Failure reported: undefined`;

const RelevantPart1 = `\`\`\`
  1 failing

  1) addHeaderFix
       should lint and make fixes:

      AssertionError [ERR_ASSERTION]:   # addHeaderFixTest.ts:55
  
  assert.equal(r.code, 0)
         | |    |     
         | 1    false 
         Object{code:1,message:"Edited"}
  
  [number] 0
  => 0
  [number] r.code
  => 1
  
      + expected - actual

      -false
      +true
      
\`\`\``;

const Fail2 = `
> @atomist/sample-sdm@0.5.1 build /Users/jessitron/code/atomist/sample-sdm
> npm-run-all compile test


> @atomist/sample-sdm@0.5.1 compile /Users/jessitron/code/atomist/sample-sdm
> npm-run-all git:info compile:gql compile:ts


> @atomist/sample-sdm@0.5.1 git:info /Users/jessitron/code/atomist/sample-sdm
> atomist git

Successfully wrote git information to '/Users/jessitron/code/atomist/sample-sdm/git-info.json'

> @atomist/sample-sdm@0.5.1 compile:gql /Users/jessitron/code/atomist/sample-sdm
> npm-run-all gql:gen gql:copy


> @atomist/sample-sdm@0.5.1 gql:gen /Users/jessitron/code/atomist/sample-sdm
> atomist gql-gen --no-install "src/graphql/**/*.graphql"

Running GraphQL code generator in '/Users/jessitron/code/atomist/sample-sdm'
Loading GraphQL Introspection from file: node_modules/@atomist/automation-client/graph/schema.cortex.json...
Generated file written to /Users/jessitron/code/atomist/sample-sdm/src/typings/types.ts

> @atomist/sample-sdm@0.5.1 gql:copy /Users/jessitron/code/atomist/sample-sdm
> copyfiles "./src/**/*.graphql" build


> @atomist/sample-sdm@0.5.1 compile:ts /Users/jessitron/code/atomist/sample-sdm
> tsc --project .


> @atomist/sample-sdm@0.5.1 test /Users/jessitron/code/atomist/sample-sdm
> mocha --exit --require espower-typescript/guess "test/**/*.ts"

2018-05-05T12:48:35.811Z [m:17866] [info ] Created new deployments record
2018-05-05T12:48:42.687Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.693Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.698Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   HardCodePropertyReviewer
2018-05-05T12:48:42.706Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should not find any problems in empty project
2018-05-05T12:48:42.719Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ pass harmless properties file
2018-05-05T12:48:42.721Z [m:17866] [info ] Value of server.port: '8080' is hard coded
2018-05-05T12:48:42.722Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ flag bad port property
2018-05-05T12:48:42.723Z [m:17866] [info ] Value of server.port: '\${PORT}' is not hard coded
2018-05-05T12:48:42.723Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ accept good port property
2018-05-05T12:48:42.724Z [m:17866] [info ] Value of spring.datasource.password: 'tiger' is hard coded
2018-05-05T12:48:42.725Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ reject hard-coded password
2018-05-05T12:48:42.725Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.726Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   fileIoImport
2018-05-05T12:48:42.729Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should not find any problems in empty project
2018-05-05T12:48:42.731Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ pass harmless Java code
2018-05-05T12:48:42.734Z [m:17866] [info ] Import java.io.File: Antipattern import java.io.File found in src/main/java/Thing.java
2018-05-05T12:48:42.736Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ flag file import in Java
2018-05-05T12:48:42.738Z [m:17866] [info ] Import java.io.File: Antipattern import java.io.File found in src/main/kotlin/Thing.kt
2018-05-05T12:48:42.739Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ flag file import in Kotlin
2018-05-05T12:48:42.740Z [m:17866] [info ] Import java.io.File: Antipattern import java.io.File found in src/main/java/com/atomist/Melb1Application.java
2018-05-05T12:48:42.741Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ flag error in nested package
2018-05-05T12:48:42.741Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.741Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   importDotStar
2018-05-05T12:48:42.743Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should not find any problems in empty project
2018-05-05T12:48:42.744Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ pass harmless Java code
2018-05-05T12:48:42.745Z [m:17866] [info ] Lazy import: Antipattern /import .*\\.\\*/ found in src/main/java/Thing.java
2018-05-05T12:48:42.746Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ flag .* import in Java
2018-05-05T12:48:42.746Z [m:17866] [info ] Lazy import: Antipattern /import .*\\.\\*/ found in src/main/kotlin/Thing.kt
2018-05-05T12:48:42.748Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ flag .* import in Kotlin
2018-05-05T12:48:42.750Z [m:17866] [info ] Lazy import: Antipattern /import .*\\.\\*/ found in src/main/java/com/atomist/Melb1Application.java
2018-05-05T12:48:42.750Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ flag error in nested package
2018-05-05T12:48:42.750Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.750Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   ProvidedDependencyReviewer
2018-05-05T12:48:42.753Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should not find any problems in empty project
2018-05-05T12:48:42.767Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ pass harmless POM
2018-05-05T12:48:42.769Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ flag provided pom
2018-05-05T12:48:42.770Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.770Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   SpringBootSuccessPattern
2018-05-05T12:48:42.770Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should match
2018-05-05T12:48:42.771Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should match slow deployment
2018-05-05T12:48:42.771Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.771Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   commit rendering
2018-05-05T12:48:42.773Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ can render a commit
2018-05-05T12:48:42.773Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.774Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   addK8SpecEditor
2018-05-05T12:48:42.776Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add a file
2018-05-05T12:48:42.776Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.776Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   addHeaderEditor
2018-05-05T12:48:42.779Z [m:17866] [info ] Adding header of length 598 to src/main/java/Thing1.java
2018-05-05T12:48:42.781Z [m:17866] [info ] 2 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 1 files skipped
2018-05-05T12:48:42.782Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 2 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 1 files skipped :carousel_horse:
2018-05-05T12:48:42.783Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add header to Java when not found
2018-05-05T12:48:42.785Z [m:17866] [info ] Adding header of length 598 to src/Thing1.ts
2018-05-05T12:48:42.786Z [m:17866] [info ] 2 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 1 files skipped
2018-05-05T12:48:42.786Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 2 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 1 files skipped :carousel_horse:
2018-05-05T12:48:42.786Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add header to TypeScript when not found
2018-05-05T12:48:42.788Z [m:17866] [info ] 1 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 0 headers added. 1 files skipped
2018-05-05T12:48:42.788Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should respect exclude glob
2018-05-05T12:48:42.789Z [m:17866] [info ] Adding header of length 598 to src/Thing1.ts
2018-05-05T12:48:42.790Z [m:17866] [info ] 2 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 1 files skipped
2018-05-05T12:48:42.790Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 2 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 1 files skipped :carousel_horse:
2018-05-05T12:48:42.790Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should ignore irrelevant exclude glob
2018-05-05T12:48:42.791Z [m:17866] [info ] Adding header of length 598 to src/Thing1.js
2018-05-05T12:48:42.792Z [m:17866] [info ] 2 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 1 files skipped
2018-05-05T12:48:42.792Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 2 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 1 files skipped :carousel_horse:
2018-05-05T12:48:42.792Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add header to JS when not found
2018-05-05T12:48:42.793Z [m:17866] [info ] Adding header of length 598 to src/Thing1.scala
2018-05-05T12:48:42.793Z [m:17866] [info ] 1 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 0 files skipped
2018-05-05T12:48:42.794Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 1 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 0 files skipped :carousel_horse:
2018-05-05T12:48:42.794Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add header to Scala when not found
2018-05-05T12:48:42.795Z [m:17866] [info ] Adding header of length 598 to src/Thing1.c
2018-05-05T12:48:42.795Z [m:17866] [info ] 1 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 0 files skipped
2018-05-05T12:48:42.795Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 1 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 0 files skipped :carousel_horse:
2018-05-05T12:48:42.796Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add header to C when not found
2018-05-05T12:48:42.797Z [m:17866] [info ] Adding header of length 598 to src/Thing1.cpp
2018-05-05T12:48:42.797Z [m:17866] [info ] 1 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 0 files skipped
2018-05-05T12:48:42.797Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 1 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 0 files skipped :carousel_horse:
2018-05-05T12:48:42.797Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add header to C++ when not found
2018-05-05T12:48:42.799Z [m:17866] [info ] Adding header of length 598 to src/Thing1.kt
2018-05-05T12:48:42.799Z [m:17866] [info ] 1 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 0 files skipped
2018-05-05T12:48:42.799Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 1 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 0 files skipped :carousel_horse:
2018-05-05T12:48:42.799Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add header to Kotlin when not found
2018-05-05T12:48:42.843Z [m:17866] [info ] Adding header of length 598 to src/main/java/Thing1.java
2018-05-05T12:48:42.845Z [m:17866] [info ] 2 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 1 headers added. 1 files skipped
2018-05-05T12:48:42.845Z [m:17866] [info ] respond > *License header editor* on \`abcd\`: 2 files matched \`**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}\`. 1 headers added. 1 files skipped :carousel_horse:
2018-05-05T12:48:42.846Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add header when not found and persist to disk (47ms)
2018-05-05T12:48:42.847Z [m:17866] [info ] 2 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 0 headers added. 2 files skipped
2018-05-05T12:48:42.848Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should not add header when already present
2018-05-05T12:48:42.850Z [m:17866] [info ] respond > \`src/main/java/Thing1.java\` already has a different header
2018-05-05T12:48:42.851Z [m:17866] [info ] 2 files matched [**/{*.ts,*.java,*.js,*.scala,*.c,*.cpp,*.kt}]. 0 headers added. 2 files skipped
2018-05-05T12:48:42.852Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should not add header when another header is present
2018-05-05T12:48:42.853Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.853Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   addCloudFoundryManifest
2018-05-05T12:48:42.861Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add a manifest to Spring Boot project when none exists
2018-05-05T12:48:42.863Z [m:17866] [info ] respond > Unable to add Cloud Foundry manifest to project \`owner:repoName\`: Neither Maven nor Node
2018-05-05T12:48:42.863Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should not add a manifest to non Spring Boot Java project
2018-05-05T12:48:42.865Z [m:17866] [info ] addCloudFoundryManifestEditor: Node project {"owner":"owner","repo":"repoName"}: automation client=false
2018-05-05T12:48:42.865Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add a non automation client manifest to Node project when none exists
2018-05-05T12:48:42.866Z [m:17866] [info ] addCloudFoundryManifestEditor: Node project {"owner":"owner","repo":"repoName"}: automation client=true
2018-05-05T12:48:42.867Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ should add an automation client manifest to Node project when none exists
2018-05-05T12:48:42.867Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.867Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   javaPatterns
2018-05-05T12:48:42.867Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     JavaIdentifierRegExp
2018-05-05T12:48:42.869Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should match valid identifiers
2018-05-05T12:48:42.870Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should reject invalid identifiers
2018-05-05T12:48:42.870Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     JavaPackageRegExp
2018-05-05T12:48:42.871Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should match valid packages
2018-05-05T12:48:42.871Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should reject invalid packages
2018-05-05T12:48:42.872Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     MavenGroupIdRegExp
2018-05-05T12:48:42.873Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should match valid ids
2018-05-05T12:48:42.875Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should reject invalid ids
2018-05-05T12:48:42.876Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:42.877Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   springBootGenerator
2018-05-05T12:48:42.878Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     update README
2018-05-05T12:48:42.883Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should get correct content
2018-05-05T12:48:42.883Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     update YML
2018-05-05T12:48:42.885Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should put in Atomist team id
2018-05-05T12:48:42.885Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     run end to end
2018-05-05T12:48:44.196Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       1) should put in Atomist team id and ensure valid Java
2018-05-05T12:48:44.198Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:44.198Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   Rendering a goal graph
2018-05-05T12:48:44.201Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     ✓ renders the HTTP Service Goals
2018-05-05T12:48:44.201Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:44.201Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   springPushTests
2018-05-05T12:48:44.202Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]     HasSpringBootApplicationClass
2018-05-05T12:48:44.203Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should not find maven in empty repo
2018-05-05T12:48:44.204Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should find maven in repo with named pom but no Spring application
2018-05-05T12:48:44.253Z [[34mm[39m:[34m17866[39m] [[34mdebug[39m] Parsing file [src/main/java/App.java] using ANTLR grammar, looking for production 'compilationUnit'
2018-05-05T12:48:44.344Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]       ✓ should find in repo with named pom and Spring application class (139ms)
2018-05-05T12:48:44.344Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:44.345Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:44.345Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   50 passing (2s)
2018-05-05T12:48:44.345Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   1 failing
2018-05-05T12:48:44.345Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:44.346Z [[32mm[39m:[32m17866[39m] [[32minfo [39m]   1) springBootGenerator
       run end to end
         should put in Atomist team id and ensure valid Java:
     ChildProcessError: Command failed: git clone --depth 1 https://null:x-oauth-basic@github.com/spring-team/spring-rest-seed.git /var/folders/gl/d94_8f5n00d17l6fdx37yzxm0000gn/T/tmp-17866wR6ybfinglvw
Cloning into '/var/folders/gl/d94_8f5n00d17l6fdx37yzxm0000gn/T/tmp-17866wR6ybfinglvw'...
fatal: unable to access 'https://null:x-oauth-basic@github.com/spring-team/spring-rest-seed.git/': Could not resolve host: github.com
 \`git clone --depth 1 https://null:x-oauth-basic@github.com/spring-team/spring-rest-seed.git /var/folders/gl/d94_8f5n00d17l6fdx37yzxm0000gn/T/tmp-17866wR6ybfinglvw\` (exited with error code 128)
      at callback (node_modules/child-process-promise/lib/index.js:33:27)
      at ChildProcess.exithandler (child_process.js:280:5)
      at maybeClose (internal/child_process.js:936:16)
      at Socket.stream.socket.on (internal/child_process.js:353:11)
      at Pipe._handle.close (net.js:541:12)
      at Pipe._onclose (node_modules/async-listener/glue.js:188:31)

2018-05-05T12:48:44.346Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:44.346Z [[32mm[39m:[32m17866[39m] [[32minfo [39m] 
2018-05-05T12:48:44.349Z [m:17866] [info ] Shutdown initiated. Calling shutdown hooks
2018-05-05T12:48:44.350Z [m:17866] [info ] Shutdown initiated. Calling shutdown hooks
`;

const RelevantPart2 = `\`\`\`
  1 failing

  1) springBootGenerator
       run end to end
         should put in Atomist team id and ensure valid Java:
     ChildProcessError: Command failed: git clone --depth 1 https://null:x-oauth-basic@github.com/spring-team/spring-rest-seed.git /var/folders/gl/d94_8f5n00d17l6fdx37yzxm0000gn/T/tmp-17866wR6ybfinglvw
Cloning into '/var/folders/gl/d94_8f5n00d17l6fdx37yzxm0000gn/T/tmp-17866wR6ybfinglvw'...
fatal: unable to access 'https://null:x-oauth-basic@github.com/spring-team/spring-rest-seed.git/': Could not resolve host: github.com
 \`git clone --depth 1 https://null:x-oauth-basic@github.com/spring-team/spring-rest-seed.git /var/folders/gl/d94_8f5n00d17l6fdx37yzxm0000gn/T/tmp-17866wR6ybfinglvw\` (exited with error code 128)
\`\`\``;

const Fail3 = `> @atomist/sample-sdm@0.5.1 gql:copy /Users/jessitron/code/atomist/sample-sdm
> copyfiles "./src/**/*.graphql" build


> @atomist/sample-sdm@0.5.1 compile:ts /Users/jessitron/code/atomist/sample-sdm
> tsc --project .

src/machines/cloudFoundryMachine.ts(124,40): error TS1005: ',' expected.
npm ERR! code ELIFECYCLE
npm ERR! errno 2
npm ERR! @atomist/sample-sdm@0.5.1 compile:ts: \`tsc --project .\`
npm ERR! Exit status 2
npm ERR!
npm ERR! Failed at the @atomist/sample-sdm@0.5.1 compile:ts script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/jessitron/.npm/_logs/2018-05-05T14_43_01_982Z-debug.log
ERROR: "compile:ts" exited with 2.
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! @atomist/sample-sdm@0.5.1 compile: \`npm-run-all git:info compile:gql compile:ts\`
npm ERR! Exit status 1
npm ERR!
npm ERR! Failed at the @atomist/sample-sdm@0.5.1 compile script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/jessitron/.npm/_logs/2018-05-05T14_43_02_017Z-debug.log
ERROR: "compile" exited with 1.
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! @atomist/sample-sdm@0.5.1 build: \`npm-run-all compile test\`
npm ERR! Exit status 1
npm ERR!
npm ERR! Failed at the @atomist/sample-sdm@0.5.1 build script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     /Users/jessitron/.npm/_logs/2018-05-05T14_43_02_065Z-debug.log
`;

const RelevantPart3 = `\`\`\`
> @atomist/sample-sdm@0.5.1 compile:ts /Users/jessitron/code/atomist/sample-sdm
> tsc --project .

src/machines/cloudFoundryMachine.ts(124,40): error TS1005: ',' expected.

ERROR: "compile:ts" exited with 2.

ERROR: "compile" exited with 1.
\`\`\``;