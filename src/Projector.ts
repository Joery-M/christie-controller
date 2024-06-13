import axios from "axios";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

export class Projector {
  private static get host() {
    return process.env.PROJECTOR_HOST;
  }
  private static get username() {
    return process.env.PROJECTOR_USERNAME;
  }
  private static get password() {
    return process.env.PROJECTOR_PASSWORD;
  }
  private static token?: string;

  private static api = axios.create({
    baseURL: this.host,
    headers: {
      "content-type": "text/xml; charset=UTF-8",
    },
  });

  public static authenticated = false;

  private static xmlBuilder = new XMLBuilder({ ignoreAttributes: false });
  private static xmlParser = new XMLParser({
    ignoreAttributes: false,
  });

  public static async logIn() {
    const body = this.xmlBuilder.build({
      "?xml": { "@_version": "1.0", "@_encoding": "utf-8" },
      "soap:Envelope": {
        "soap:Body": {
          login: {
            token: "blank_token",
            username: this.username,
            password: this.password,
            "@_xmlns": "urn:security",
          },
        },
        "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
        "@_xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
      },
    });

    const req = await this.api.post<string>("/security", body, {
      headers: {
        SOAPAction: "urn:security/login",
      },
      responseType: "text",
    });

    if (req.status == 200) {
      const res = this.xmlParser.parse(req.data);
      const token =
        res["SOAP-ENV:Envelope"]?.["SOAP-ENV:Body"]?.["ns:loginResponse"].token;
      if (token) {
        this.token = token;
        this.authenticated = true;
      }
    }
  }
}
