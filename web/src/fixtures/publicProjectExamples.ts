import type { SourceGraph } from "@/types/source-graph"

export interface PublicProjectExample {
  id: string
  label: string
  title: string
  subtitle: string
  sourceName: string
  sourceUrl: string
  graph: SourceGraph
}

const travelAuthorizationUrl =
  "https://github.com/icefoganalytics/travel-authorization/blob/73fe26defe3f8320ee17fc2d6576446764716a5d/api/src/controllers/travel-authorizations-controller.ts"
const traditionalKnowledgeUrl =
  "https://github.com/icefoganalytics/traditional-knowledge/blob/03229975b69b29710abfaff249e75a822f28184a/api/src/controllers/information-sharing-agreements-controller.ts"
const elccUrl =
  "https://github.com/icefoganalytics/elcc-data-management/blob/dad88f38aaece46bd097e9bbd1a5fc3dfdbe1b34/api/src/controllers/funding-reconciliations-controller.ts"

export const publicProjectExamples: PublicProjectExample[] = [
  {
    id: "travel-authorizations",
    label: "Travel Authorization",
    title: "TravelAuthorizationsController",
    subtitle: "Public controller shape for request CRUD, policy checks, serializers, and itinerary loading.",
    sourceName: "icefoganalytics/travel-authorization/api/src/controllers/travel-authorizations-controller.ts",
    sourceUrl: travelAuthorizationUrl,
    graph: controllerGraph("TravelAuthorizationsController", [
      "index",
      "show",
      "create",
      "update",
      "destroy",
      "loadTravelAuthorization",
      "buildTravelAuthorization",
      "buildPolicy",
    ]),
  },
  {
    id: "traditional-knowledge-agreements",
    label: "Traditional Knowledge",
    title: "InformationSharingAgreementsController",
    subtitle: "Public controller shape for agreement lifecycle, confidentiality records, policy, and serialization.",
    sourceName:
      "icefoganalytics/traditional-knowledge/api/src/controllers/information-sharing-agreements-controller.ts",
    sourceUrl: traditionalKnowledgeUrl,
    graph: controllerGraph("InformationSharingAgreementsController", [
      "index",
      "show",
      "create",
      "update",
      "destroy",
      "loadInformationSharingAgreement",
      "buildInformationSharingAgreement",
      "buildPolicy",
    ]),
  },
  {
    id: "funding-reconciliations",
    label: "ELCC Data Management",
    title: "FundingReconciliationsController",
    subtitle: "Public controller shape for reconciliation CRUD, adjustment loading, policy, and serializers.",
    sourceName: "icefoganalytics/elcc-data-management/api/src/controllers/funding-reconciliations-controller.ts",
    sourceUrl: elccUrl,
    graph: controllerGraph("FundingReconciliationsController", [
      "index",
      "show",
      "create",
      "update",
      "destroy",
      "loadFundingReconciliation",
      "buildPolicy",
    ]),
  },
]

function controllerGraph(className: string, methods: string[]): SourceGraph {
  const classId = `class:${className}`
  const nodes: SourceGraph["nodes"] = [{ id: classId, label: className, type: "class" }]
  const links: SourceGraph["links"] = []

  methods.forEach((method) => {
    const methodId = `${classId}:method:${method}`
    nodes.push({ id: methodId, label: method, type: methodType(method) })
    links.push({ source: classId, target: methodId })
  })

  return { nodes, links }
}

function methodType(method: string): string {
  if (method === "buildPolicy") return "policy"
  if (method.startsWith("load")) return "async"
  if (method.startsWith("build")) return "helper"

  return "method"
}
