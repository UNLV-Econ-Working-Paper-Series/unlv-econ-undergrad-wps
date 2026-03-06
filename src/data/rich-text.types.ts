export type RichTextTone = "strong" | "em" | "code";

export interface RichTextSegment {
  text: string;
  tone?: RichTextTone;
}

export interface RichTextParagraphBlock {
  type: "paragraph";
  segments: RichTextSegment[];
}

export interface RichTextHeadingBlock {
  type: "heading";
  text: string;
}

export interface RichTextCodeBlock {
  type: "code";
  code: string;
}

export type RichTextBlock = RichTextParagraphBlock | RichTextHeadingBlock | RichTextCodeBlock;
