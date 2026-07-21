import { copyFile, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import assert from "node:assert/strict"

import { createProjectService, createService } from "./create-service.ts"

const directory = await mkdtemp(join(tmpdir(), "dimension-parser-"))
const typeScriptSourcePath = join(directory, "sample.ts")
const rubySourcePath = join(directory, "sample.rb")
const uploadedTypeScriptReactPath = join(directory, "uploaded-typescript-react")
const uploadedCollidingTypeScriptPath = join(directory, "uploaded-colliding-typescript")
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
  uploadedTypeScriptReactPath,
  `function UserBadge() {
    const label = "ready"

    return <span>{label}</span>
  }
  `,
)

await writeFile(
  uploadedCollidingTypeScriptPath,
  `function ApiConfig() {
    return true
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

const projectGraph = createProjectService("sample-app", [
  "src/controllers/users-controller.ts",
  "src/controllers/broken.ts",
  "README.md",
  "node_modules/noise/index.ts",
], [
  {
    path: typeScriptSourcePath,
    relativePath: "src/controllers/users-controller.ts",
  },
  {
    path: join(directory, "missing.ts"),
    relativePath: "src/controllers/broken.ts",
  },
])

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

  const typeScriptReactGraph = createService(uploadedTypeScriptReactPath, "sample.tsx")
  const typeScriptReactNodeIdentifiers = typeScriptReactGraph.nodes.map((node) => node.id)

  assert(typeScriptReactNodeIdentifiers.includes("function:UserBadge"))
  assert(typeScriptReactNodeIdentifiers.includes("function:UserBadge:local:label"))

  const collidingTypeScriptGraph = createService(uploadedCollidingTypeScriptPath, "vite.config.ts")
  const collidingTypeScriptNodeIdentifiers = collidingTypeScriptGraph.nodes.map((node) => node.id)

  assert(collidingTypeScriptNodeIdentifiers.includes("function:ApiConfig"))

  const rubyGraph = createService(uploadedRubyPath, "sample.rb")
  const rubyNodeIdentifiers = rubyGraph.nodes.map((node) => node.id)

  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index:local:users"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index:local:names"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index:response:0"))
  assert(rubyNodeIdentifiers.includes("ruby:class:UsersController:method:index:error:0"))
  assert(rubyGraph.links.every((link) => rubyNodeIdentifiers.includes(link.source) && rubyNodeIdentifiers.includes(link.target)))

  const projectNodeIdentifiers = projectGraph.nodes.map((node) => node.id)

  assert(projectNodeIdentifiers.includes("folder:sample-app"))
  assert(projectNodeIdentifiers.includes("folder:sample-app/src"))
  assert(projectNodeIdentifiers.includes("folder:sample-app/src/controllers"))
  assert(projectNodeIdentifiers.includes("file:sample-app/src/controllers/users-controller.ts"))
  assert(projectNodeIdentifiers.includes("file:sample-app/src/controllers/broken.ts"))
  assert(projectNodeIdentifiers.includes("file:sample-app/README.md"))
  assert(!projectNodeIdentifiers.some((identifier) => identifier.includes("node_modules")))
  assert(projectNodeIdentifiers.includes("file:sample-app/src/controllers/users-controller.ts/class:UsersController"))
  assert(
    projectGraph.links.some(
      (link) =>
        link.source === "file:sample-app/src/controllers/users-controller.ts" &&
        link.target === "file:sample-app/src/controllers/users-controller.ts/class:UsersController",
    ),
  )
  assert(projectGraph.links.every((link) => projectNodeIdentifiers.includes(link.source) && projectNodeIdentifiers.includes(link.target)))
} finally {
  await rm(directory, { recursive: true, force: true })
}
