const Hapi = require('@hapi/hapi')
require('dotenv').config()

const plugins = require('./plugins')
const routes = require('./routes')
const { init: usersInit } = require('./lib/data/users')
const { init: queueInit } = require('./lib/data/lib/sqs.listener')

const options = {
  port: process.env.PORT || 3000,
  cache: [{
    name: 'redis',
    provider: {
      constructor: require('@hapi/catbox-redis'),
      options: {
        partition: 'cache',
        host: 'hamster.mvrguz.0001.use1.cache.amazonaws.com'
      }
    }
  }]
}

const init = async () => {
  const server = Hapi.Server(options)

  await server.register(plugins)

  // hapi-auth-cookie stuff
  const cache = server.cache({
    cache: 'redis',
    segment: 'sessions',
    expiresIn: 3 * 24 * 60 * 60 * 1000
  })
  server.app.cache = cache

  server.ext('onPreHandler', (req, h) => {
    req.info.acceptEncoding = null
    return h.continue
  })

  server.auth.strategy('session', 'cookie', {
    cookie: {
      isSecure: false,
      name: 'hbfl-sid',
      password: 'password-should-be-32-characters'
    },
    validateFunc: async (request, session) => {
      const cached = await cache.get(session.sid)
      if (!cached) {
        return { valid: false }
      }
      return {
        credentials: cached.account,
        valid: true
      }
    }
  })

  server.auth.default('session')

  // register routes
  server.route(routes)

  // initialize database and start server
  // usersInit()
  // .then(() => queueInit())
  queueInit()
  .then(async () => {
    try {
      await server.start()
      console.log(`Server started at http://localhost:${server.info.port}`)
    } catch (err) {
      console.error(`Server could not start. Error: ${err}`)
    }
  })
}

init()
