import { TemplateEngine } from '../../../modules/docgen/services/TemplateEngine'

describe('TemplateEngine', () => {
  it('remplace {{var}} simple', () => {
    const result = TemplateEngine.render('<p>{{nom}}</p>', { nom: 'Alice' })
    expect(result).toBe('<p>Alice</p>')
  })

  it('remplace {{obj.prop}}', () => {
    const result = TemplateEngine.render('<p>{{etudiant.nom}}</p>', { etudiant: { nom: 'Bob' } })
    expect(result).toBe('<p>Bob</p>')
  })

  it('remplace {{obj.prop.prop}} imbriqué', () => {
    const result = TemplateEngine.render('<p>{{a.b.c}}</p>', { a: { b: { c: 'deep' } } })
    expect(result).toBe('<p>deep</p>')
  })

  it('laisse {{inconnu}} vide si absent', () => {
    const result = TemplateEngine.render('<p>{{inconnu}}</p>', {})
    expect(result).toBe('<p></p>')
  })

  it('gère #each sur un tableau', () => {
    const template = '{{#each items}}<li>{{this}}</li>{{/each}}'
    const result = TemplateEngine.render(template, { items: ['A', 'B', 'C'] })
    expect(result).toBe('<li>A</li><li>B</li><li>C</li>')
  })

  it('gère #each avec obj.prop', () => {
    const template = '{{#each etudiants}}<li>{{nom}}</li>{{/each}}'
    const result = TemplateEngine.render(template, { etudiants: [{ nom: 'Alice' }, { nom: 'Bob' }] })
    expect(result).toBe('<li>Alice</li><li>Bob</li>')
  })

  it('gère #if true', () => {
    const template = '{{#if show}}visible{{/if}}'
    expect(TemplateEngine.render(template, { show: true })).toBe('visible')
    expect(TemplateEngine.render(template, { show: 'ok' })).toBe('visible')
    expect(TemplateEngine.render(template, { show: 1 })).toBe('visible')
  })

  it('gère #if false', () => {
    const template = '{{#if show}}visible{{/if}}'
    expect(TemplateEngine.render(template, { show: false })).toBe('')
    expect(TemplateEngine.render(template, { show: null })).toBe('')
    expect(TemplateEngine.render(template, {})).toBe('')
  })

  it('gère #if avec #else', () => {
    const template = '{{#if show}}oui{{else}}non{{/if}}'
    expect(TemplateEngine.render(template, { show: true })).toBe('oui')
    expect(TemplateEngine.render(template, { show: false })).toBe('non')
  })

  it('gère #each et #if imbriqués', () => {
    const template = '{{#each items}}{{#if actif}}{{nom}}{{/if}}{{/each}}'
    const data = { items: [{ nom: 'A', actif: true }, { nom: 'B', actif: false }, { nom: 'C', actif: true }] }
    expect(TemplateEngine.render(template, data)).toBe('AC')
  })

  it('gère plusieurs #each imbriqués', () => {
    const template = '{{#each groupes}}{{#each membres}}{{this}}{{/each}}{{/each}}'
    const data = { groupes: [{ membres: ['X', 'Y'] }, { membres: ['Z'] }] }
    expect(TemplateEngine.render(template, data)).toBe('XYZ')
  })

  it('ne modifie pas le HTML sans variables', () => {
    const html = '<html><body><h1>Titre</h1></body></html>'
    expect(TemplateEngine.render(html, {})).toBe(html)
  })

  it('gère les variables avec des espaces', () => {
    const result = TemplateEngine.render('<p>{{ nom }}</p>', { nom: 'Alice' })
    expect(result).toBe('<p>Alice</p>')
  })
})
