import express from "express"

import router from "@/router"

export const app = express()

app.use((_request, response, next) => {
  response.set("Access-Control-Allow-Origin", "*")
  next()
})

app.use(router)

export default app
