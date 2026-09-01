import type { APIRoute, GetStaticPaths } from "astro";
import { getAllPapers, paperSlug, type PaperEntry } from "../../../lib/papers";
import { buildCitationExportResponse } from "../../../lib/publication";

export const getStaticPaths: GetStaticPaths = async () => {
  const papers = await getAllPapers();
  return papers.map((paper) => ({
    params: { slug: paperSlug(paper) },
    props: { paper },
  }));
};

export const GET: APIRoute = ({ props }) => {
  const paper = props.paper as PaperEntry;
  const slug = paperSlug(paper);
  return buildCitationExportResponse([paper.data], "ris", slug);
};
