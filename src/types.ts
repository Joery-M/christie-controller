export interface ProjectorMainStatus {
    powerOn: PowerState | null;
    lampOn: LampState | null;
    douserOn: DouserState | null;
    auxLensOn: number | null;
    lampLOCDoAutoStatus: number | null;
    lampLOCStatus: number | null;
    testOn: number | null;
    testSelectedTotal: number | null;
    malmInstalled: number | null;
    alarmLevel: AlarmLevel | null;
    /**
     * Current channel index.
     *
     * @range 1-64
     */
    activeIndex: number | null;
}

export enum PowerState {
    UNKNOWN = -1,
    OFF = 3,
    ON = 1,
    COOLDOWN = 10,
    WARMUP = 11,
    READY = 0,
}
export enum DouserState {
    UNKNOWN = -1,
    CLOSED = 1,
    OPEN = 0,
}
export enum LampState {
    UNKNOWN = -1,
    OFF = 0,
    ON = 1,
}

export enum AlarmLevel {
    UNKNOWN = -1,
    NONE = 0,
    CRITICAL = 2,
}

export interface Channel {
    /**
     * @range 1-64
     */
    index: number;
    use3D: boolean;
    /**
     * Whether Intelligent Lens System™ is enabled for this channel.
     */
    ILSOn: boolean;
    name: string;
    /**
     * Icon used for this channel.
     *
     * @example "clapper.gif" -> "http://PROJECTOR_HOST/images/channelIcons/clapper.gif"
     */
    icon: string;
}

export interface ProjectorSettings {
    /**
     * Whether to get the channels when logged in
     *
     * @default false
     */
    getChannelsOnLogin?: boolean;
    /**
     * Whether to get the current status when logged in
     *
     * @default false
     */
    getStatusOnLogin?: boolean;
    /**
     * Disable cache
     *
     * @default false
     */
    disableCache?: boolean;
    /**
     * Cache time-to-live in seconds
     *
     * @default 10 seconds
     */
    cacheTTL?: number;
}
