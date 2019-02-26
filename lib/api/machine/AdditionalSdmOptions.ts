
/**
 * Use this to declare that your Configuration includes additional
 * SDM configuration options, based on extension packs or optional functionality.
 */
export interface AdditionalSdmOptions<OptionsType> {
    sdm: OptionsType;
}

export interface SdmCacheOptions {
    cache: {
        enabled: boolean;
        path: string;
    };
}
