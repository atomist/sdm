

/**
 * Use this to declare that your Configuration includes additional
 * SDM configuration options, based on extension packs or optional functionality.
 */
export type AdditionalSdmOptions<OptionsType> = {
    sdm: OptionsType
}

export type SdmCacheOptions = {
    enabled: boolean,
    path: string,
}