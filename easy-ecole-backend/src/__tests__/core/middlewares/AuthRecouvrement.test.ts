import { RolesUtilisateur } from '../../../core/enums/RolesUtilisateur'
import { mockNext, mockRequest, mockResponse } from '../../helpers/express-mocks'
import { AuthRecouvrement } from '../../../core/middlewares/AuthRecouvrement'

describe('AuthRecouvrement', () => {
  it('refuse les accès de caisse au secrétariat', () => {
    const res = mockResponse()

    AuthRecouvrement(
      mockRequest({ utilisateurRole: 'secretaire' } as any),
      res,
      mockNext()
    )

    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('autorise ESA Compta', () => {
    const res = mockResponse()
    const next = mockNext()

    AuthRecouvrement(
      mockRequest({ utilisateurRole: RolesUtilisateur.ESA_COMPTA } as any),
      res,
      next
    )

    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it('refuse le rôle historique caissier banque', () => {
    const res = mockResponse()

    AuthRecouvrement(
      mockRequest({ utilisateurRole: RolesUtilisateur.CAISSIER_BANQUE } as any),
      res,
      mockNext()
    )

    expect(res.status).toHaveBeenCalledWith(403)
  })
})
