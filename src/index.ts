import { config } from "dotenv";
config();

import("./Projector").then(({ Projector }) => {
    Projector.logIn();
});
