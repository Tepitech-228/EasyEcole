import { Request, Response } from 'express'

export function mockRequest(data?: Partial<Request>): Request {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: 'GET',
    url: '/',
    ...data,
  } as unknown as Request
}

export function mockResponse(): Response {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.sendStatus = jest.fn().mockReturnValue(res)
  res.setHeader = jest.fn().mockReturnValue(res)
  res.end = jest.fn().mockReturnValue(res)
  return res as Response
}

export function mockNext(): jest.Mock {
  return jest.fn()
}
