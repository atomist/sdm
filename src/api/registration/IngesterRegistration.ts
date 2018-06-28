/**
 * Type to register customer type ingesters.
 */
export interface IngesterRegistration {

    /**
     * Ingester GraphQL SDL
     * Note: use the ingester() method of automation-client to load the ingester graphql contents.
     */
    ingester: string;
}
