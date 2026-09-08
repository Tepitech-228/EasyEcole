const jwtSecret = process.env.JWT_SECRET
const weakSecrets = new Set([
    'secret',
    'change_me',
    'change_this_to_a_random_secret_key',
    'dev_secret_easyecole_2024_change_in_production'
])

if (!jwtSecret) {
    throw new Error('JWT_SECRET is required. Set it in your .env file.')
}

if (process.env.NODE_ENV === 'production' && (jwtSecret.length < 32 || weakSecrets.has(jwtSecret))) {
    throw new Error('JWT_SECRET must be a strong production secret of at least 32 characters.')
}

export const JWT_SECRET = jwtSecret
