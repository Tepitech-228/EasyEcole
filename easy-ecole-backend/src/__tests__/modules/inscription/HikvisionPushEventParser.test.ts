import { isHikvisionHeartbeat, parseHikvisionPushEvent } from "../../../modules/inscription/services/HikvisionPushEventParser";
import { HikvisionAlertStreamParser } from "../../../modules/inscription/services/HikvisionAlertStreamParser";

const realMultipartPayload = JSON.stringify({
  ipAddress: "192.168.137.188",
  portNo: 3001,
  protocol: "HTTP",
  macAddress: "88:de:39:4e:0a:b4",
  channelID: 1,
  dateTime: "2026-10-27T11:15:14+01:00",
  activePostCount: 1,
  eventType: "AccessControllerEvent",
  eventState: "active",
  eventDescription: "Access Controller Event",
  shortSerialNumber: "GK9743517",
  AccessControllerEvent: {
    deviceName: "Access Controller",
    majorEventType: 5,
    subEventType: 6,
    name: "Bryan TETE",
    cardReaderNo: 1,
    employeeNoString: "ETBADMST0002",
    serialNo: 25,
    userType: "normal",
    currentVerifyMode: "faceOrFpOrCardOrPw",
    frontSerialNo: 24,
    label: "",
    mask: "no",
    picturesNumber: 1,
    purePwdVerifyEnable: true,
    FaceRect: { height: 0.64, width: 0.363, x: 0.356, y: 0.332 }
  }
});

describe("parseHikvisionPushEvent", () => {
  it("parses the real multipart field sent by the terminal", () => {
    const event = parseHikvisionPushEvent({ AccessControllerEvent: realMultipartPayload });

    expect(event).toEqual({
      employeeNoString: "ETBADMST0002",
      name: "Bryan TETE",
      date: "2026-10-27",
      time: "11:15:14",
      major: 5,
      minor: 6
    });
  });

  it("keeps the terminal local time instead of converting it to UTC", () => {
    const payload = JSON.stringify({
      dateTime: "2026-10-27T23:45:00+01:00",
      AccessControllerEvent: {
        majorEventType: 5,
        subEventType: 6,
        employeeNoString: "ETBADMST0002",
        name: "Bryan TETE"
      }
    });

    const event = parseHikvisionPushEvent({ AccessControllerEvent: payload });

    expect(event?.date).toBe("2026-10-27");
    expect(event?.time).toBe("23:45:00");
  });

  it("still accepts the legacy event_log object format", () => {
    const event = parseHikvisionPushEvent({
      event_log: {
        AccessControllerEvent: {
          employeeNoString: "ETBGENST0003",
          name: "AYITE",
          time: "2026-10-27T08:05:09+01:00",
          major: 5,
          minor: 6
        }
      }
    });

    expect(event).toMatchObject({
      employeeNoString: "ETBGENST0003",
      date: "2026-10-27",
      time: "08:05:09",
      major: 5,
      minor: 6
    });
  });

  it("accepts a direct AccessControllerEvent object", () => {
    const event = parseHikvisionPushEvent({
      AccessControllerEvent: {
        employeeNoString: "ETBSURST0001",
        name: "Kilo LALA",
        time: "2026-10-27T09:00:00+01:00",
        major: 5,
        minor: 6
      }
    });

    expect(event?.employeeNoString).toBe("ETBSURST0001");
  });

  it("rejects a payload without employee number", () => {
    const event = parseHikvisionPushEvent({
      AccessControllerEvent: {
        majorEventType: 5,
        subEventType: 6,
        dateTime: "2026-10-27T11:15:14+01:00"
      }
    });

    expect(event).toBeNull();
  });

  it("rejects an invalid event time", () => {
    const event = parseHikvisionPushEvent({
      AccessControllerEvent: JSON.stringify({
        dateTime: "27/10/2026 11:15",
        AccessControllerEvent: {
          majorEventType: 5,
          subEventType: 6,
          employeeNoString: "ETBADMST0002"
        }
      })
    });

    expect(event).toBeNull();
  });

  it("rejects malformed JSON in the multipart field", () => {
    expect(parseHikvisionPushEvent({ AccessControllerEvent: "{not-json" })).toBeNull();
  });

  it("recognizes the terminal heartbeat so it can be acknowledged", () => {
    expect(isHikvisionHeartbeat(JSON.stringify({ eventType: "heartBeat", dateTime: "2026-10-27T13:00:00+01:00" }))).toBe(true);
    expect(isHikvisionHeartbeat({ heartbeat: "{\"eventType\":\"heartBeat\"}" })).toBe(true);
    expect(isHikvisionHeartbeat({ AccessControllerEvent: realMultipartPayload })).toBe(false);
  });
});

describe("HikvisionAlertStreamParser", () => {
  it("extracts JSON events from multipart responses and skips binary parts", () => {
    const events: unknown[] = [];
    const parser = new HikvisionAlertStreamParser(event => events.push(event));
    const event = JSON.stringify({
      dateTime: "2026-10-29T08:15:30+01:00",
      AccessControllerEvent: {
        majorEventType: 5,
        subEventType: 6,
        employeeNoString: "ESA001"
      }
    });
    const response = Buffer.from(
      "HTTP/1.1 200 OK\r\nContent-Type: multipart/mixed; boundary=frame\r\n\r\n" +
      "--frame\r\nContent-Type: application/json\r\nContent-Length: " + Buffer.byteLength(event) + "\r\n\r\n" + event + "\r\n" +
      "--frame\r\nContent-Type: image/jpeg\r\nContent-Length: 4\r\n\r\n" + "\\xff\\xd8\\xff\\xd9" + "\r\n--frame\r\n"
    );

    for (let offset = 0; offset < response.length; offset += 17) {
      parser.push(response.subarray(offset, offset + 17));
    }

    expect(events).toEqual([JSON.parse(event)]);
  });
});
