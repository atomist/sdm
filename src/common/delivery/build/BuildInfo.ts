export interface TestStatus {

    passingTests: number;

    pendingTests: number;

    failingTests: number;

    errors: number;
}

/**
 * Data common to all builds
 */
export interface BuildStatus {

    timeMillis?: number;

    success: boolean;

    testInfo?: TestStatus;

}
