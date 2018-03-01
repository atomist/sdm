/**
 * Log abstraction for output of our activities.
 * Not a technical log of this project but a log of meaningful activity
 * on behalf of users.
 */
export interface ProgressLog {

    write(what: string): void;

    flush(): Promise<any>;

    close(): Promise<any>;

    /**
     * Some implementations expose their log as a string.
     * Otherwise may not, as it could be too long etc.
     */
    log?: string;

    /**
     * Return the url of the log if it is persisted
     */
    url?: string;
}

export type LogFactory = () => Promise<ProgressLog>;
