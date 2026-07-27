const DANGEROUS_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'base', 'form', 'input', 'button']
const DANGEROUS_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onsubmit', 'onchange', 'onfocus', 'onblur', 'onabort', 'onbeforeunload', 'onhashchange', 'onpageshow', 'onpopstate', 'onredo', 'onresize', 'onscroll', 'onstorage', 'onundo', 'onunload', 'srcdoc', 'action', 'formaction', 'xlink:href', 'xlink:actuate', 'xlink:show', 'xlink:type']

export function sanitizeHtml(html: string): string {
  let result = html
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\/${tag}>|<${tag}[^>]*\\/>`, 'gi')
    result = result.replace(regex, '')
  })
  DANGEROUS_ATTR.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi')
    result = result.replace(regex, '')
  })
  const hrefRegex = /href\s*=\s*["']javascript:[^"']*["']/gi
  result = result.replace(hrefRegex, 'href="#"')
  return result
}
