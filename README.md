# Christie Controller

A simple package to control Christie cinema projectors that have the web interface.

## Use cases

- Scheduling power cycles.
- Programming to switch to Alternative Content.

## Features

- Toggle lamp/douser/power.
- Setting channel.
- Getting alarms.
- Full TypeScript support.
- Uses [@vue/reactivity](https://www.npmjs.com/package/@vue/reactivity) for reactive state

```ts
import { Projector, PowerState } from "christie-controller";
import { whenever } from "@vueuse/core";

const projector = new Projector("192.168.60.7");

projector.logIn("username", "password");

// Automatically get the status every 20 seconds
proj.startStatusInterval();

whenever(
    () => proj.currentStatus?.powerOn === PowerState.COOLDOWN,
    () => {
        console.log("Projector is cooling down");
        // Either use this to manually stop or use [Symbol.dispose](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/dispose)
        proj.stopStatusInterval();
    },
);
```

## Note

Don't rely on this package being fast and/or accurate. It just calls the API's that the web interface uses.

## Contributing

I provided a partial test server that can be used for testing basic commands. It's not finished.
