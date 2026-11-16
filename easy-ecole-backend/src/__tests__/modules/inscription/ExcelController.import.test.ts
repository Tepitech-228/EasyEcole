import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import ExcelJS from 'exceljs'
import { mockRequest, mockResponse } from '../../helpers/express-mocks'
import ExcelController from '../../../modules/inscription/controllers/ExcelController'
import { Cours } from '../../../modules/inscription/models/Cours'
import { Ecue } from '../../../modules/inscription/models/Ecue'
import { Parcours } from '../../../modules/inscription/models/Parcours'
import { RedisClient } from '../../../core/cache/RedisClient'

async function createWorkbook(rows: string[][]): Promise<{ directory: string; filePath: string }> {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'easyecole-ue-import-'))
  const filePath = path.join(directory, 'maquette.xlsx')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('UE')
  worksheet.addRows(rows)
  await workbook.xlsx.writeFile(filePath)
  return { directory, filePath }
}

describe('ExcelController.importUe — rattachement au parcours', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Parcours, 'findByPk').mockResolvedValue({ id: 42, type: 'LICENCE' } as Parcours)
    jest.spyOn(Cours, 'findOrCreate').mockResolvedValue([
      { id: 71, update: jest.fn().mockResolvedValue(undefined) } as unknown as Cours,
      true,
    ])
    jest.spyOn(Ecue, 'findOrCreate').mockResolvedValue([
      { id: 81, enseignantId: null } as unknown as Ecue,
      true,
    ])
    jest.spyOn(Cours.sequelize!, 'transaction').mockResolvedValue({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    } as any)
    jest.spyOn(RedisClient, 'getInstance').mockReturnValue({
      delByPattern: jest.fn().mockResolvedValue(undefined),
    } as unknown as RedisClient)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it.each([
    {
      format: 'A',
      rows: [
        ["CODE DE L'UE", "INTITULE DE L'UE", 'CONTENUS DES ENSEIGNEMENTS', 'TYPE', 'CM', 'TD/TP', 'TPE', 'CREDIT'],
        ['UE101', 'Introduction', 'ECUE101: Bases', 'F', '20', '10', '0', '3'],
      ],
    },
    {
      format: 'B',
      rows: [
        ["CODE DE L'UE", 'INTITULE DES ENSEIGNEMENTS', '', 'CONTENUS DES ENSEIGNEMENTS', 'TYPE', 'CM', 'TD/TP', 'TPE', 'TOTAL', 'TOTAL PRESENTIEL', 'CREDIT'],
        ["CODE DE L'UE", 'UE', '', 'ECUE', 'TYPE', 'CM', 'TD/TP', 'TPE', 'TOTAL', 'TOTAL PRESENTIEL', 'CREDIT'],
        ['UE201', 'Gestion', '', '1. ECUE201 : Principes', 'F', '20', '10', '0', '30', '30', '3'],
      ],
    },
  ])('assigne parcoursId au cours et à ses ECUE lors de l’import Format $format', async ({ rows }) => {
    const { directory, filePath } = await createWorkbook(rows)
    const req = mockRequest({
      body: { parcoursId: '42' },
      file: { path: filePath, originalname: 'maquette.xlsx' },
    } as any)
    const res = mockResponse()

    try {
      await ExcelController.importUe(req, res)

      expect(Parcours.findByPk).toHaveBeenCalledWith(42)
      expect(Cours.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ parcoursId: 42 }),
        defaults: expect.objectContaining({ parcoursId: 42 }),
      }))
      expect(Ecue.findOrCreate).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ coursId: 71 }),
      }))
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        importedCount: 1,
        errorCount: 0,
      }))
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })
})
