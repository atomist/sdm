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

export { webhookBaseUrl } from "@atomist/automation-client/lib/atomistWebhook";
export { AutomationClient } from "@atomist/automation-client/lib/automationClient";
export {
    AnyOptions,
    BannerSection,
    Configuration,
    ConfigurationPostProcessor,
    configurationValue,
    DEFAULT_REDACTION_PATTERNS,
} from "@atomist/automation-client/lib/configuration";
export {
    MappedParameter,
    MappedParameters,
    Parameter,
    Parameters,
    Secret,
    Secrets,
    Tags,
    Value,
} from "@atomist/automation-client/lib/decorators";
export { automationClientInstance } from "@atomist/automation-client/lib/globals";
import * as GraphQL from "@atomist/automation-client/lib/graph/graphQL";
import * as validationPatterns from "@atomist/automation-client/lib/operations/common/params/validationPatterns";
import * as editModes from "@atomist/automation-client/lib/operations/edit/editModes";
import * as parseUtils from "@atomist/automation-client/lib/project/util/parseUtils";
import * as projectUtils from "@atomist/automation-client/lib/project/util/projectUtils";
import * as secured from "@atomist/automation-client/lib/secured";
import * as astUtils from "@atomist/automation-client/lib/tree/ast/astUtils";
import * as matchTesters from "@atomist/automation-client/lib/tree/ast/matchTesters";

export { GraphQL };
export { EventFired } from "@atomist/automation-client/lib/HandleEvent";
export {
    AutomationContextAware,
    ConfigurationAware,
    HandlerContext,
    HandlerLifecycle,
} from "@atomist/automation-client/lib/HandlerContext";
export {
    failure,
    Failure,
    FailurePromise,
    HandlerError,
    HandlerResult,
    reduceResults,
    success,
    Success,
    SuccessPromise,
} from "@atomist/automation-client/lib/HandlerResult";
export { CommandInvocation } from "@atomist/automation-client/lib/internal/invoker/Payload";
export { BaseParameter } from "@atomist/automation-client/lib/internal/metadata/decoratorSupport";
export {
    CommandIncoming,
    EventIncoming,
    RequestProcessor,
} from "@atomist/automation-client/lib/internal/transport/RequestProcessor";

