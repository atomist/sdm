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
import { parseCloudFoundryLogForEndpoint } from "../../../src/pack/pcf/cloudFoundryLogParser";

describe("CloudFoundryProgressLog", () => {

    it("parses real log", () => {
        const endpoint = parseCloudFoundryLogForEndpoint(l1);
        assert.equal(endpoint, "http://losgatos1-cataphractic-brink.cfapps.io");
    });

});

/* tslint:disable */
const l1 = `Logging into Cloud Foundry as rod@atomist.com...
Updating app losgatos1 in org springrod / space development as rod@atomist.com...
OK

Uploading losgatos1...
Uploading app files from: /var/folders/86/p817yp991bdddrqr_bdf20gh0000gp/T/unzipped-app934183388
Uploading 348.7K, 91 files

238.5K uploaded...

Done uploading
OK

Stopping app losgatos1 in org springrod / space development as rod@atomist.com...
OK

Starting app losgatos1 in org springrod / space development as rod@atomist.com...
Downloading binary_buildpack...
Downloading staticfile_buildpack...
Downloading dotnet_core_buildpack_beta...
Downloading java_buildpack...
Downloading ruby_buildpack...
Downloaded ruby_buildpack
Downloading nodejs_buildpack...
Downloaded java_buildpack
Downloading go_buildpack...
Downloaded dotnet_core_buildpack_beta
Downloading python_buildpack...
Downloaded binary_buildpack
Downloading php_buildpack...
Downloaded go_buildpack
Downloading dotnet_core_buildpack...
Downloaded dotnet_core_buildpack
Downloading hwc_buildpack...
Downloaded nodejs_buildpack
Downloaded python_buildpack
Downloaded hwc_buildpack
Downloaded php_buildpack
Downloaded staticfile_buildpack
Creating container
Successfully created container
Downloading build artifacts cache...
Downloading app package...
Downloading build artifacts cache failed
Downloaded app package (12.8M)
[1m[31m----->[0m[22m [1m[34mJava Buildpack[0m[22m [34mv4.5[0m [34m(offline)[0m | https://github.com/cloudfoundry/java-buildpack.git#ffeefb9
[1m[31m----->[0m[22m Downloading [1m[34mJvmkill Agent[0m[22m [34m1.10.0_RELEASE[0m from https://java-buildpack.cloudfoundry.org/jvmkill/trusty/x86_64/jvmkill-1.10.0_RELEASE.so [3m[32m(found in cache)[0m[23m
[1m[31m----->[0m[22m Downloading [1m[34mOpen Jdk JRE[0m[22m [34m1.8.0_141[0m from https://java-buildpack.cloudfoundry.org/openjdk/trusty/x86_64/openjdk-1.8.0_141.tar.gz [3m[32m(found in cache)[0m[23m
       Expanding Open Jdk JRE to .java-buildpack/open_jdk_jre [3m[32m(1.7s)[0m[23m
[1m[31m----->[0m[22m Downloading [1m[34mOpen JDK Like Memory Calculator[0m[22m [34m3.9.0_RELEASE[0m from https://java-buildpack.cloudfoundry.org/memory-calculator/trusty/x86_64/memory-calculator-3.9.0_RELEASE.tar.gz [3m[32m(found in cache)[0m[23m
       Loaded Classes: 13001, Threads: 300
[1m[31m----->[0m[22m Downloading [1m[34mClient Certificate Mapper[0m[22m [34m1.2.0_RELEASE[0m from https://java-buildpack.cloudfoundry.org/client-certificate-mapper/client-certificate-mapper-1.2.0_RELEASE.jar [3m[32m(found in cache)[0m[23m
[1m[31m----->[0m[22m Downloading [1m[34mContainer Security Provider[0m[22m [34m1.8.0_RELEASE[0m from https://java-buildpack.cloudfoundry.org/container-security-provider/container-security-provider-1.8.0_RELEASE.jar [3m[32m(found in cache)[0m[23m
[1m[31m----->[0m[22m Downloading [1m[34mSpring Auto Reconfiguration[0m[22m [34m1.12.0_RELEASE[0m from https://java-buildpack.cloudfoundry.org/auto-reconfiguration/auto-reconfiguration-1.12.0_RELEASE.jar [3m[32m(found in cache)[0m[23m
Exit status 0
Uploading droplet, build artifacts cache...
Uploading build artifacts cache...
Uploading droplet...
Uploaded build artifacts cache (131B)
Uploaded droplet (59.2M)
Uploading complete
Stopping instance 47c45101-542b-4fe0-ab47-e04ee281acd1
Destroying container
Successfully destroyed container

0 of 1 instances running, 1 starting
0 of 1 instances running, 1 starting
1 of 1 instances running

App started


OK

App losgatos1 was started using this command \`JAVA_OPTS="-agentpath:$PWD/.java-buildpack/open_jdk_jre/bin/jvmkill-1.10.0_RELEASE=printHeapHistogram=1 -Djava.io.tmpdir=$TMPDIR -Djava.ext.dirs=$PWD/.java-buildpack/container_security_provider:$PWD/.java-buildpack/open_jdk_jre/lib/ext -Djava.security.properties=$PWD/.java-buildpack/security_providers/java.security $JAVA_OPTS" && CALCULATED_MEMORY=$($PWD/.java-buildpack/open_jdk_jre/bin/java-buildpack-memory-calculator-3.9.0_RELEASE -totMemory=$MEMORY_LIMIT -stackThreads=300 -loadedClasses=13710 -poolType=metaspace -vmOptions="$JAVA_OPTS") && echo JVM Memory Configuration: $CALCULATED_MEMORY && JAVA_OPTS="$JAVA_OPTS $CALCULATED_MEMORY" && SERVER_PORT=$PORT eval exec $PWD/.java-buildpack/open_jdk_jre/bin/java $JAVA_OPTS -cp $PWD/. org.springframework.boot.loader.JarLauncher\`

Showing health and status for app losgatos1 in org springrod / space development as rod@atomist.com...
OK

requested state: started
instances: 1/1
usage: 1G x 1 instances
urls: losgatos1-cataphractic-brink.cfapps.io
last uploaded: Sun Feb 11 10:25:15 UTC 2018
stack: cflinuxfs2
buildpack: client-certificate-mapper=1.2.0_RELEASE container-security-provider=1.8.0_RELEASE java-buildpack=[34mv4.5[0m-offline-https://github.com/cloudfoundry/java-buildpack.git#ffeefb9 java-main java-opts jvmkill-agent=1.10.0_RELEASE open-jdk-like-jre=1.8.0_1...

     state     since                    cpu    memory         disk           details
#0   running   2018-02-11 09:26:17 PM   0.0%   266.1M of 1G   138.2M of 1G`;
