import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { projectCljToAppInfo } from "../../../../../../../src/common/delivery/build/local/lein/leinBuilder";
import * as assert from "power-assert";

describe("package.clj parsing", () => {

    it("should parse valid project.clj", async () => {
        const p = InMemoryProject.of(new InMemoryFile("project.clj", Valid1));
        const parsed = await projectCljToAppInfo(p);
        assert.equal(parsed.name, "automation-client-clj");
        assert.equal(parsed.version, "0.5.0");
    });

});

/* tslint:disable */

const Valid1 = `(defproject com.atomist/automation-client-clj "0.5.0"
  :description "Atomist automation client implementation in Clojure"
  :url "https://github.com/atomisthq/automation-client-clj"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.9.0"]
                 [org.clojure/core.async "0.4.474"]

                 ;; websocket
                 [org.clojure/data.json "0.2.6"]
                 [clj-http "3.7.0"]
                 [stylefruits/gniazdo "1.0.1"]

                 ;; util
                 [mount "0.1.11"]
                 [environ "1.0.0"]
                 [diehard "0.7.0"]

                 ;; logging
                 [org.clojure/tools.logging "0.3.1"]
                 [ch.qos.logback/logback-classic "1.1.7"]
                 [org.slf4j/slf4j-api "1.7.21"]
                 [io.clj/logging "0.8.1"]
                 [com.rpl/specter "1.1.0"]]

  :plugins [[lein-environ "1.1.0"]
            [environ/environ.lein "0.3.1"]]

  :min-lein-version "2.6.1" :deploy-repositories [["clojars" {:url "https://clojars.org/repo"
                                                              :username :env/clojars_username
                                                              :password :env/clojars_password
                                                              :sign-releases false}]]

  :profiles {:dev {:dependencies [[org.clojure/test.check "0.9.0"]
                                  [ring/ring-mock "0.3.0"]
                                  [environ "1.1.0"]
                                  [org.clojure/tools.nrepl "0.2.12"]
                                  [org.clojure/tools.namespace "0.2.11"]]
                   :source-paths ["env/dev/clj"]
                   :plugins [[lein-set-version "0.4.1"]
                             [lein-project-version "0.1.0"]]
                   :resource-paths ["env/dev/resources"]
                   :repl-options {:init-ns user}}})
(defproject com.atomist/automation-client-clj "0.5.0"`;
