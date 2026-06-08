FROM sharelatex/sharelatex:4.2.8@sha256:904776b0e0722ba4f44e5397cba33bfe9584488c74c0aa7accce96a2477b2761

ENV DEBIAN_FRONTEND=noninteractive

# The stock Overleaf image is intentionally slim and may miss common LaTeX packages.
# Install a broader TeX Live set so templates using packages like fullpage,
# titlesec, enumitem, tabularx, xcolor, fancyhdr, babel, hyperref,
# glyphtounicode, latexmk, BibTeX/Biber, XeLaTeX, and LuaLaTeX compile reliably.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      latexmk \
      texlive-latex-base \
      texlive-latex-recommended \
      texlive-latex-extra \
      texlive-fonts-recommended \
      texlive-fonts-extra \
      texlive-extra-utils \
      texlive-science \
      texlive-pictures \
      texlive-xetex \
      texlive-luatex \
      texlive-bibtex-extra \
      biber \
      ghostscript \
      fonts-lmodern \
      fonts-noto \
      fonts-noto-cjk \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && mktexlsr
