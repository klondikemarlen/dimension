import app from "@/app"

if (import.meta.env.PROD) {
  app.listen(3000)
}
