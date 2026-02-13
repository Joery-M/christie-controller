import axios, { AxiosInstance } from "axios";
import deepEqual from "fast-deep-equal";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import {
    Channel,
    Events,
    ProjectorMainStatus,
    ProjectorSettings,
} from "./types";
import EventEmitter from "node:events";
import { TypeSafeEventEmitter } from "typesafe-event-emitter";

export class Projector implements Disposable {
    private token?: string;

    private api: AxiosInstance;

    private xmlBuilder = new XMLBuilder({ ignoreAttributes: false });
    private xmlParser = new XMLParser({
        ignoreAttributes: false,
    });

    private getStatusInterval?: ReturnType<typeof setInterval>;

    // Public
    private _currentStatus?: ProjectorMainStatus;
    public get currentStatus(): ProjectorMainStatus | undefined {
        return this._currentStatus;
    }
    private set currentStatus(value: ProjectorMainStatus) {
        this._currentStatus = value;
    }

    private _channels: Channel[] = [];
    public get channels(): Channel[] {
        return this._channels;
    }
    private set channels(value: Channel[]) {
        this._channels = value;
    }

    public authenticated = false;

    public events: TypeSafeEventEmitter<Events> = new EventEmitter();

    constructor(
        private host: string,
        private settings: ProjectorSettings = {},
    ) {
        if (!this.host.startsWith("http")) {
            this.host = `http://${this.host}`;
        }
        this.api = axios.create({
            baseURL: this.host,
            headers: {
                "content-type": "text/xml; charset=UTF-8",
            },
        });
    }

    public async logIn(username: string, password: string): Promise<boolean> {
        const res = await this.request("security", "login", {
            token: "blank_token",
            username,
            password,
        });
        if (res && res.status == 200) {
            const token = res.data["ns:loginResponse"]?.token;
            if (token) {
                this.token = token;
                this.authenticated = true;
                this.events.emit("authentication", this.authenticated);

                if ((this.settings.getStatusInterval ?? 5000) > 0) {
                    this.getStatusInterval = setInterval(() => {
                        this.getStatus();
                    }, this.settings.getStatusInterval ?? 5000);
                }

                if (this.settings.getChannelsOnLogin !== false) {
                    this.getChannels();
                }

                if (this.settings.getStatusOnLogin !== false) {
                    this.getStatus();
                }

                return this.authenticated;
            }
            this.events.emit("authentication", false);
            return false;
        }
        this.events.emit("authentication", false);
        return false;
    }

    public getStatus(): Promise<ProjectorMainStatus> {
        if (!this.token) {
            throw new Error("Tried getting status without token.");
        }
        return new Promise<ProjectorMainStatus>(async (resolve, reject) => {
            const res = await this.request("cinemaprojector", "getMainStatus");

            if (res && res.status == 200) {
                const status = res.data?.Notification as ProjectorMainStatus;

                const oldStatus = this.currentStatus;
                this.currentStatus = status;
                resolve(status);

                if (!deepEqual(status, oldStatus)) {
                    this.events.emit("status", status);
                    if (this.currentStatus?.powerOn !== oldStatus?.powerOn) {
                        this.events.emit(
                            "power",
                            this.currentStatus?.powerOn ?? -1,
                        );
                    }
                    if (this.currentStatus?.douserOn !== oldStatus?.douserOn) {
                        this.events.emit(
                            "douser",
                            this.currentStatus?.douserOn ?? -1,
                        );
                    }
                    if (this.currentStatus?.lampOn !== oldStatus?.lampOn) {
                        this.events.emit(
                            "lamp",
                            this.currentStatus?.lampOn ?? -1,
                        );
                    }
                    if (
                        this.currentStatus?.alarmLevel !== oldStatus?.alarmLevel
                    ) {
                        this.events.emit(
                            "alarm",
                            this.currentStatus?.alarmLevel ?? 0,
                        );
                    }
                    if (
                        this.currentStatus?.activeIndex !==
                        oldStatus?.activeIndex
                    ) {
                        this.events.emit(
                            "activeChannel",
                            this.currentStatus?.activeIndex ?? 0,
                        );
                    }
                }
            }
            reject();
        });
    }

    public async setPower(power: boolean): Promise<void> {
        if (!this.token) {
            console.error("Tried getting status without token.");
            return;
        }

        const res = await this.request(
            "cinemaprojector",
            "enableProjectorPower",
            {
                power: power ? 1 : 0,
            },
        );

        if (
            res &&
            res.data &&
            res.data["ns:enableProjectorPowerResponse"]?.result !== 0
        ) {
            throw new Error("Set power did not succeed", res.data);
        }
    }

    public async setDouser(open: boolean): Promise<void> {
        if (!this.token) {
            console.error("Tried getting status without token.");
            return;
        }

        const res = await this.request("cinemaprojector", "setDouserPosition", {
            token: this.token,
            douser: open ? 0 : 1, // 0 is open
        });

        if (
            res &&
            res.data &&
            res.data["ns:setDouserPositionResponse"]?.result !== 0
        ) {
            throw new Error("Set douser did not succeed", res.data);
        }
    }

    public async setLamp(on: boolean): Promise<void> {
        const res = await this.request("cinemaprojector", "enableLamp", {
            token: this.token,
            lamp: on ? 1 : 0,
        });

        if (
            res &&
            res.data &&
            res.data["ns:enableLampResponse"]?.result !== 0
        ) {
            throw new Error("Set lamp did not succeed", res.data);
        }
    }

    public async getChannels(): Promise<Channel[]> {
        const res = await this.request("cinemaprojector", "getAllChannels", {
            token: this.token,
            start: 1,
            end: 65,
        });

        if (res && res.data) {
            const items = (res.data.arrayofChannels?.item as any[]) ?? [];
            this.channels = items.map<Channel>((item: any) => ({
                index: item.index,
                name: item.name,
                use3D: item.use3d == 1,
                ILSOn: item.ilson !== 0,
                icon: item.icon,
            }));
            this.events.emit("channels", this.channels);
            return this.channels;
        }
        return [];
    }

    public async setChannel(index: number): Promise<void> {
        if (index > 64 || index < 1) {
            throw new Error("Channel index out of range, range is 1-64");
        }
        const res = await this.request(
            "cinemaprojector",
            "setChannelActiveIndex",
            {
                token: this.token,
                index: index,
            },
        );

        if (
            res &&
            res.data &&
            res.data["ns:setChannelActiveIndexResponse"]?.result !== index
        ) {
            throw new Error("Set channel did not succeed", res.data);
        }
    }

    private async request(
        namespace: string,
        action: string,
        bodyJson: Record<string, unknown> = {},
    ) {
        const body = this.xmlBuilder.build({
            "?xml": { "@_version": "1.0", "@_encoding": "utf-8" },
            "soap:Envelope": {
                "soap:Body": {
                    [action]: {
                        token: this.token,
                        "@_xmlns": `urn:${namespace}`,
                        ...bodyJson,
                    },
                },
                "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
                "@_xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
            },
        });

        try {
            const req = await this.api.post<any>("/" + namespace, body, {
                headers: {
                    SOAPAction: `urn:${namespace}/${action}`,
                },
                responseType: "text",
            });
            req.data = this.xmlParser.parse(req.data)?.["SOAP-ENV:Envelope"]?.[
                "SOAP-ENV:Body"
            ];
            return req;
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }

    [Symbol.dispose](): void {
        clearInterval(this.getStatusInterval);
    }
}
