<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex,follow"/>
<title>Sitemap | Dr. Rodrigo Pires</title>
<style>
  body{font-family:system-ui,sans-serif;margin:40px;background:#f3ebde;color:#212e51}
  main{max-width:820px;margin:auto}
  a{color:#212e51}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th{text-align:left;padding:10px 12px;border-bottom:2px solid #212e51;font-size:14px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:10px 12px;border-bottom:1px solid rgba(33,46,81,.15);word-break:break-all}
  tr:hover td{background:rgba(33,46,81,.06)}
  .count{opacity:.7;font-size:14px}
</style>
</head>
<body>
<main>
<p>Dr. Rodrigo Pires</p>
<h1>Sitemap</h1>
<p class="count"><xsl:value-of select="count(//sm:url)"/> URLs indexadas</p>
<table>
<tr><th>URL</th></tr>
<xsl:for-each select="//sm:url">
<tr>
<td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
</tr>
</xsl:for-each>
</table>
</main>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
