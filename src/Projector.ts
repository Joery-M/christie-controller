import { readonly, toRaw, watch } from "@vue/reactivity";
import debug from "debug";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import {
    clearIntervalAsync,
    setIntervalAsync,
    SetIntervalAsyncTimer,
} from "set-interval-async/fixed";
import { joinURL, parseURL, stringifyParsedURL } from "ufo";
import { isDeepStrictEqual } from "util";
import { ResultCache } from "./cache";
import { ProjectorState } from "./state";
import { Channel, ProjectorMainStatus, ProjectorSettings } from "./types";

const deepEqual = (v1: any, v2: any) => isDeepStrictEqual(v1, v2, { skipPrototype: true });

export class Projector implements Disposable {
    private token?: string;

    private cache: ResultCache;

    private xmlBuilder = new XMLBuilder({ ignoreAttributes: false });
    private xmlParser = new XMLParser({
        ignoreAttributes: false,
    });

    private state = new ProjectorState();

    public get currentStatus(): Readonly<ProjectorMainStatus> {
        return readonly(this.state.status.value);
    }
    public get channels(): Readonly<Channel[]> {
        return readonly(this.state.channels.value);
    }
    public get authenticated(): boolean {
        return this.state.authenticated.value;
    }

    private endpoint: string;
    constructor(
        host: string,
        private settings: ProjectorSettings = {},
    ) {
        this.endpoint = stringifyParsedURL(parseURL(host, "http://"));
        if (this.endpoint === "http://") {
            throw Error(`Could not parse host: ${JSON.stringify(host)}`);
        }

        if (settings.disableCache) {
            this.cache = new ResultCache(0, true);
        } else if (settings.cacheTTL != null) {
            this.cache = new ResultCache(settings.cacheTTL);
        } else {
            this.cache = new ResultCache(10);
        }
    }

    public async logIn(username: string, password: string): Promise<boolean> {
        const res = await this.request("security", "login", {
            token: "",
            username,
            password,
        });
        if (res.success) {
            const token = res.data["ns:loginResponse"]?.token;
            if (token) {
                this.token = token;

                if (this.settings.getChannelsOnLogin) await this.getChannels();
                if (this.settings.getStatusOnLogin) await this.getStatus();

                return (this.state.authenticated.value = true);
            }
            return (this.state.authenticated.value = false);
        }
        throw Error("Error authenticating", { cause: res });
    }

    private statusInterval?: SetIntervalAsyncTimer<[]>;
    public startStatusInterval(): void {
        const log = debug("christie:interval");
        watch(
            this.state.authenticated,
            (isAuth) => {
                if (isAuth) {
                    if (!this.statusInterval) {
                        log("Starting status interval");
                        this.getChannels();
                        this.getStatus();
                        this.statusInterval = setIntervalAsync(async () => {
                            log("Requesting status on interval");
                            await Promise.allSettled([this.getChannels(), this.getStatus()]);
                        }, 30_000);
                    }
                } else {
                    if (this.statusInterval) {
                        log("Stopping status interval");
                        clearIntervalAsync(this.statusInterval);
                    }
                }
            },
            { immediate: true },
        );
    }

    public async getStatus(): Promise<ProjectorMainStatus> {
        return (
            this.cache.get<ProjectorMainStatus>("status") ??
            this.cache.store("status", this._getStatus())
        );
    }
    private async _getStatus(): Promise<ProjectorMainStatus> {
        if (!this.token) {
            throw Error("Tried getting status without token.");
        }
        const res = await this.request("cinemaprojector", "getMainStatus");

        if (res.success) {
            const status = res.data.Notification as ProjectorMainStatus;

            if (!deepEqual(toRaw(this.state.status.value), status))
                this.state.status.value = status;

            return status;
        }
        throw Error("Error getting the status of the projector", { cause: res });
    }

    public async setPower(power: boolean): Promise<void> {
        if (!this.token) {
            throw Error("Tried getting status without token.");
        }

        const res = await this.request("cinemaprojector", "enableProjectorPower", {
            power: power ? 1 : 0,
        });

        if (res.success) {
            if (res.data["ns:enableProjectorPowerResponse"]?.result !== 0) {
                throw Error(`Set power to ${power} did not succeed`, res.data);
            } else {
                this.cache.invalidate("status");
            }
        } else {
            throw Error("Error setting the power of the projector", { cause: res });
        }
    }

