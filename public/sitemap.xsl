<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" />
  <xsl:template match="/">
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Карта сайта — Navi.training</title>
        <style>
          :root { color-scheme: light; --sea:#073746; --sea-2:#0d4c5d; --paper:#f7faf9; --mist:#e9f2f1; --orange:#ffb052; --ink:#163e49; --muted:#52656b; --line:rgba(7,55,70,.16); }
          * { box-sizing:border-box; }
          body { margin:0; color:var(--ink); background:var(--paper); font-family:Arial,Helvetica,sans-serif; }
          header { position:relative; isolation:isolate; min-height:430px; overflow:hidden; padding:clamp(5rem,9vw,8rem) max(1.25rem,calc((100vw - 1120px)/2)); color:white; background:linear-gradient(135deg,var(--sea),var(--sea-2)); }
          header::before { content:""; position:absolute; z-index:-1; width:min(48vw,620px); aspect-ratio:1; right:-8vw; top:-38%; border:1px solid rgba(255,255,255,.15); border-radius:50%; box-shadow:0 0 0 72px rgba(255,255,255,.045),0 0 0 144px rgba(255,255,255,.035),0 0 0 216px rgba(255,255,255,.025); }
          header::after { content:""; position:absolute; z-index:-1; right:clamp(1.5rem,8vw,8rem); top:50%; width:8px; height:8px; border-radius:50%; background:var(--orange); box-shadow:0 0 0 5px rgba(255,176,82,.18); }
          .eyebrow { margin:0 0 1rem; color:var(--orange); font:700 .7rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.16em; text-transform:uppercase; }
          h1 { max-width:9ch; margin:0; font:400 clamp(3.7rem,9vw,7.8rem)/.9 Georgia,'Times New Roman',serif; letter-spacing:-.045em; }
          header p:last-child { max-width:44rem; margin:1.6rem 0 0; color:rgba(255,255,255,.82); font-size:clamp(1rem,1.8vw,1.2rem); line-height:1.65; }
          main { position:relative; z-index:2; width:100%; margin-top:-60px; padding:clamp(4rem,7vw,6.5rem) max(1.25rem,calc((100vw - 1120px)/2)) 7rem; background:var(--mist); border-radius:60px 60px 0 0; box-shadow:0 -7px 20px rgba(7,55,70,.18); }
          .summary { display:flex; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; color:var(--sea); font:700 .7rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.13em; text-transform:uppercase; }
          table { width:100%; border-collapse:collapse; table-layout:fixed; background:var(--paper); }
          th { padding:1rem 1.1rem; color:white; background:var(--sea); text-align:left; font:700 .66rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.11em; text-transform:uppercase; }
          th:first-child { border-radius:16px 0 0 0; }
          th:last-child { border-radius:0 16px 0 0; }
          td { padding:1rem 1.1rem; border-bottom:1px solid var(--line); vertical-align:top; font-size:.88rem; line-height:1.5; }
          tr:last-child td { border-bottom:0; }
          th:nth-child(1),td:nth-child(1) { width:58%; }
          th:nth-child(2),td:nth-child(2) { width:17%; }
          th:nth-child(3),td:nth-child(3) { width:25%; }
          a { color:var(--sea-2); text-decoration-color:var(--orange); text-underline-offset:.25em; overflow-wrap:anywhere; }
          a:hover { color:#9a5708; }
          .langs { display:flex; flex-wrap:wrap; gap:.4rem; }
          .langs a { min-width:2.4rem; padding:.28rem .48rem; color:var(--sea); background:white; border:1px solid var(--line); border-radius:5px; text-align:center; text-decoration:none; font:700 .65rem/1.3 ui-monospace,SFMono-Regular,Menlo,monospace; text-transform:uppercase; }
          .langs a:hover { border-color:var(--orange); }
          .empty { color:var(--muted); }
          @media(max-width:700px) {
            header { min-height:370px; padding:4.5rem 1.25rem 6rem; }
            main { margin-top:-36px; padding:3.5rem 1rem 5rem; border-radius:36px 36px 0 0; }
            .summary { align-items:flex-end; }
            table,tbody,tr,td { display:block; }
            thead { display:none; }
            tr { padding:1rem; border-bottom:1px solid var(--line); }
            td,th:nth-child(n),td:nth-child(n) { width:100%; padding:.25rem 0; border:0; }
            td:nth-child(2):not(:empty)::before { content:'Обновлено: '; color:var(--muted); font-weight:700; }
            td:nth-child(3) { padding-top:.55rem; }
          }
        </style>
      </head>
      <body>
        <header>
          <p class="eyebrow">Navi.training · 46.1603° N · 1.1511° W</p>
          <h1>Карта маршрутов.</h1>
          <p>Машиночитаемый XML для поисковых систем — и понятный журнал всех канонических страниц Navi.training для человека.</p>
        </header>
        <main>
          <div class="summary"><span>Индексируемые адреса</span><span><xsl:value-of select="count(sm:urlset/sm:url)" /> URL</span></div>
          <table>
            <thead><tr><th>Канонический адрес</th><th>Обновлено</th><th>Языковые версии</th></tr></thead>
            <tbody>
              <xsl:for-each select="sm:urlset/sm:url">
                <tr>
                  <td><a href="{sm:loc}"><xsl:value-of select="sm:loc" /></a></td>
                  <td><xsl:value-of select="sm:lastmod" /></td>
                  <td><div class="langs">
                    <xsl:choose>
                      <xsl:when test="xhtml:link"><xsl:for-each select="xhtml:link"><a href="{@href}"><xsl:value-of select="@hreflang" /></a></xsl:for-each></xsl:when>
                      <xsl:otherwise><span class="empty">—</span></xsl:otherwise>
                    </xsl:choose>
                  </div></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
