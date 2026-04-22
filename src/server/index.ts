import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { basicAuth } from 'hono/basic-auth'

type Bindings = {
    ASSETS:Fetcher
    STAGING_AUTH?:string
    STAGING_PASSWORD?:string
}

const app = new Hono<{ Bindings:Bindings }>()

/**
 * Basic auth for staging branch deploys.
 * Set the secret via:
 *   wrangler secret put STAGING_PASSWORD --env staging
 */
app.use('*', async (c, next) => {
    if (c.env.STAGING_AUTH !== 'true') return next()
    const auth = basicAuth({
        username: 'staging',
        password: c.env.STAGING_PASSWORD || '',
    })
    return auth(c, next)
})

app.use('/api/*', cors())

/**
 * Health check
 */
app.get('/api/health', (c) => {
    return c.json({ status: 'ok', service: 'example' })
})

app.get('/api/helloworld', (c) => {
    return c.json({ message: 'Hello, World!' })
})

app.get('/health', c => {
    return c.json({ status: 'ok' })
})

/**
 * Serve static assets (Preact frontend)
 */
app.all('*', (c) => {
    if (!(c.env?.ASSETS)) {
        // In dev mode, let Vite handle static assets
        return c.notFound()
    }

    return c.env.ASSETS.fetch(c.req.raw)
})

export default app