    public async setDouser(open: boolean): Promise<void> {
        if (!this.token) {
            throw Error("Tried getting status without token.");
        }

        const res = await this.request("cinemaprojector", "setDouserPosition", {
            douser: open ? 0 : 1, // 0 is open
        });

        if (res.success) {
            if (res.data["ns:setDouserPositionResponse"]?.result !== 0) {
                throw Error(`Set douser to ${open} did not succeed`, res.data);
            } else {
                this.cache.invalidate("status");
            }
        } else {
            throw Error("Error setting the douser of the projector", { cause: res });
        }
    }

    public async setLamp(on: boolean): Promise<void> {
        const res = await this.request("cinemaprojector", "enableLamp", {
            lamp: on ? 1 : 0,
        });

        if (res.success) {
            if (res.data["ns:enableLampResponse"]?.result !== 0) {
                throw Error(`Set lamp to ${on} did not succeed`, res.data);
            } else {
                this.cache.invalidate("status");
            }
        } else {
            throw Error("Error setting the lamp of the projector", { cause: res });
        }
    }

    public async getChannels(): Promise<Channel[]> {
        return (
            this.cache.get<Channel[]>("getChannels") ??
            this.cache.store("getChannels", this._getChannels())
        );
    }
    private async _getChannels(): Promise<Channel[]> {
        const res = await this.request("cinemaprojector", "getAllChannels", {
            start: 1,
            end: 65,
        });

        if (res.success) {
            const items = (res.data.arrayofChannels?.item as any[]) ?? [];
            const newChannels = items.map<Channel>((item: any) => ({
                index: item.index,
                name: item.name,
                use3D: item.use3d == 1,
                ILSOn: item.ilson !== 0,
                icon: item.icon,
            }));

            if (!deepEqual(toRaw(this.state.channels.value), newChannels))
                this.state.channels.value = newChannels;

            return newChannels;
        }
        throw Error("Error getting the channels of the projector", { cause: res });
    }

    public async setChannel(index: number): Promise<void> {
        if (index > 64 || index < 1) {
            throw Error("Channel index out of range, range is 1-64");
        }
        const res = await this.request("cinemaprojector", "setChannelActiveIndex", {
            index: index,
        });

        if (res.success) {
            if (res.data["ns:setChannelActiveIndexResponse"]?.result !== index) {
                throw Error(`Set channel to ${index} did not succeed`, res.data);
            } else {
                this.cache.invalidate("status");
            }
        } else {
            throw Error("Error setting the channel of the projector", { cause: res });
        }
    }

    private async request(
        namespace: string,
        action: string,
        data: Record<string, unknown> = {},
    ): Promise<Response> {
        const log = debug("christie:request");
        log("Sending request to namespace", namespace, "with action", action, "and data", data);
        const body = this.xmlBuilder.build({
            "?xml": { "@_version": "1.0", "@_encoding": "utf-8" },
            "soap:Envelope": {
                "soap:Body": {
                    [action]: {
                        token: this.token,
                        "@_xmlns": `urn:${namespace}`,
                        ...data,
                    },
                },
                "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
                "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
                "@_xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
            },
        });

        const headers = new Headers();
        headers.append("SOAPAction", `urn:${namespace}/${action}`);
        headers.append("content-type", "text/xml; charset=UTF-8");

        const fetchResponse = await fetch(joinURL(this.endpoint, namespace), {
            headers,
            method: "POST",
            body,
            keepalive: true,
        });
        const textData = await fetchResponse.text();
        const responseData =
            this.xmlParser.parse(textData)?.["SOAP-ENV:Envelope"]?.["SOAP-ENV:Body"];
        log(`Response to ${namespace}:${action}:`, responseData);
        return {
            data: responseData,
            success: !!responseData && fetchResponse.ok,
            originalResponse: fetchResponse,
        };
    }

    stopStatusInterval(): void {
        if (this.statusInterval) clearIntervalAsync(this.statusInterval);
    }

    [Symbol.dispose](): void {
        this.stopStatusInterval();
    }
}

export interface Response {
    data: any;
    success: boolean;
    originalResponse: globalThis.Response;
}
