\documentclass[12pt]{article}

% --- Journal metadata helpers (edit these) ---
\newcommand{\paperTitle}{}
\newcommand{\paperAuthors}{}
\newcommand{\paperCourse}{ECON 495}
\newcommand{\paperDept}{Department of Economics}
\newcommand{\paperUni}{University of Nevada, Las Vegas}

\newcommand{\paperKeywords}{}
\newcommand{\paperCategories}{} % e.g., Applied Microeconomics; Methods and Econometrics
\newcommand{\paperAuthorNotes}{} % e.g., acknowledgements / disclosures

% ... (rest of the preamble unchanged)

\newcommand{\paperAbstract}{%
}

{\color{ECONRed}\LARGE\textbf{ECON 495 Journal}\par}

% ... (rest of the document preamble unchanged)

{\justifying \paperAbstract\par}

{\textbf{Keywords:} \paperKeywords\par}

{\textbf{Categories:}\par}
{\paperCategories\par}
\vspace{0.25cm}
{\textbf{Author’s Notes:}\par}
{\paperAuthorNotes\par}

\begin{table}[H]
% \small  % <-- This line removed

% ... (rest of the table unchanged)
\end{table}

\begin{document}
\setstretch{1.0}
% Keep footnotes at the same size as body text
\makeatletter
\renewcommand{\footnotesize}{\normalsize}
\makeatother

% ... (rest of the document unchanged)

\vspace{0.4cm}

% Start body on a new page
\newpage

% =========================
% Body (two columns)
% =========================
\begin{multicols}{2}

\section{Introduction}
% Write your introduction here.

\section{Literature Review}
% Summarize related research and position your contribution.

\section{Data}
% Describe data sources, sample construction, and key variables.

\section{Methodology}
% Present your empirical strategy / model / identification.

\section{Results}
% Present main results, robustness checks, and interpretation.

\section{Conclusion}
% Summarize findings, implications, and limitations.

\end{multicols}

\begin{thebibliography}{9}
% Add your references here, or switch to BibTeX if preferred.
\end{thebibliography}