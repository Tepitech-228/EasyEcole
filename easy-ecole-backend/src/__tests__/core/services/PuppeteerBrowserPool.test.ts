const mockLaunch = jest.fn()

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: { launch: mockLaunch },
}))

import { getPuppeteerBrowser } from '../../../core/services/PuppeteerBrowserPool'

describe('getPuppeteerBrowser', () => {
  it('désactive Crashpad pour le lancement de Chromium en conteneur', async () => {
    const browser = { newPage: jest.fn() }
    mockLaunch.mockResolvedValue(browser)

    await expect(getPuppeteerBrowser()).resolves.toBe(browser)
    expect(mockLaunch).toHaveBeenCalledWith({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-crash-reporter',
        '--disable-breakpad',
      ],
    })
  })
})
