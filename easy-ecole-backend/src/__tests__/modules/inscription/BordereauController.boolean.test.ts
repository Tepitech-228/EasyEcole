import BordereauController, { hasChoixFinal } from '../../../modules/inscription/controllers/BordereauController'

describe('hasChoixFinal', () => {
  it('should treat numeric 1 and string true as a valid final choice', () => {
    expect(hasChoixFinal([{ choixFinal: 1 }])).toBe(true)
    expect(hasChoixFinal([{ choixFinal: 'true' }])).toBe(true)
    expect(hasChoixFinal([{ choixFinal: true }])).toBe(true)
  })

  it('should return true when there is only one selected parcours, even without explicit final flag', () => {
    expect(hasChoixFinal([{ parcoursId: 7 }])).toBe(true)
    expect(hasChoixFinal([{ choixFinal: undefined, parcoursId: 7 }])).toBe(true)
    expect(hasChoixFinal([{ choixFinal: false, parcoursId: 7 }])).toBe(true)
  })

  it('should return false when no parcours is selected or no final parcours is set', () => {
    expect(hasChoixFinal([])).toBe(false)
    expect(hasChoixFinal(undefined)).toBe(false)
    expect(hasChoixFinal([{ choixFinal: false }, { choixFinal: false }])).toBe(false)
  })
})

describe('BordereauController', () => {
  it('should expose the helper', () => {
    expect(BordereauController).toBeDefined()
    expect(typeof hasChoixFinal).toBe('function')
  })
})
