describe('Jest Setup', () => {
  it('jest est correctement configuré', () => {
    expect(1 + 1).toBe(2)
  })

  it('ts-jest compile le TypeScript correctement', () => {
    const message: string = 'Hello Tests'
    expect(message).toBe('Hello Tests')
  })
})
