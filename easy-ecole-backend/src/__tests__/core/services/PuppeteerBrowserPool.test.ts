const mockLaunch = jest.fn()

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: { launch: mockLaunch },
}))

import { getPuppeteerBrowser } from '../../../core/services/PuppeteerBrowserPool'

describe('getPuppeteerBrowser', () => {
  it('désactive Crashpad et fournit des répertoires XDG inscriptibles', async () => {
    const browser = { newPage: jest.fn() }
    mockLaunch.mockResolvedValue(browser)

    await expect(getPuppeteerBrowser()).resolves.toBe(browser)
    expect(mockLaunch).toHaveBeenCalledWith(
      expect.objectContaining({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-crash-reporter',
          '--disable-breakpad',
        ],
        env: expect.objectContaining({
          HOME: expect.any(String),
          XDG_CONFIG_HOME: expect.any(String),
          XDG_CACHE_HOME: expect.any(String),
        }),
      }),
    )
  })
})
