import { HandlerContext, logger } from "@atomist/automation-client";
import { doWithJson } from "@atomist/automation-client/project/util/jsonUtils";
import { PersonByChatId } from "../../../../typings/types";

export function updatePackageJsonIdentification(appName: string,
                                                description: string,
                                                version: string,
                                                screenName: string,
                                                target: { owner: string, repo: string }) {
    return async (project, context) => {
        const author = await nameAuthor(context, screenName);
        logger.info("Updating JSON. Author is " + author);

        return doWithJson(project, "package.json", pkg => {
            const repoUrl = `https://github.com/${target.owner}/${target.repo}`;
            pkg.name = appName;
            pkg.description = description;
            pkg.version = version;
            pkg.author = author;
            pkg.repository = {
                type: "git",
                url: `${repoUrl}.git`,
            };
            pkg.homepage = `${repoUrl}#readme`;
            pkg.bugs = {
                url: `${repoUrl}/issues`,
            };
        });
    };
}

async function nameAuthor(ctx: HandlerContext, screenName: string): Promise<string> {
    const personResult: PersonByChatId.Query = await ctx.graphClient.query(
        { name: "PersonQuery", variables: {screenName}});
    if (!personResult || !personResult.ChatId || personResult.ChatId.length === 0 || !personResult.ChatId[0].person) {
        logger.info("No person; defaulting author to blank");
        return "";
    }
    const person = personResult.ChatId[0].person;
    if (person.forename && person.surname) {
        return `${person.forename} ${person.surname}`;
    }
    if (person.gitHubId) {
        return person.gitHubId.login;
    }
    if (person.emails.length > 0) {
        return person.emails[0].address;
    }
}
