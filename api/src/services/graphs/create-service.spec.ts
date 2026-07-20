import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import assert from "node:assert/strict"

import { createService } from "./create-service.ts"

const directory = await mkdtemp(join(tmpdir(), "dimension-parser-"))
const typeScriptSourcePath = join(directory, "sample.ts")
const rubySourcePath = join(directory, "sample.rb")
const uploadedRubyPath = join(directory, "uploaded-ruby")

await writeFile(
  typeScriptSourcePath,
  `class UsersController {
    async index() {
      const users = await fetchUsers()
      const names = users.map((user) => {
        const displayName = user.profile.name
        return displayName
      })

      try {
        return names
      } catch {
        return []
      }
    }
  }

  const buildWhere = () => {
    const filter = true
    return filter
  }
  `,
)

await writeFile(
  rubySourcePath,
  `class UsersController
    def index
      users = User.all
      names = users.map(&:name)
      render json: names
    rescue StandardError
      raise
    end
  end
  `,
)

await copyFile(rubySourcePath, uploadedRubyPath)

try {
  const typeScriptGraph = createService(typeScriptSourcePath)
  const typeScriptNodeIdentifiers = typeScriptGraph.nodes.map((node) => node.id)

  assert(typeScriptNodeIdentifiers.includes("class:UsersController"))
  assert(typeScriptNodeIdentifiers.includes("class:UsersController:method:index"))
  assert(typeScriptNodeIdentifiers.includes("class:UsersController:method:index:local:users"))
  assert(typeScriptNodeIdentifiers.includes("class:UsersController:method:index:return:0"))
  assert(typeScriptNodeIdentifiers.includes("class:UsersController:method:index:error:0"))
  assert(typeScriptNodeIdentifiers.includes("function:buildWhere"))
  assert(!typeScriptNodeIdentifiers.some((identifier) => identifier.includes("displayName")))
  assert(
    typeScriptGraph.links.every(
      (link) => typeScriptNodeIdentifiers.includes(link.source) && typeScriptNodeIdentifiers.includes(link.target),
    ),
  )

  const rubyGraph = createService(uploadedRubyPath, "sample.rb")
  const rubyNodeIdentifiers = rubyGraph.nodes.map((node) => node.id)

  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index:local:users"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index:local:names"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index:response:0"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index:error:0"))
  assert(rubyGraph.links.every((link) => rubyNodeIdentifiers.includes(link.source) && rubyNodeIdentifiers.includes(link.target)))
} finally {
  await rm(directory, { recursive: true, force: true })
}
