import {
  createApp,
  eventHandler,
  getHeader,
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

app.use(
  "/cinemaprojector",
  eventHandler((event) => {
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
            <powerOn>0</powerOn>
            <lampOn>0</lampOn>
            <douserOn>1</douserOn>
            <auxLensOn>0</auxLensOn>
            <lampLOCDoAutoStatus>0</lampLOCDoAutoStatus>
            <lampLOCStatus>0</lampLOCStatus>
            <testOn>0</testOn>
            <testSelectedTotal>5</testSelectedTotal>
            <malmInstalled>0</malmInstalled>
            <alarmLevel>0</alarmLevel>
            <activeIndex>2</activeIndex>
        </Notification>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

      default:
        setResponseStatus(event, 404);
        return "";
  })
);
