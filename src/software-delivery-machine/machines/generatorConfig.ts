
/**
 * Customize to change generator behavior everywhere
 * @type {{seedOwner: string; addAtomistWebhook: boolean}}
 */
export const CommonGeneratorConfig = {
    seedOwner: "spring-team",
    addAtomistWebhook: false,
};

/**
 * Customize to change Java generator behavior everywhere
 * @type {{groupId: string}}
 */
export const CommonJavaGeneratorConfig = {
    ...CommonGeneratorConfig,
    groupId: "atomist",
};
