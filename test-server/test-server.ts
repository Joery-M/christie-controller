import {
    createApp,
    eventHandler,
    getHeader,
    readBody,
    setResponseHeader,
    setResponseStatus,
} from "h3";

export const app = createApp();

// app.use(
//   "/",
//   eventHandler(() => "Hello world!")
// );
app.use(
    "/security",
    eventHandler((event) => {
        const action = getHeader(event, "SOAPAction");
        setResponseHeader(event, "Content-Type", "text/xml; charset=utf-8");
        console.log(action);
        switch (action) {
            case "urn:security/login":
                return `<?xml version="1.0" encoding="UTF-8"?>
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ns="urn:security">
        <SOAP-ENV:Body SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
            <ns:loginResponse>
                <token>ccd4d366d0ebd77ca417492a3ce865997dcfb708047e6e46</token>
            </ns:loginResponse>
        </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>`;

            default:
                setResponseStatus(event, 404);
                return "";
        }
    })
);

let isOff = 0;
let isLampOn = 0;
let isDouserClosed = 1;
let alarmLevel = 0;

app.use(
    "/cinemaprojector",
    eventHandler(async (event) => {
        const action = getHeader(event, "SOAPAction");
        setResponseHeader(event, "Content-Type", "text/xml; charset=utf-8");
        console.log(action);

        switch (action) {
            case "urn:cinemaprojector/getMainStatus":
                return `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ns="urn:cinemaprojector">
    <SOAP-ENV:Body SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <Notification>
            <powerOn>${isOff}</powerOn>
            <lampOn>${isLampOn}</lampOn>
            <douserOn>${isDouserClosed}</douserOn>
            <auxLensOn>0</auxLensOn>
            <lampLOCDoAutoStatus>0</lampLOCDoAutoStatus>
            <lampLOCStatus>0</lampLOCStatus>
            <testOn>0</testOn>
            <testSelectedTotal>5</testSelectedTotal>
            <malmInstalled>0</malmInstalled>
            <alarmLevel>${alarmLevel}</alarmLevel>
            <activeIndex>2</activeIndex>
        </Notification>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

            case "urn:cinemaprojector/enableProjectorPower": {
                const isOffRegex = /(?<=<power>)[0-9](?=<\/power>)/;
                const body = await readBody(event);
                // Invert cause why tf would it make sense
                isOff =
                    parseInt(isOffRegex.exec(body)?.[0] ?? "0") == 0 ? 1 : 0;
                return `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:ns="urn:cinemaprojector">
    <SOAP-ENV:Body SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
        <ns:enableProjectorPowerResponse>
            <result>0</result>
        </ns:enableProjectorPowerResponse>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;
            }

            default:
                setResponseStatus(event, 404);
                return "";
        }
    })
);
