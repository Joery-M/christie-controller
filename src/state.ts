import { Ref, ref, ShallowRef, shallowRef } from "@vue/reactivity";
import { Channel, ProjectorMainStatus } from "./types";

export class ProjectorState {
    status: Ref<ProjectorMainStatus> = ref<ProjectorMainStatus>({
        powerOn: null,
        lampOn: null,
        douserOn: null,
        auxLensOn: null,
        lampLOCDoAutoStatus: null,
        lampLOCStatus: null,
        testOn: null,
        testSelectedTotal: null,
        malmInstalled: null,
        alarmLevel: null,
        activeIndex: null,
    });

    channels: ShallowRef<Channel[], Channel[]> = shallowRef<Channel[]>([]);

    authenticated: Ref<boolean> = ref(false);
}
