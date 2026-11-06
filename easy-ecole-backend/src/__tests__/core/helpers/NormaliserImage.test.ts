import { NextFunction } from "express"
import multer from "multer"
import { normaliserImages } from "../../../core/helpers/NormaliserImage"

describe("normaliserImages", () => {
    it("refuse un fichier qui dépasse la taille après normalisation", async () => {
        const fichier = {
            path: "photo.gif",
            size: 6 * 1024 * 1024,
            originalname: "photo.gif",
            filename: "photo.gif",
            mimetype: "image/gif",
        } as Express.Multer.File
        const req = { files: [fichier] }
        const next = jest.fn() as jest.MockedFunction<NextFunction>

        await normaliserImages({
            dimensionMax: 1200,
            tailleMaxOctets: 5 * 1024 * 1024,
        })(req as any, {} as any, next)

        expect(next.mock.calls[0][0]).toBeInstanceOf(multer.MulterError)
        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            code: "LIMIT_FILE_SIZE",
        }))
    })

    it("continue quand chaque fichier respecte la taille configurée", async () => {
        const fichier = {
            path: "photo.gif",
            size: 4 * 1024 * 1024,
            originalname: "photo.gif",
            filename: "photo.gif",
            mimetype: "image/gif",
        } as Express.Multer.File
        const req = { files: [fichier] }
        const next = jest.fn() as jest.MockedFunction<NextFunction>

        await normaliserImages({
            dimensionMax: 1200,
            tailleMaxOctets: 5 * 1024 * 1024,
        })(req as any, {} as any, next)

        expect(next).toHaveBeenCalledWith()
    })
})
