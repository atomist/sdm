
/**
 * Use this to declare that your Configuration includes additional
 * components within SDM, based on extension packs or optional functionality.
 */
export interface AdditionalSdmConfiguration<ConfigurationType> {
    sdm: ConfigurationType;
}

export interface SdmCacheConfiguration {
    cache: {
        enabled: boolean;
        path: string;
    };
}
