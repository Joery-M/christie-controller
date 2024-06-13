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
