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
import { NpmLogInterpreter } from "../../../../../../../src/common/delivery/build/local/npm/npmLogInterpreter";

describe("NpmLogInterpreter", () => {

    it("should handle empty log", () => {
        const r = NpmLogInterpreter("");
        assert(!r);
    });

    it("should handle short failure log", () => {
        const r = NpmLogInterpreter(Fail1);
        assert(!!r);
        assert(r.relevantPart.length > 30);
        assert(r.relevantPart.includes("Failed at the @atomist/github-sdm@0.4.0-20180412055619 test script"), r.relevantPart);
        assert(!r.data);
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
  
  assert(r.code === 0)
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
