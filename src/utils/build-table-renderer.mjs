/*
 * @Author: fzq
 * @Date: 2025-10-22 11:51:56
 * @LastEditors: fzq
 * @LastEditTime: 2025-10-22 11:52:02
 * @Description: 
 * @FilePath: \web\src\utils\build-table-renderer.mjs
 */
// scripts/build-table-renderer.mjs
import { readdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

function getFileNames(dir) {
  const dirents = readdirSync(dir, { withFileTypes: true })
  const fileNames = []
  for (const d of dirents) {
    if (!d.isDirectory() && d.name.endsWith('.vue')) {
      fileNames.push(d.name.replace('.vue', ''))
    }
  }
  return fileNames
}

function trimPipeSuffix(s) {
  // 去掉末尾的 "    | "（与原来 trimEnd 等效）
  return s.replace(/\s+\|\s*$/s, '')
}

function buildTableRendererType() {
  const base = resolve('./src/components/table/fieldRender/')
  let tableRenderer = getFileNames(base)

  tableRenderer.push('slot')
  tableRenderer = tableRenderer.filter((x) => x !== 'default')

  let content =
    '// 可用的表格单元格渲染器，本文件内容以 ./src/components/table/fieldRender/ 目录中的文件名自动生成\n' +
    'type tableRenderer =\n    | '

  for (const name of tableRenderer) {
    content += `'${name}'\n    | `
  }
  content = trimPipeSuffix(content)

  writeFileSync('./types/tableRenderer.d.ts', content, 'utf-8')
}

buildTableRendererType()
