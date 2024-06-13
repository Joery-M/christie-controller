# Christie Controller

A simple package to control Christie cinema projectors that have the web interface.

## Use cases

- Scheduling power cycles.
- Programming to switch to Alternative Content.
- Integrate into systems like [Node-RED](https://nodered.org/).

## Features

- Toggle lamp/douser/power.
- Setting channel.
- Getting alarms.
- Full typescript support.
- Events

```ts
import { Projector, PowerState } from "christie-controller";

const projector = new Projector("192.168.60.7");

projector.logIn("username", "password");

projector.events.on("status", (status) => {
    if (status.powerOn == PowerState.COOLDOWN)
        console.log("Projector is cooling down");
});
```

## Note

Don't rely on this package being fast and/or accurate. It just calls the API's that the web interface uses.

## Contributing

I provided a partial test server that can be used for testing basic commands. It's not finished.

Use corepack by running `corepacke enable`. Requires a version of node that supports corepack.
