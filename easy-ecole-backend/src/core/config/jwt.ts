if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required. Set it in your .env file.')
}
export const JWT_SECRET = process.env.JWT_SECRET
