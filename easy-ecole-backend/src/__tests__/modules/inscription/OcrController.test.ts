import { mockRequest, mockResponse } from "../../helpers/express-mocks";
import OcrController from "../../../modules/inscription/controllers/OcrController";
import { QueueService } from "../../../core/queue/QueueService";

jest.mock("../../../core/queue/QueueService", () => ({
  QUEUE_NAMES: { OCR: "ocr" },
  QueueService: { getInstance: jest.fn() },
}));

describe("OcrController.preRemplissageAsync", () => {
  afterEach(() => jest.restoreAllMocks());

  it("logs queue failures and returns a service-unavailable response", async () => {
    const queueError = new Error("Redis unavailable");
    const add = jest.fn().mockRejectedValue(queueError);
    (QueueService.getInstance as jest.Mock).mockReturnValue({ add });
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const req = mockRequest({
      files: [{ path: "__missing_ocr_upload__.tmp" } as Express.Multer.File],
    });
    const res = mockResponse();

    await OcrController.preRemplissageAsync(req, res);

    expect(errorLog).toHaveBeenCalledWith("Erreur de mise en file OCR:", queueError);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "File OCR indisponible",
    });
  });
});
