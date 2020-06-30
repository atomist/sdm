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

import { InMemoryFile as InMemoryProjectFile } from "@atomist/automation-client/lib/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import { doWithAllMatches, findValues } from "@atomist/automation-client/lib/tree/ast/astUtils";
import * as assert from "power-assert";
import { DockerFileParser } from "../../../../lib/pack/docker/parse/DockerFileParser";

describe("Docker file parser", () => {
    it("should parse valid", async () => {
        const root = await DockerFileParser.toAst(new InMemoryProjectFile("Dockerfile", nodeDockerfile));
        assert(!!root);
    });

    it("should parse valid with / path", async () => {
        const root = await DockerFileParser.toAst(new InMemoryProjectFile("Dockerfile", dashedImage));
        assert(!!root);
    });

    it("should parse docker image with only name", async () => {
        // Special value to be able to find easily in logs
        const image = `FROM nginx

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY resources/public /usr/share/nginx/html

EXPOSE 8080`;
        const p = InMemoryProject.of({ path: "docker/Dockerfile", content: image });
        const imageName: string[] = await findValues(p, DockerFileParser, "docker/Dockerfile", "//FROM/image/name");
        assert.deepStrictEqual(imageName, ["nginx"]);
    });

    it("should query for image", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nginxDockerFile });
        const images = await findValues(p, DockerFileParser, "Dockerfile", "//FROM/image");
        assert.strictEqual(images[0], "debian:jessie");
    });

    it("should query for image with /", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: dashedImage });
        const images = await findValues(p, DockerFileParser, "Dockerfile", "//FROM/image");
        assert.strictEqual(images[0], "adoptopenjdk/openjdk8-openj9");
    });

    it("should find single EXPOSE", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: expose1 });
        const exposes = await findValues(p, DockerFileParser, "Dockerfile", "//EXPOSE");
        assert.strictEqual(exposes.length, 1);
        assert.strictEqual(exposes[0], "EXPOSE 8080");
    });

    it("should find multiple EXPOSE", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: dashedImage });
        const exposes = await findValues(p, DockerFileParser, "Dockerfile", "//EXPOSE");
        assert.strictEqual(exposes.length, 2);
        assert.strictEqual(exposes[0], "EXPOSE 8080");
        assert.strictEqual(exposes[1], "EXPOSE 8081");
    });

    it("should find multiple EXPOSE and show ports", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: dashedImage });
        const exposes = await findValues(p, DockerFileParser, "Dockerfile", "//EXPOSE/port");
        assert.strictEqual(exposes.length, 2);
        assert.strictEqual(exposes[0], "8080");
        assert.strictEqual(exposes[1], "8081");
    });

    it("should query for image name", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nginxDockerFile });
        const images = await findValues(p, DockerFileParser, "Dockerfile", "//FROM/image/name");
        assert.strictEqual(images[0], "debian");
    });

    it("should find RUNs", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nginxDockerFile });
        const runs = await findValues(p, DockerFileParser, "Dockerfile", "//RUN");
        assert.strictEqual(runs.length, 2);
    });

    it("should find RUNs invoking rm", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nginxDockerFile });
        const runs = await findValues(p, DockerFileParser, "Dockerfile", "//RUN[?removes]", {
            removes: n => n.$value.includes("rm "),
        });
        assert.strictEqual(runs.length, 1);
    });

    it("should find MAINTAINER", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nginxDockerFile });
        const authors = await findValues(p, DockerFileParser, "Dockerfile", "//MAINTAINER");
        assert.strictEqual(authors.length, 1);
        assert.strictEqual(authors[0], `MAINTAINER NGINX Docker Maintainers "docker-maint@nginx.com"`);
    });

    it("should unpack MAINTAINER", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nginxDockerFile });
        const authors = await findValues(p, DockerFileParser, "Dockerfile", "//MAINTAINER/maintainer");
        assert.strictEqual(authors.length, 1);
        assert.strictEqual(authors[0], `NGINX Docker Maintainers "docker-maint@nginx.com"`);
    });

    it("should return LABELs", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nodeDockerfile });
        const labels = await findValues(p, DockerFileParser, "Dockerfile", "//LABEL");
        assert.strictEqual(labels.length, 4);
    });

    it("should unpack LABELs", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nodeDockerfile });
        const labelPairs = await findValues(p, DockerFileParser, "Dockerfile", "//LABEL/pair");
        assert.strictEqual(labelPairs.length, 4);
        assert.strictEqual(labelPairs[0], `"com.example.vendor"="ACME Incorporated"`);
        const labelKeys = await findValues(p, DockerFileParser, "Dockerfile", "//LABEL/pair/key");
        assert.strictEqual(labelKeys.length, 4);
        assert.strictEqual(labelKeys[0], `com.example.vendor`);
        const labelValues = await findValues(p, DockerFileParser, "Dockerfile", "//LABEL/pair/value");
        assert.strictEqual(labelValues.length, 4);
        assert.strictEqual(labelValues[0], `ACME Incorporated`);
        const knownKeys = await findValues(
            p,
            DockerFileParser,
            "Dockerfile",
            "//LABEL/pair[/key[@value='com.example.vendor']]/value",
        );
        assert.strictEqual(knownKeys.length, 1);
        assert.strictEqual(knownKeys[0], `ACME Incorporated`);
    });

    it("should update LABEL", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nodeDockerfile });
        await doWithAllMatches(
            p,
            DockerFileParser,
            "Dockerfile",
            "//LABEL/pair[/key[@value='com.example.vendor']]/value",
            n => (n.$value = "A.N. Other"),
        );
        const contentNow = p.findFileSync("Dockerfile").getContentSync();
        assert.strictEqual(contentNow, nodeDockerfile.replace("ACME Incorporated", "A.N. Other"));
    });

    it("should allow path expression and modify", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: nodeDockerfile });
        await doWithAllMatches(p, DockerFileParser, "Dockerfile", "//FROM/image/tag", n => (n.$value = "xenon"));
        const contentNow = p.findFileSync("Dockerfile").getContentSync();
        assert.strictEqual(contentNow, nodeDockerfile.replace("argon", "xenon"));
    });

    it("should parse problematic file", async () => {
        const p = InMemoryProject.of({ path: "Dockerfile", content: weave1 });
        const images = await findValues(p, DockerFileParser, "Dockerfile", "//FROM/image");
        assert.strictEqual(images.length, 1);
        assert.strictEqual(images[0], "weaveworksdemos/msd-java:jre-latest");
    });

    const nodeDockerfile = `FROM node:argon
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install
LABEL "com.example.vendor"="ACME Incorporated"
LABEL com.example.label-with-value="foo"
LABEL version="1.0"
LABEL description="This text illustrates \\
that label-values can span multiple lines."
# Bundle app source
COPY . /usr/src/app
EXPOSE 8080
CMD [ "npm", "start" ]`;

    const nginxDockerFile = `FROM debian:jessie
MAINTAINER NGINX Docker Maintainers "docker-maint@nginx.com"
ENV NGINX_VERSION 1.11.7-1~jessie
RUN apt-key adv --keyserver hkp://pgp.mit.edu:80 --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62 \\
     && echo "deb http://nginx.org/packages/mainline/debian/ jessie nginx" >> /etc/apt/sources.list \\
     && apt-get update \\
     && apt-get install --no-install-recommends --no-install-suggests -y \\
                               ca-certificates \\
                               nginx=\${NGINX_VERSION} \\
                               nginx-module-xslt \\
                               nginx-module-geoip \\
                               nginx-module-image-filter \\
                               nginx-module-perl \\
                               nginx-module-njs \\
                               gettext-base \\
     && rm -rf /var/lib/apt/lists/*
# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \\
     && ln -sf /dev/stderr /var/log/nginx/error.log
EXPOSE 80 443
CMD [ "nginx", "-g", "daemon off;" ]`;

    const dashedImage = `
FROM adoptopenjdk/openjdk8-openj9

EXPOSE 8080
EXPOSE 8081`;

    const expose1 = `
FROM thing

EXPOSE 8080
`;

    const weave1 = `FROM weaveworksdemos/msd-java:jre-latest

WORKDIR /usr/src/app
COPY *.jar ./app.jar

RUN	chown -R \${SERVICE_USER}:\${SERVICE_GROUP} ./app.jar

USER \${SERVICE_USER}

ARG BUILD_DATE
ARG BUILD_VERSION
ARG COMMIT

LABEL org.label-schema.vendor="Weaveworks" \\
  org.label-schema.build-date="\${BUILD_DATE}" \\
  org.label-schema.version="\${BUILD_VERSION}" \\
  org.label-schema.name="Socks Shop: Cart" \\
  org.label-schema.description="REST API for Cart service" \\
  org.label-schema.url="https://github.com/microservices-demo/carts" \\
  org.label-schema.vcs-url="github.com:microservices-demo/carts.git" \\
  org.label-schema.vcs-ref="\${COMMIT}" \\
  org.label-schema.schema-version="1.0"

ENTRYPOINT ["/usr/local/bin/java.sh","-jar","./app.jar", "--port=80"]`;
});
