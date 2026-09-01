import type { APIRoute, GetStaticPaths } from "astro";
import { getIssueGroups, type IssueGroup } from "../../../lib/papers";
import { buildCitationExportResponse } from "../../../lib/publication";

export const getStaticPaths: GetStaticPaths = async () => {
  const issues = await getIssueGroups();
  return issues
    .filter((issue) => issue.papers.length > 0)
    .map((issue) => ({ params: { issue: issue.slug }, props: { issue } }));
};

export const GET: APIRoute = ({ props }) => {
  const issue = props.issue as IssueGroup;
  return buildCitationExportResponse(
    issue.papers.map((paper) => paper.data),
    "ris",
    `${issue.slug}-citations`,
  );
};
