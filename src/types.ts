export interface ProjectorMainStatus {
    powerOn: PowerState;
    lampOn: LampState;
    douserOn: DouserState;
    auxLensOn: number;
    lampLOCDoAutoStatus: number;
    lampLOCStatus: number;
    testOn: number;
    testSelectedTotal: number;
    malmInstalled: number;
    alarmLevel: AlarmLevel;
    /**
     * Current channel index.
     *
     * @range 1-64
     */
    activeIndex: number;
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
    CRITICAL = 2,
    NONE = 0,
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

export interface Events {
    status: [status: ProjectorMainStatus];
    power: [power: PowerState];
    douser: [douser: DouserState];
    lamp: [lamp: LampState];
    alarm: [level: AlarmLevel];
    activeChannel: [channelIndex: number];
    authentication: [authenticated: boolean];
    channels: [channels: Channel[]];
}

export interface ProjectorSettings {
    /**
     * Interval timeout in milliseconds.
     *
     * Set to -1 to disable periodical status fetching.
     *
     * @default 5000
     */
    getStatusInterval?: number;

    /**
     * Whether to get the channels when logged in
     *
     * @default true
     */
    getChannelsOnLogin?: boolean;
    /**
     * Whether to get the current status when logged in
     *
     * @default true
     */
    getStatusOnLogin?: boolean;
}