export { registerShutdownHook, safeExit } from "@atomist/automation-client/lib/internal/util/shutdown";
export { guid, toStringArray } from "@atomist/automation-client/lib/internal/util/string";
export { OnCommand } from "@atomist/automation-client/lib/onCommand";
export { OnEvent } from "@atomist/automation-client/lib/onEvent";
export { BitBucketRepoRef } from "@atomist/automation-client/lib/operations/common/BitBucketRepoRef";
export { BitBucketServerRepoRef } from "@atomist/automation-client/lib/operations/common/BitBucketServerRepoRef";
export { gitHubRepoLoader } from "@atomist/automation-client/lib/operations/common/gitHubRepoLoader";
export { GitHubRepoRef, isGitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
export { RemoteLocator } from "@atomist/automation-client/lib/operations/common/params/RemoteLocator";
export { validationPatterns };
export {
    isTokenCredentials,
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
export {
    isRemoteRepoRef,
    ProviderType as ScmProviderType,
    RemoteRepoRef,
    RepoId,
    RepoRef,
    SimpleRepoId,
} from "@atomist/automation-client/lib/operations/common/RepoId";
export { RepoFilter } from "@atomist/automation-client/lib/operations/common/repoFilter";
export { RepoFinder } from "@atomist/automation-client/lib/operations/common/repoFinder";
export { RepoLoader } from "@atomist/automation-client/lib/operations/common/repoLoader";
export { SourceLocation } from "@atomist/automation-client/lib/operations/common/SourceLocation";
export { EditMode } from "@atomist/automation-client/lib/operations/edit/editModes";
export { editModes };
export { SimpleProjectEditor } from "@atomist/automation-client/lib/operations/edit/projectEditor";
export { ProjectPersister } from "@atomist/automation-client/lib/operations/generate/generatorUtils";
export { GitlabRepoCreationParameters } from "@atomist/automation-client/lib/operations/generate/GitlabRepoCreationParameters";
export { RepoCreationParameters } from "@atomist/automation-client/lib/operations/generate/RepoCreationParameters";
export { SeedDrivenGeneratorParameters } from "@atomist/automation-client/lib/operations/generate/SeedDrivenGeneratorParameters";
export {
    DefaultReviewComment,
    ProjectReview,
    ReviewComment,
    reviewCommentSorter,
    ReviewResult,
    Severity,
} from "@atomist/automation-client/lib/operations/review/ReviewResult";
export { Tagger, TaggerTags, unifiedTagger } from "@atomist/automation-client/lib/operations/tagger/Tagger";
export { File as ProjectFile } from "@atomist/automation-client/lib/project/File";
export * from "@atomist/automation-client/lib/project/fileGlobs";
export { Fingerprint as FingerprintData } from "@atomist/automation-client/lib/project/fingerprint/Fingerprint";
export { GitCommandGitProject, isValidSHA1 } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";
export { GitProject, GitPushOptions } from "@atomist/automation-client/lib/project/git/GitProject";
export { GitStatus } from "@atomist/automation-client/lib/project/git/gitStatus";
export { isLocalProject, LocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
export { NodeFsLocalProject } from "@atomist/automation-client/lib/project/local/NodeFsLocalProject";
export { InMemoryFile as InMemoryProjectFile } from "@atomist/automation-client/lib/project/mem/InMemoryFile";
export { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
export { Project, ProjectAsync } from "@atomist/automation-client/lib/project/Project";
export { doWithJson } from "@atomist/automation-client/lib/project/util/jsonUtils";
export { parseUtils };
export { projectUtils };
export { secured };
export {
    AutomationEventListener,
    AutomationEventListenerSupport,
} from "@atomist/automation-client/lib/server/AutomationEventListener";
export {
    NoParameters,
    SmartParameters,
    ValidationError,
    ValidationResult,
    ParameterType,
    ParameterIndexType,
} from "@atomist/automation-client/lib/SmartParameters";
export { CloneOptions } from "@atomist/automation-client/lib/spi/clone/DirectoryManager";
export * from "@atomist/automation-client/lib/spi/graph/GraphClient";
export * from "@atomist/automation-client/lib/spi/http/axiosHttpClient";
export * from "@atomist/automation-client/lib/spi/http/curlHttpClient";
export * from "@atomist/automation-client/lib/spi/http/httpClient";
export * from "@atomist/automation-client/lib/spi/message/MessageClient";
export { astUtils };
export { matchTesters };

export { MatchResult, ZapTrailingWhitespace } from "@atomist/automation-client/lib/tree/ast/FileHits";
export { FileParser } from "@atomist/automation-client/lib/tree/ast/FileParser";
export { FileParserRegistry } from "@atomist/automation-client/lib/tree/ast/FileParserRegistry";
export { TypeScriptES6FileParser } from "@atomist/automation-client/lib/tree/ast/typescript/TypeScriptFileParser";
export { MicrogrammarBasedFileParser } from "@atomist/automation-client/lib/tree/ast/microgrammar/MicrogrammarBasedFileParser";
export { RegexFileParser } from "@atomist/automation-client/lib/tree/ast/regex/RegexFileParser";
export { WritableLog } from "@atomist/automation-client/lib/util/child_process";
export * from "@atomist/automation-client/lib/util/exec";
export { deepLink, Issue, raiseIssue } from "@atomist/automation-client/lib/util/gitHub";
export {
    LoggingFormat,
    LoggingConfiguration,
    NoLogging,
    PlainLogging,
    MinimalLogging,
    ClientLogging,
    configureLogging,
    clientLoggingConfiguration,
    Logger,
    LogMethod,
    LeveledLogMethod,
    LogCallback,
    logger,
} from "@atomist/automation-client/lib/util/logger";
export { addRedaction, addLogRedaction } from "@atomist/automation-client/lib/util/redact";
export { doWithRetry, RetryOptions } from "@atomist/automation-client/lib/util/retry";
export { executeAll } from "@atomist/automation-client/lib/util/pool";
export * from "@atomist/automation-client/lib/util/spawn";
export { Maker } from "@atomist/automation-client/lib/util/constructionUtils";
export * from "@atomist/automation-client/lib/operations/common/gitlabRepoLoader";
export * from "@atomist/automation-client/lib/operations/common/GitlabPrivateTokenCredentials";
export * from "@atomist/automation-client/lib/operations/common/GitlabRepoRef";
export * from "@atomist/automation-client/lib/operations/generate/GitlabRepoCreationParameters";
export { ApolloGraphClient, GraphClientListener } from "@atomist/automation-client/lib/graph/ApolloGraphClient";
export { ApolloGraphClientFactory } from "@atomist/automation-client/lib/graph/ApolloGraphClientFactory";
export {
    GraphClientFactory,
    defaultGraphClientFactory,
} from "@atomist/automation-client/lib/spi/graph/GraphClientFactory";
export { AxiosHttpClient, AxiosHttpClientFactory } from "@atomist/automation-client/lib/spi/http/axiosHttpClient";
export { CurlHttpClient, CurlHttpClientFactory } from "@atomist/automation-client/lib/spi/http/curlHttpClient";
export {
    HttpClientFactory,
    defaultHttpClientFactory,
    DefaultHttpClientOptions,
    HttpClient,
    HttpClientOptions,
    HttpMethod,
    HttpResponse,
} from "@atomist/automation-client/lib/spi/http/httpClient";
export {
    WSWebSocketFactory,
    WebSocketFactory,
    defaultWebSocketFactory,
} from "@atomist/automation-client/lib/spi/http/wsClient";
export {
    defaultStatsDClientFactory,
    HotShotStatsDClientFactory,
    NodeStatsDClientFactory,
} from "@atomist/automation-client/lib/spi/statsd/statsdClient";
